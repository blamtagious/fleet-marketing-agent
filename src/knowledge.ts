import { readdirSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
export const PROJECT_ROOT = join(here, "..");
export const KNOWLEDGE_DIR = join(PROJECT_ROOT, "knowledge");
export const DRAFTS_DIR = join(PROJECT_ROOT, "drafts");
export const RESEARCH_DIR = join(PROJECT_ROOT, "research");
export const DATA_DIR = join(PROJECT_ROOT, "data");
export const TEMPLATES_DIR = join(PROJECT_ROOT, "templates");

/** Concatenate every knowledge/*.md file, in filename order, into one string. */
export function loadKnowledge(): string {
  const files = readdirSync(KNOWLEDGE_DIR)
    .filter((f) => f.endsWith(".md"))
    .sort();
  return files
    .map((f) => readFileSync(join(KNOWLEDGE_DIR, f), "utf8").trim())
    .join("\n\n---\n\n");
}

export function loadOpenItems(): string {
  return readFileSync(join(KNOWLEDGE_DIR, "12-open-items.md"), "utf8");
}
