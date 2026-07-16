import { spawnSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import path from "node:path";

const cli = path.join(process.cwd(), "node_modules", "supabase", "dist", "supabase.js");
const result = spawnSync(
  process.execPath,
  [cli, "gen", "types", "typescript", "--local", "--schema", "public,audit"],
  { encoding: "utf8" }
);

if (result.status !== 0) {
  process.stderr.write(
    result.stderr || result.stdout || result.error?.message || "Type generation failed.\n"
  );
  process.exit(result.status ?? 1);
}

const target = path.join(process.cwd(), "packages", "db", "src", "types.generated.ts");
writeFileSync(target, result.stdout.trimEnd() + "\n", "utf8");
console.log("Generated " + path.relative(process.cwd(), target));
