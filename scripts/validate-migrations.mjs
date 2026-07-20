import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const directory = path.join(process.cwd(), "supabase", "migrations");
const names = (await readdir(directory)).filter((name) => name.endsWith(".sql")).sort();
const errors = [];

function containsTableCreation(sql, table) {
  const escapedTable = table.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const optionalSchema = '(?:(?:"[^"]+"|[a-z_][a-z0-9_$]*)\\s*\\.\\s*)?';
  const tableIdentifier = `(?:"${escapedTable}"|${escapedTable})`;
  const pattern = new RegExp(
    `\\bcreate\\s+(?:unlogged\\s+)?table\\s+(?:if\\s+not\\s+exists\\s+)?${optionalSchema}${tableIdentifier}(?=\\s|\\()`,
    "i"
  );
  return pattern.test(sql);
}

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

const approvedPhase4Tables = new Set([
  "organizations",
  "organization_memberships",
  "organization_invitations",
  "organization_ownership_transfers",
  "platform_roles",
  "user_profiles",
  "user_preferences",
  "user_security_events"
]);

const forbiddenBusinessTables = [
  "memberships",
  "projects",
  "requirements",
  "submissions",
  "documents",
  "reviews",
  "packages",
  "notifications",
  "billing"
];
// Phase 5 must explicitly extend this list and the approved-table allowlist when
// its product schema is authorized. Until then, every known business table is
// prohibited and the guard self-tests both schema-qualified and quoted forms.
for (const table of forbiddenBusinessTables) {
  if (containsTableCreation(combined, table)) {
    errors.push("Forbidden business table found before Phase 5: " + table + ".");
  }
}

for (const table of approvedPhase4Tables) {
  if (!containsTableCreation(combined, table)) {
    errors.push("Missing approved Phase 4 identity table: " + table + ".");
  }
}

for (const [sql, table] of [
  ['create table if not exists "public"."projects" (id uuid);', "projects"],
  ['create unlogged table "requirements" (id uuid);', "requirements"],
  ["create table submissions(id uuid);", "submissions"],
  ['create table public."documents" (id uuid);', "documents"],
  ["create table if not exists reviews (id uuid);", "reviews"],
  ["create unlogged table public.packages(id uuid);", "packages"],
  ["create table notifications (id uuid);", "notifications"],
  ["create table public.billing(id uuid);", "billing"]
]) {
  if (!containsTableCreation(sql, table)) {
    errors.push("Migration business-table guard failed its self-test for " + table + ".");
  }
}

for (const table of approvedPhase4Tables) {
  const sql = `create table public.${table} (id uuid);`;
  if (!containsTableCreation(sql, table)) {
    errors.push("Phase 4 allowlist guard failed its self-test for " + table + ".");
  }
}

for (const required of [
  "create schema if not exists audit",
  "alter table audit.audit_events enable row level security",
  "alter table audit.audit_events force row level security",
  "create trigger audit_events_immutable",
  "create trigger audit_events_immutable_truncate",
  "create or replace function public.write_audit_event",
  "create or replace function public.database_health_check"
]) {
  if (!combined.includes(required)) errors.push("Missing migration invariant: " + required + ".");
}

if (errors.length > 0) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(
  "Migration files are ordered, limited to infrastructure and approved Phase 4 identity tables, and include audit/RLS invariants."
);
