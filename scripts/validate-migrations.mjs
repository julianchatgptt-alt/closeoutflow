import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const directory = path.join(process.cwd(), "supabase", "migrations");

export function containsTableCreation(sql, table) {
  const escapedTable = table.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const optionalSchema = '(?:(?:"[^"]+"|[a-z_][a-z0-9_$]*)\\s*\\.\\s*)?';
  const tableIdentifier = `(?:"${escapedTable}"|${escapedTable})`;
  const pattern = new RegExp(
    `\\bcreate\\s+(?:unlogged\\s+)?table\\s+(?:if\\s+not\\s+exists\\s+)?${optionalSchema}${tableIdentifier}(?=\\s|\\()`,
    "i"
  );
  return pattern.test(sql);
}

export const approvedApplicationTables = new Set([
  "organizations",
  "organization_memberships",
  "organization_invitations",
  "organization_ownership_transfers",
  "platform_roles",
  "user_profiles",
  "user_preferences",
  "user_security_events",
  "projects",
  "companies",
  "contacts",
  "company_contacts",
  "project_companies",
  "project_contacts",
  "project_members",
  "requirement_categories",
  "requirement_templates",
  "requirement_template_items",
  "project_requirements"
]);

export const forbiddenBusinessTables = new Set([
  "memberships",
  "requirements",
  "submissions",
  "documents",
  "document_versions",
  "reviews",
  "packages",
  "equipment",
  "warranties",
  "inspections",
  "training",
  "lien_waivers",
  "drawings",
  "notifications",
  "billing"
]);

export function createdApplicationTables(sql) {
  const pattern =
    /\bcreate\s+(?:unlogged\s+)?table\s+(?:if\s+not\s+exists\s+)?(?:(?:"?([a-z_][a-z0-9_$]*)"?)\s*\.\s*)?"?([a-z_][a-z0-9_$]*)"?(?=\s|\()/gi;
  return [...sql.matchAll(pattern)].flatMap((match) => {
    const schema = match[1]?.toLowerCase();
    const table = match[2]?.toLowerCase();
    return table && (!schema || schema === "public") ? [table] : [];
  });
}

export function validateApplicationTables(sql) {
  const tableErrors = [];
  for (const table of createdApplicationTables(sql)) {
    if (forbiddenBusinessTables.has(table)) {
      tableErrors.push("Forbidden out-of-phase table found: " + table + ".");
    } else if (!approvedApplicationTables.has(table)) {
      tableErrors.push("Unknown application table is not allowlisted: " + table + ".");
    }
  }
  return tableErrors;
}

const approvedPhase4Tables = new Set([...approvedApplicationTables].slice(0, 8));
const approvedPhase5Tables = new Set([...approvedApplicationTables].slice(8, 15));
const approvedPhase6Tables = new Set([...approvedApplicationTables].slice(15));

export async function validateMigrations(migrationsDirectory = directory) {
  const names = (await readdir(migrationsDirectory)).filter((name) => name.endsWith(".sql")).sort();
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
    combined += "\n" + (await readFile(path.join(migrationsDirectory, name), "utf8")).toLowerCase();
  }

  // Phase 6 must explicitly extend the allowlist when its schema is authorized.
  // Requirement, document, review, package, and later-phase tables stay forbidden.
  for (const table of forbiddenBusinessTables) {
    if (containsTableCreation(combined, table)) {
      errors.push("Forbidden out-of-phase table found: " + table + ".");
    }
  }

  errors.push(...validateApplicationTables(combined));

  for (const table of approvedPhase4Tables) {
    if (!containsTableCreation(combined, table)) {
      errors.push("Missing approved Phase 4 identity table: " + table + ".");
    }
  }

  for (const table of approvedPhase5Tables) {
    if (!containsTableCreation(combined, table)) {
      errors.push("Missing approved Phase 5 project-foundation table: " + table + ".");
    }
  }

  for (const table of approvedPhase6Tables) {
    if (!containsTableCreation(combined, table)) {
      errors.push("Missing approved Phase 6 requirement-foundation table: " + table + ".");
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

  for (const table of approvedApplicationTables) {
    const sql = `create table public.${table} (id uuid);`;
    if (!containsTableCreation(sql, table)) {
      errors.push("Application-table allowlist guard failed its self-test for " + table + ".");
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
  return errors;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const errors = await validateMigrations();
  if (errors.length > 0) {
    console.error(errors.join("\n"));
    process.exit(1);
  }
  console.log(
    "Migration files are ordered, limited to infrastructure plus approved Phase 4/5 tables, and include audit/RLS invariants."
  );
}
