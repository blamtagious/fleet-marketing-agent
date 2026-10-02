import { tool, createSdkMcpServer } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { checkGuardrails, formatReport, type ContentType } from "../guardrails.js";
import { DATA_DIR, DRAFTS_DIR, loadOpenItems } from "../knowledge.js";
import { fiscalCalendar } from "./fiscalCalendar.js";
import { searchLeads } from "./leads.js";
import { searchStock } from "./stock.js";

const CONTENT_TYPES = ["email", "one_pager", "social", "web", "handout", "letter", "internal", "other"] as const;

const guardrailCheck = tool(
  "guardrail_check",
  "Check customer-facing copy against the department's guardrails and voice rules (no prices, no lead-time promises, no eligibility claims, no named customers, no internal terms, no exclamation marks, no retail language, opt-out on emails, correct routing). Returns PASS, WARN or FAIL with each finding and a fix. Run this on every draft before presenting or saving it.",
  {
    text: z.string().describe("The full draft text to check"),
    content_type: z.enum(CONTENT_TYPES).describe("What kind of piece this is. Use 'internal' for research briefs and plans that will not be sent to customers."),
  },
  async ({ text, content_type }) => {
    const report = checkGuardrails(text, content_type as ContentType);
    return {
      content: [{ type: "text", text: formatReport(report) }],
      structuredContent: report as unknown as Record<string, unknown>,
    };
  },
  { annotations: { readOnlyHint: true, openWorldHint: false } },
);

const saveDraft = tool(
  "save_draft",
  "Save a finished draft to the drafts folder for human approval. Runs guardrail_check first and refuses to save customer-facing copy that has errors. The file gets YAML front matter with status needs_approval. Returns the path and the guardrail result.",
  {
    title: z.string().describe("Short human title, e.g. 'TSA October pre-event email to sheriffs'"),
    content_type: z.enum(CONTENT_TYPES),
    audience: z.string().describe("Segment or recipient group, e.g. 'County sheriffs, Tennessee'"),
    channel: z.string().optional().describe("email, print, web, LinkedIn, booth, internal"),
    body: z.string().describe("The full draft in Markdown"),
    handoff_notes: z.string().optional().describe("What the approver should check, open items used, who sends it"),
    sender: z.string().optional().describe("Who should send it: a named rep or Jason"),
  },
  async ({ title, content_type, audience, channel, body, handoff_notes, sender }) => {
    const report = checkGuardrails(body, content_type as ContentType);
    if (report.errors > 0) {
      return {
        content: [{ type: "text", text: `Not saved. Fix the errors first.\n\n${formatReport(report)}` }],
        isError: true,
      };
    }
    mkdirSync(DRAFTS_DIR, { recursive: true });
    const date = new Date().toISOString().slice(0, 10);
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
    let path = join(DRAFTS_DIR, `${date}-${slug}.md`);
    let n = 2;
    while (existsSync(path)) path = join(DRAFTS_DIR, `${date}-${slug}-${n++}.md`);

    const frontMatter = [
      "---",
      `title: ${JSON.stringify(title)}`,
      `type: ${content_type}`,
      `audience: ${JSON.stringify(audience)}`,
      `channel: ${JSON.stringify(channel ?? "")}`,
      `sender: ${JSON.stringify(sender ?? "")}`,
      "status: needs_approval",
      "approved_by: ",
      `created: ${new Date().toISOString()}`,
      `guardrails: ${report.status} (${report.errors} errors, ${report.warnings} warnings)`,
      "---",
    ].join("\n");

    const notes = handoff_notes ? `\n\n## Handoff notes\n\n${handoff_notes}\n` : "\n";
    const findings = report.findings.length ? `\n## Guardrail findings\n\n${formatReport(report)}\n` : "";
    writeFileSync(path, `${frontMatter}\n\n${body.trim()}${notes}${findings}`, "utf8");
    return {
      content: [{ type: "text", text: `Saved ${path} with status needs_approval.\n\n${formatReport(report)}` }],
    };
  },
);

const listDrafts = tool(
  "list_drafts",
  "List saved drafts in the drafts folder with their title, type, audience, status and guardrail result.",
  {},
  async () => {
    if (!existsSync(DRAFTS_DIR)) return { content: [{ type: "text", text: "No drafts yet." }] };
    const files = readdirSync(DRAFTS_DIR).filter((f) => f.endsWith(".md")).sort();
    if (files.length === 0) return { content: [{ type: "text", text: "No drafts yet." }] };
    const rows = files.map((f) => {
      const head = readFileSync(join(DRAFTS_DIR, f), "utf8").split("\n---")[0];
      const get = (k: string) => (head.match(new RegExp(`^${k}: (.*)$`, "m"))?.[1] ?? "").replace(/^"|"$/g, "");
      return `- ${f}: ${get("title")} [${get("type")}] audience=${get("audience")} status=${get("status")} guardrails=${get("guardrails")}`;
    });
    return { content: [{ type: "text", text: rows.join("\n") }] };
  },
  { annotations: { readOnlyHint: true, openWorldHint: false } },
);

