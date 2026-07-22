import { spawn, spawnSync } from "node:child_process";
import path from "node:path";

const root = process.cwd();
const supabaseCli = path.join(root, "node_modules", "supabase", "dist", "supabase.js");
const nextCli = path.join(root, "apps", "web", "node_modules", "next", "dist", "bin", "next");
const port = 3100;
const origin = `http://127.0.0.1:${port}`;

function capture(command, args) {
  const result = spawnSync(command, args, { cwd: root, encoding: "utf8" });
  if (result.status !== 0) {
    process.stderr.write(result.stderr || result.stdout || result.error?.message || "");
    process.exit(result.status ?? 1);
  }
  return result.stdout;
}

const status = JSON.parse(capture(process.execPath, [supabaseCli, "status", "-o", "json"]));
if (!/^http:\/\/(127\.0\.0\.1|localhost):/.test(status.API_URL)) {
  throw new Error("Production-like probe refuses to use a non-local Supabase project.");
}

const environment = {
  ...process.env,
  NODE_ENV: "production",
  APP_ENV: "staging",
  BUILD_VERSION: "phase-5d-production-probe",
  APP_URL: origin,
  NEXT_PUBLIC_SUPABASE_URL: status.API_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: status.ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: status.SERVICE_ROLE_KEY,
  EMAIL_PROVIDER: "resend",
  RESEND_API_KEY: "phase-4d-local-probe-only",
  EMAIL_FROM: "Closeout Probe <noreply@example.invalid>",
  LOG_LEVEL: "warn",
  SENTRY_ENABLED: "false",
  UPSTASH_REDIS_REST_URL: "http://127.0.0.1:54324",
  UPSTASH_REDIS_REST_TOKEN: "phase-4d-local-probe-only",
  RECOVERY_CODE_PEPPER: "phase-4d-local-production-probe-pepper-not-for-production"
};

const server = spawn(
  process.execPath,
  [nextCli, "start", "apps/web", "--hostname", "127.0.0.1", "--port", String(port)],
  {
    cwd: root,
    env: environment,
    stdio: ["ignore", "pipe", "pipe"]
  }
);
let serverOutput = "";
server.stdout.on("data", (chunk) => {
  serverOutput += chunk.toString();
});
server.stderr.on("data", (chunk) => {
  serverOutput += chunk.toString();
});

async function waitForServer() {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    if (server.exitCode !== null) throw new Error(serverOutput);
    try {
      const response = await fetch(`${origin}/api/health`, { redirect: "manual" });
      if (response.ok) return;
    } catch {
      // The production server is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`Production-like server did not become ready.\n${serverOutput}`);
}

function auditCount() {
  return Number(
    capture("docker", [
      "exec",
      "supabase_db_closeoutflow",
      "psql",
      "-U",
      "postgres",
      "-d",
      "postgres",
      "-Atc",
      "select count(*) from audit.audit_events"
    ]).trim()
  );
}

try {
  await waitForServer();
  const beforeHealth = auditCount();
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const health = await fetch(`${origin}/api/health`, { redirect: "manual" });
    if (!health.ok) throw new Error(`Health probe failed with ${health.status}.`);
  }
  const afterHealth = auditCount();
  if (afterHealth !== beforeHealth) {
    throw new Error("Repeated health requests created audit rows.");
  }

  const signIn = await fetch(`${origin}/sign-in`, { redirect: "manual" });
  const body = await signIn.text();
  const csp = signIn.headers.get("content-security-policy") ?? "";
  const scriptPolicy =
    csp
      .split(";")
      .map((directive) => directive.trim())
      .find((directive) => directive.startsWith("script-src ")) ?? "";
  const requestId = signIn.headers.get("x-request-id") ?? "";
  if (signIn.status !== 200 || !body.includes("Closeout")) {
    throw new Error("Production-like sign-in route failed branding/render probe.");
  }
  if (
    !body.includes('rel="canonical"') ||
    !body.includes("https://closeoutflow.com") ||
    !body.includes("<title>Sign in")
  ) {
    throw new Error("Production metadata or canonical URL probe failed.");
  }
  if (
    !scriptPolicy.includes("'strict-dynamic'") ||
    scriptPolicy.includes("'unsafe-inline'") ||
    scriptPolicy.includes("'unsafe-eval'")
  ) {
    throw new Error("Production CSP nonce policy failed.");
  }
  if (!/^[0-9a-f-]{36}$/.test(requestId)) {
    throw new Error("Production response is missing its server-generated request ID.");
  }
  for (const header of [
    "strict-transport-security",
    "x-content-type-options",
    "referrer-policy",
    "permissions-policy"
  ]) {
    if (!signIn.headers.has(header)) throw new Error(`Missing security header: ${header}`);
  }

  for (const route of [
    "/dashboard",
    "/projects",
    "/projects/50000000-0000-4000-8000-000000000002",
    "/companies",
    "/contacts"
  ]) {
    const response = await fetch(`${origin}${route}`, { redirect: "manual" });
    if (
      ![307, 308].includes(response.status) ||
      !response.headers.get("location")?.includes("/sign-in")
    ) {
      throw new Error(`Protected-route production redirect failed: ${route}`);
    }
  }
  const design = await fetch(`${origin}/design`, { redirect: "manual" });
  if (design.status !== 404) throw new Error("Runtime design-gallery gate failed.");
  for (const route of ["/sign-up", "/forgot-password"]) {
    const response = await fetch(`${origin}${route}`, { redirect: "manual" });
    const routeBody = await response.text();
    if (response.status !== 200 || !routeBody.includes("Closeout")) {
      throw new Error(`Production-like public auth route failed: ${route}`);
    }
  }
  const unavailableInvite = await fetch(`${origin}/invite/${"x".repeat(48)}`, {
    redirect: "manual"
  });
  if (
    unavailableInvite.status !== 200 ||
    !(await unavailableInvite.text()).includes("Invitation unavailable")
  ) {
    throw new Error("Production-like safe invitation route probe failed.");
  }
  const hostileRedirect = await fetch(
    `${origin}/sign-in?next=${encodeURIComponent("https://evil.example")}`,
    { redirect: "manual" }
  );
  const hostileBody = await hostileRedirect.text();
  if (!hostileBody.includes('value="/dashboard"')) {
    throw new Error("Production-like hostile redirect normalization failed.");
  }
  const secondSignIn = await fetch(`${origin}/sign-in`, { redirect: "manual" });
  if (secondSignIn.headers.get("content-security-policy") === csp) {
    throw new Error("Production CSP nonce was reused across requests.");
  }

  console.log(
    "Production-like staging probe passed: local-only config, public auth and safe invitation routes, canonical metadata, hostile redirects, protected dashboard/project/directory routes, design 404, unique nonce CSP, security headers, request ID, and zero health audit writes."
  );
} finally {
  server.kill("SIGTERM");
  await Promise.race([
    new Promise((resolve) => server.once("exit", resolve)),
    new Promise((resolve) => setTimeout(resolve, 5000))
  ]);
  if (server.exitCode === null) server.kill("SIGKILL");
}
