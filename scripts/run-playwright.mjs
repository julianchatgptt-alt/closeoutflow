import { spawnSync } from "node:child_process";
import { readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const supabaseCli = path.join(root, "node_modules", "supabase", "dist", "supabase.js");
const pnpmCli = process.env.npm_execpath;
const authState = path.join(root, "playwright", ".auth");
const playwrightBuildDirectory = path.join(root, "apps", "web", ".next-playwright");
const nextEnvironmentFile = path.join(root, "apps", "web", "next-env.d.ts");
const originalNextEnvironment = readFileSync(nextEnvironmentFile, "utf8");

if (!pnpmCli) {
  console.error("Run the browser harness through pnpm.");
  process.exit(1);
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: "utf8",
    ...options
  });
  if (result.status !== 0) {
    process.stderr.write(result.stderr || result.stdout || result.error?.message || "");
    process.exit(result.status ?? 1);
  }
  return result.stdout;
}

function cleanAuthState() {
  rmSync(authState, {
    recursive: true,
    force: true,
    maxRetries: 10,
    retryDelay: 100
  });
}

function cleanPlaywrightBuild() {
  rmSync(playwrightBuildDirectory, {
    recursive: true,
    force: true,
    maxRetries: 10,
    retryDelay: 100
  });
}

cleanAuthState();
cleanPlaywrightBuild();
run(process.execPath, [supabaseCli, "start"]);
run(process.execPath, [supabaseCli, "db", "reset", "--local"], { stdio: "inherit" });

const status = JSON.parse(run(process.execPath, [supabaseCli, "status", "-o", "json"]));
const environment = {
  ...process.env,
  APP_ENV: "test",
  BUILD_VERSION: "phase-5b-browser-harness",
  NEXT_DIST_DIR: ".next-playwright",
  APP_URL: "http://127.0.0.1:3000",
  NEXT_PUBLIC_SUPABASE_URL: status.API_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: status.ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: status.SERVICE_ROLE_KEY,
  EMAIL_PROVIDER: "mailpit",
  MAILPIT_URL: status.MAILPIT_URL,
  LOG_LEVEL: "warn",
  SENTRY_ENABLED: "false",
  RECOVERY_CODE_PEPPER: "phase-4d-local-browser-recovery-pepper-not-for-production",
  PLAYWRIGHT_MANAGED_HARNESS: "1"
};

try {
  const result = spawnSync(
    process.execPath,
    [pnpmCli, "exec", "playwright", "test", ...process.argv.slice(2)],
    { cwd: root, env: environment, stdio: "inherit" }
  );
  process.exitCode = result.status ?? 1;
} finally {
  cleanAuthState();
  cleanPlaywrightBuild();
  writeFileSync(nextEnvironmentFile, originalNextEnvironment);
}
