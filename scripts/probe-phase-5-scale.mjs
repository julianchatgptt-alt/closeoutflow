import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";

const root = process.cwd();
const sql = readFileSync(path.join(root, "scripts", "phase-5-scale.sql"), "utf8");
const result = spawnSync(
  "docker",
  [
    "exec",
    "-i",
    "supabase_db_closeoutflow",
    "psql",
    "-U",
    "postgres",
    "-d",
    "postgres",
    "-v",
    "ON_ERROR_STOP=1"
  ],
  { cwd: root, encoding: "utf8", input: sql }
);

if (result.status !== 0) {
  process.stderr.write(result.stderr || result.stdout || result.error?.message || "");
  process.exit(result.status ?? 1);
}

process.stdout.write(result.stdout);
console.log("Phase 5 scale validation passed; the transaction was rolled back.");
