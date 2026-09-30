/**
 * Schema versioning. Each entry upgrades a document from version N to N+1.
 * Migrations operate on raw JSON so they can run before validation.
 */
export const CURRENT_VERSION = 1;

type Doc = Record<string, unknown>;
type Migration = (doc: Doc) => Doc;

/** migrations[n] upgrades version n → n+1. Empty until a breaking change ships. */
const migrations: Record<number, Migration> = {};

export type MigrateResult =
  | { success: true; data: unknown }
  | { success: false; errors: { path: string; message: string }[] };

export function migratePopup(input: unknown): MigrateResult {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    return { success: false, errors: [{ path: "", message: "popup must be an object" }] };
  }
  let doc = input as Doc;
  const version = doc.version;
  if (typeof version !== "number" || !Number.isInteger(version) || version < 1) {
    return { success: false, errors: [{ path: "version", message: "version must be a positive integer" }] };
  }
  if (version > CURRENT_VERSION) {
    return {
      success: false,
      errors: [{ path: "version", message: `version ${version} is newer than supported (${CURRENT_VERSION})` }],
    };
  }
  for (let v = version; v < CURRENT_VERSION; v++) {
    const step = migrations[v];
    if (!step) {
      return { success: false, errors: [{ path: "version", message: `no migration from version ${v}` }] };
    }
    doc = { ...step(doc), version: v + 1 };
  }
  return { success: true, data: doc };
}
