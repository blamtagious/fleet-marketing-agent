import { test } from "node:test";
import assert from "node:assert/strict";
import { parseCsv, searchLeads } from "../src/tools/leads.js";

const csv = `organization,type,county,contact_name,title,email,phone,segment,notes
"Smith County Highway Dept",county,Smith,"Jane Doe","Superintendent",jane@example.gov,615-555-0100,county,"Replaces 2 trucks/yr"
Acme Plumbing,commercial,Rutherford,Bob Roe,Owner,bob@acme.example,615-555-0101,commercial,Ford Pro private offer`;

test("parseCsv handles quoted fields", () => {
  const rows = parseCsv(csv);
  assert.equal(rows.length, 2);
  assert.equal(rows[0].organization, "Smith County Highway Dept");
  assert.equal(rows[0].notes, "Replaces 2 trucks/yr");
});

test("searchLeads filters by segment, county and query", () => {
  assert.match(searchLeads(csv, { segment: "commercial", limit: 10 }), /1 match/);
  assert.match(searchLeads(csv, { county: "smith", limit: 10 }), /Jane Doe/);
  assert.match(searchLeads(csv, { query: "trucks", limit: 10 }), /1 match/);
  assert.match(searchLeads(csv, { limit: 1 }), /showing 1/);
});
