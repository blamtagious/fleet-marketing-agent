import { parseCsv } from "./leads.js";

export interface StockQuery { query?: string; model?: string; segment?: string; status?: string; limit: number }

/** Columns that are never returned, even if a rep's export includes them. Pricing comes only from a written quote. */
const HIDDEN = new Set(["price", "msrp", "contract_price", "invoice", "cost", "dealer_cost", "margin", "incentive", "gpc", "cpa", "b4a"]);

export function searchStock(csv: string, q: StockQuery): string {
  const units = parseCsv(csv);
  const norm = (s: string) => s.toLowerCase();
  const matches = units.filter((u) => {
    if (q.model && !norm(u.model ?? "").includes(norm(q.model))) return false;
    if (q.segment && norm(u.segment ?? "") !== norm(q.segment)) return false;
    if (q.status && norm(u.status ?? "") !== norm(q.status)) return false;
    if (q.query) {
      const hay = Object.entries(u).filter(([k]) => !HIDDEN.has(k)).map(([, v]) => v).join(" | ").toLowerCase();
      if (!hay.includes(norm(q.query))) return false;
    }
    return true;
  });
  const shown = matches.slice(0, q.limit);
  const lines = shown.map((u) => {
    const spec = [u.year, u.model, u.body_code ? `(${u.body_code})` : "", u.trim, u.drivetrain].filter(Boolean).join(" ");
    const extra = Object.entries(u)
      .filter(([k]) => !HIDDEN.has(k) && !["stock_number", "year", "model", "body_code", "trim", "drivetrain", "color", "upfit", "status", "segment", "notes"].includes(k) && u[k])
      .map(([k, v]) => `${k}=${v}`)
      .join(", ");
    return `- ${u.stock_number ?? "?"}: ${spec}; color ${u.color ?? "?"}; upfit: ${u.upfit || "none"}; status: ${u.status ?? "?"}; segment=${u.segment ?? ""}${u.notes ? "; notes: " + u.notes : ""}${extra ? "; " + extra : ""}`;
  });
  const hidden = units.length && Object.keys(units[0]).some((k) => HIDDEN.has(k)) ? "\n(Price columns in the file were not returned. Pricing comes only from a rep's written quote.)" : "";
  return `${matches.length} unit(s) of ${units.length} in stock list${matches.length > shown.length ? `, showing ${shown.length}` : ""}.\n${lines.join("\n")}${hidden}`;
}
