import { spawnSync } from "node:child_process";
import path from "node:path";

const root = process.cwd();
const supabaseCli = path.join(root, "node_modules", "supabase", "dist", "supabase.js");

function run(command, args) {
  return spawnSync(command, args, { cwd: root, encoding: "utf8" });
}

const statusResult = run(process.execPath, [supabaseCli, "status", "-o", "json"]);
if (statusResult.status !== 0) {
  process.stderr.write(statusResult.stderr || statusResult.stdout);
  process.exit(statusResult.status ?? 1);
}
const status = JSON.parse(statusResult.stdout);
if (!/^http:\/\/(127\.0\.0\.1|localhost):/.test(status.API_URL)) {
  throw new Error("Live database probe refuses to use a non-local Supabase project.");
}

const seedAuditEvent = run("docker", [
  "exec",
  "supabase_db_closeoutflow",
  "psql",
  "-U",
  "postgres",
  "-d",
  "postgres",
  "-v",
  "ON_ERROR_STOP=1",
  "-c",
  "select public.write_audit_event('system','phase4d_live_probe','phase4d.live_probe','phase4d-live-probe','web')"
]);
if (seedAuditEvent.status !== 0) {
  throw new Error(seedAuditEvent.stderr || seedAuditEvent.stdout);
}

for (const statement of [
  "update audit.audit_events set metadata = '{}'::jsonb",
  "delete from audit.audit_events",
  "truncate table audit.audit_events"
]) {
  const result = run("docker", [
    "exec",
    "supabase_db_closeoutflow",
    "psql",
    "-U",
    "postgres",
    "-d",
    "postgres",
    "-v",
    "ON_ERROR_STOP=1",
    "-c",
    statement
  ]);
  const output = `${result.stdout}${result.stderr}`;
  if (result.status === 0 || !/audit events are (immutable|append-only)/i.test(output)) {
    throw new Error(`Audit mutation was not blocked as expected: ${statement}\n${output}`);
  }
}

for (const headers of [{ "Accept-Profile": "audit" }, { "Content-Profile": "audit" }]) {
  const response = await fetch(`${status.API_URL}/rest/v1/audit_events?select=id`, {
    headers: {
      apikey: status.ANON_KEY,
      Authorization: `Bearer ${status.ANON_KEY}`,
      ...headers
    }
  });
  if (response.ok) throw new Error("The audit schema became available through PostgREST.");
}

console.log(
  "Live database security probe passed: audit UPDATE, DELETE, and TRUNCATE are blocked and the audit schema is unavailable through PostgREST."
);
