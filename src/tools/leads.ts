/** Minimal CSV parsing and filtering for the lead list. Handles quoted fields. */
export function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') inQuotes = false;
      else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field); field = "";
      if (row.some((f) => f.trim() !== "")) rows.push(row);
      row = [];
    } else field += c;
  }
  if (field !== "" || row.length) { row.push(field); if (row.some((f) => f.trim() !== "")) rows.push(row); }
  if (rows.length === 0) return [];
  const header = rows[0].map((h) => h.trim().toLowerCase());
  return rows.slice(1).map((r) => Object.fromEntries(header.map((h, i) => [h, (r[i] ?? "").trim()])));
}

export interface LeadQuery { query?: string; segment?: string; county?: string; limit: number }

export function searchLeads(csv: string, q: LeadQuery): string {
  const leads = parseCsv(csv);
  const norm = (s: string) => s.toLowerCase();
  const matches = leads.filter((l) => {
    if (q.segment && norm(l.segment ?? "") !== norm(q.segment)) return false;
    if (q.county && !norm(l.county ?? "").includes(norm(q.county))) return false;
    if (q.query) {
      const hay = Object.values(l).join(" | ").toLowerCase();
      if (!hay.includes(norm(q.query))) return false;
    }
    return true;
  });
  const shown = matches.slice(0, q.limit);
  const lines = shown.map((l) =>
    `- ${l.organization ?? "?"} (${l.type ?? ""}, ${l.county ?? ""} County) — ${l.contact_name ?? ""}${l.title ? ", " + l.title : ""}; ${l.email ?? ""} ${l.phone ?? ""}; segment=${l.segment ?? ""}${l.notes ? "; notes: " + l.notes : ""}`,
  );
  return `${matches.length} match(es) of ${leads.length} leads${matches.length > shown.length ? `, showing ${shown.length}` : ""}.\n${lines.join("\n")}`;
}
