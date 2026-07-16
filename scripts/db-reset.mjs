import { spawnSync } from "node:child_process";
import path from "node:path";

const cli = path.join(process.cwd(), "node_modules", "supabase", "dist", "supabase.js");
const result = spawnSync(process.execPath, [cli, "db", "reset", "--local"], { stdio: "inherit" });

if (result.error) console.error(result.error.message);
process.exit(result.status ?? 1);
