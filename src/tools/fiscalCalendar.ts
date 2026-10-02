/**
 * Tennessee local-government fiscal year runs July 1 to June 30.
 * Phases below are the department's own campaign framing from the brief:
 * budget planning in spring, new-money purchasing in summer.
 */
export function fiscalCalendar(d: Date): string {
  const month = d.getMonth() + 1; // 1-12
  const year = d.getFullYear();
  const fyStart = month >= 7 ? year : year - 1;
  const fy = `FY${fyStart + 1} (July 1, ${fyStart} to June 30, ${fyStart + 1})`;

  let phase: string;
  let posture: string;
  if (month >= 1 && month <= 3) {
    phase = "Budget planning (January to March)";
    posture =
      "Departments are building next year's requests. Educational content lands best: how SWC 209 works, how to spec a patrol vehicle, how to write a vehicle line item that purchasing will approve. Ask reps to offer spec help and budgetary written quotes.";
  } else if (month >= 4 && month <= 6) {
    phase = "Budget adoption (April to June)";
    posture =
      "Budgets are being finalized and adopted by commissions, councils and boards. Purchasing and finance contacts want compliance and documentation. Also the end-of-year window where unspent current-year money gets committed before June 30.";
  } else if (month >= 7 && month <= 9) {
    phase = "New-money purchasing (July to September)";
    posture =
      "New fiscal year money is available. Highest-intent window for POs. Outreach should make the next step easy: one call, one written quote, one PO. Pair with model-year order-bank news if Ford has opened the new year.";
  } else {
    phase = "Mid-year (October to December)";
    posture =
      "Event season (association meetings and expos). Relationship and follow-up window. Good for case-style education, order status check-ins with existing customers, and planting next year's budget line.";
  }

  return [
    `Date: ${d.toISOString().slice(0, 10)}`,
    `Tennessee local-government fiscal year: ${fy}`,
    `Phase: ${phase}`,
    `Posture: ${posture}`,
    "Ford model year: contract pricing changes with each model year. Order banks open and close on Ford's schedule, which is not published far ahead and varies by model. Do not state lead times or order-bank dates in customer copy; a rep confirms current timing at quote time.",
    "Note: some cities and special districts use a different fiscal year. Confirm per prospect when it matters.",
  ].join("\n");
}
