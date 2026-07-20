export const approvedApplicationTables: ReadonlySet<string>;
export const forbiddenBusinessTables: ReadonlySet<string>;
export function containsTableCreation(sql: string, table: string): boolean;
export function createdApplicationTables(sql: string): string[];
export function validateApplicationTables(sql: string): string[];
export function validateMigrations(migrationsDirectory?: string): Promise<string[]>;