const fiscalCalendarTool = tool(
  "fiscal_calendar",
  "Where a date falls in the Tennessee local-government fiscal year (July 1 to June 30) and the Ford model-year cycle, with the recommended campaign posture for that window. Use it to time campaigns and sequences. Never turns into a lead-time promise.",
  {
    date: z.string().optional().describe("ISO date (YYYY-MM-DD). Defaults to today."),
  },
  async ({ date }) => {
    const d = date ? new Date(date) : new Date();
    if (Number.isNaN(d.getTime())) {
      return { content: [{ type: "text", text: `Invalid date: ${date}` }], isError: true };
    }
    return { content: [{ type: "text", text: fiscalCalendar(d) }] };
  },
  { annotations: { readOnlyHint: true, openWorldHint: false } },
);

const searchLeadsTool = tool(
  "search_leads",
  "Search the lead list at data/leads.csv (organization, type, county, contact, title, email, phone, segment, notes). Filter by free-text query, segment or county. Returns up to `limit` rows. Say so if the file is missing.",
  {
    query: z.string().optional().describe("Free text matched against every column"),
    segment: z.string().optional().describe("e.g. law_enforcement, county, city, state, school, utility, fire, nonprofit, commercial"),
    county: z.string().optional(),
    limit: z.number().int().min(1).max(200).optional().describe("Default 25"),
  },
  async ({ query, segment, county, limit }) => {
    const path = join(DATA_DIR, "leads.csv");
    if (!existsSync(path)) {
      return {
        content: [{ type: "text", text: "data/leads.csv is not present. Ask for the Ford Pro Private Offer lead export (or any contact list) in the format shown in data/leads.example.csv." }],
        isError: true,
      };
    }
    const result = searchLeads(readFileSync(path, "utf8"), { query, segment, county, limit: limit ?? 25 });
    return { content: [{ type: "text", text: result }] };
  },
  { annotations: { readOnlyHint: true, openWorldHint: false } },
);

const searchStockTool = tool(
  "search_stock",
  "Search the in-stock and inbound unit list at data/stock.csv (stock_number, year, model, body_code, trim, drivetrain, color, upfit, status, segment, notes). Use it to build in-stock flyers and availability emails. Price columns are never returned. Filter by free text, model, segment or status (In stock / Arriving). Say so if the file is missing.",
  {
    query: z.string().optional().describe("Free text matched against every column"),
    model: z.string().optional().describe("e.g. F-150, Police Interceptor Utility, Transit, F-350"),
    segment: z.string().optional().describe("law_enforcement, county, city, state, school, utility, fire, nonprofit, commercial"),
    status: z.string().optional().describe("In stock or Arriving"),
    limit: z.number().int().min(1).max(200).optional().describe("Default 50"),
  },
  async ({ query, model, segment, status, limit }) => {
    const path = join(DATA_DIR, "stock.csv");
    if (!existsSync(path)) {
      return {
        content: [{ type: "text", text: "data/stock.csv is not present. Ask a rep for the current stock list in the format shown in data/stock.example.csv (no prices needed)." }],
        isError: true,
      };
    }
    const result = searchStock(readFileSync(path, "utf8"), { query, model, segment, status, limit: limit ?? 50 });
    return { content: [{ type: "text", text: result }] };
  },
  { annotations: { readOnlyHint: true, openWorldHint: false } },
);

const openItems = tool(
  "open_items",
  "The list of facts the department has not yet supplied (proof points, contract details, lead-time ranges, approval rules). Check it before inventing anything and reference it in handoff notes.",
  {},
  async () => ({ content: [{ type: "text", text: loadOpenItems() }] }),
  { annotations: { readOnlyHint: true, openWorldHint: false } },
);

export const fleetServer = createSdkMcpServer({
  name: "fleet",
  version: "0.1.0",
  instructions: "Department-specific tools for the Ford of Murfreesboro fleet marketing agent.",
  tools: [guardrailCheck, saveDraft, listDrafts, fiscalCalendarTool, searchLeadsTool, searchStockTool, openItems],
  alwaysLoad: true,
});

export const FLEET_TOOL_NAMES = [
  "mcp__fleet__guardrail_check",
  "mcp__fleet__save_draft",
  "mcp__fleet__list_drafts",
  "mcp__fleet__fiscal_calendar",
  "mcp__fleet__search_leads",
  "mcp__fleet__search_stock",
  "mcp__fleet__open_items",
];
