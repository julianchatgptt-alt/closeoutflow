import { spawnSync } from "node:child_process";
import path from "node:path";

const root = process.cwd();
const supabaseCli = path.join(root, "node_modules", "supabase", "dist", "supabase.js");
const pnpmCli = process.env.npm_execpath;

if (!pnpmCli) {
  console.error("Run database tests through pnpm.");
  process.exit(1);
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { cwd: root, encoding: "utf8", ...options });
  if (result.status !== 0) {
    process.stderr.write(result.stderr || result.stdout || result.error?.message || "");
    process.exit(result.status ?? 1);
  }
  return result.stdout;
}

run(process.execPath, [supabaseCli, "test", "db"], { stdio: "inherit" });
const status = JSON.parse(run(process.execPath, [supabaseCli, "status", "-o", "json"]));
run(process.execPath, [pnpmCli, "exec", "vitest", "run", "--config", "vitest.live.config.ts"], {
  stdio: "inherit",
  env: {
    ...process.env,
    LOCAL_SUPABASE_URL: status.API_URL,
    LOCAL_SUPABASE_ANON_KEY: status.ANON_KEY
  }
});
