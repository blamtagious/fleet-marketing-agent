import { test } from "node:test";
import assert from "node:assert/strict";
import { searchStock } from "../src/tools/stock.js";

const csv = `stock_number,year,model,body_code,trim,color,status,quantity,segment,price,eta_internal,notes
F1,2026,F-150,W1E,XL SuperCrew,Oxford White,In stock,12,county,48000,,work truck
F2,2026,Police Interceptor Utility,K8A,AWD hybrid,Oxford White,Arriving,35,law_enforcement,52000,middle of November,`;

test("searchStock filters and never returns price columns", () => {
  const out = searchStock(csv, { limit: 10 });
  assert.match(out, /2 unit\(s\)/);
  assert.doesNotMatch(out, /48000|52000/);
  assert.match(out, /Price and internal ETA columns were not returned/);
  assert.doesNotMatch(out, /November/);
  assert.match(out, /12 x 2026 F-150/);
  assert.match(searchStock(csv, { model: "F-150", limit: 10 }), /1 unit\(s\)/);
  assert.match(searchStock(csv, { status: "arriving", limit: 10 }), /F2/);
  assert.doesNotMatch(searchStock(csv, { query: "48000", limit: 10 }), /F1/);
});
