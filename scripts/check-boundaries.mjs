import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const sourceRoots = ["apps", "packages"];
const extensions = new Set([".js", ".mjs", ".cjs", ".ts", ".tsx"]);
const violations = [];

async function walk(directory) {
  let entries;
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch {
    return [];
  }

  const files = [];
  for (const entry of entries) {
    if (["node_modules", ".next", ".turbo", "dist"].includes(entry.name)) continue;
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(fullPath)));
    else if (extensions.has(path.extname(entry.name))) files.push(fullPath);
  }
  return files;
}

for (const sourceRoot of sourceRoots) {
  for (const file of await walk(path.join(root, sourceRoot))) {
    const relative = path.relative(root, file).replaceAll(path.sep, "/");
    const source = await readFile(file, "utf8");
    const imports = [...source.matchAll(/(?:from\s+|import\s*\()(["'])([^"']+)\1/g)].map(
      (match) => match[2]
    );

    for (const specifier of imports) {
      if (!specifier) continue;
      if (relative.startsWith("packages/") && specifier.includes("apps/")) {
        violations.push(relative + ": packages may not import apps (" + specifier + ")");
      }
      if (
        relative.startsWith("packages/ui/") &&
        (specifier.startsWith("@closeoutflow/db") ||
          specifier.startsWith("@closeoutflow/authz") ||
          specifier.startsWith("@supabase/"))
      ) {
        violations.push(relative + ": UI may not import data/auth packages (" + specifier + ")");
      }
      if (/^@closeoutflow\/[^/]+\/src\//.test(specifier)) {
        violations.push(relative + ": package internals are private (" + specifier + ")");
      }
    }
  }
}

if (violations.length > 0) {
  console.error(violations.join("\n"));
  process.exit(1);
}

console.log("Workspace import boundaries passed.");
