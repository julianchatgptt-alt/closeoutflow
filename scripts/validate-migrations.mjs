import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const directory = path.join(process.cwd(), "supabase", "migrations");
const names = (await readdir(directory)).filter((name) => name.endsWith(".sql")).sort();
const errors = [];

if (names.length === 0) errors.push("No migrations found.");

const versions = new Set();
let combined = "";
for (const name of names) {
  const match = /^(\d+)_([a-z0-9_]+)\.sql$/.exec(name);
  if (!match) {
    errors.push(name + " does not use the required numeric_descriptive.sql convention.");
    continue;
  }
  if (versions.has(match[1])) errors.push("Duplicate migration version " + match[1] + ".");
  versions.add(match[1]);
  combined += "\n" + (await readFile(path.join(directory, name), "utf8")).toLowerCase();
}

const forbiddenBusinessTables = [
  "organizations",
  "memberships",
  "projects",
  "requirements",
  "submissions",
  "documents",
  "reviews",
  "notifications",
  "billing"
];
for (const table of forbiddenBusinessTables) {
  if (
    combined.includes("create table " + table) ||
    combined.includes("create table public." + table)
  ) {
    errors.push("Business table found during Phase 2: " + table + ".");
  }
}

for (const required of [
  "create schema if not exists audit",
  "alter table audit.audit_events enable row level security",
  "alter table audit.audit_events force row level security",
  "create trigger audit_events_immutable"
]) {
  if (!combined.includes(required)) errors.push("Missing migration invariant: " + required + ".");
}

if (errors.length > 0) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log("Migration files are ordered, infrastructure-only, and include audit/RLS invariants.");
