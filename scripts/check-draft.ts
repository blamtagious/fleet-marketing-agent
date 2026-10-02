import { readFileSync } from "node:fs";
import { checkGuardrails, formatReport, type ContentType } from "../src/guardrails.js";

const [file, type] = process.argv.slice(2);
if (!file) {
  console.log("Usage: npm run check -- <file.md> [email|one_pager|social|web|handout|letter|other]");
  process.exit(1);
}
const raw = readFileSync(file, "utf8");
// Strip YAML front matter if present so the metadata isn't checked as copy.
const body = raw.startsWith("---") ? raw.replace(/^---[\s\S]*?\n---\n?/, "") : raw;
const report = checkGuardrails(body, (type as ContentType) ?? "other");
console.log(formatReport(report));
process.exit(report.status === "fail" ? 1 : 0);
