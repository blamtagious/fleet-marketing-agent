import { test } from "node:test";
import assert from "node:assert/strict";
import { checkGuardrails } from "../src/guardrails.js";

const rules = (text: string, type: Parameters<typeof checkGuardrails>[1] = "other") =>
  checkGuardrails(text, type).findings.map((f) => f.rule);

test("clean copy in voice passes", () => {
  const text = `Ford of Murfreesboro Fleet Sales is an awarded dealer on SWC 209, Tennessee's statewide contract for vehicles. Eligible agencies can buy on it without running their own bid. Confirm eligibility with your purchasing officer. Three things, one purchase: vehicle, upfit, paperwork. Call the fleet line at 615-785-9141.`;
  const r = checkGuardrails(text, "handout");
  assert.equal(r.status, "pass");
  assert.equal(r.findings.length, 0);
});

test("dollar amounts and discounts fail", () => {
  assert.ok(rules("Contract price $42,315 per unit.").includes("pricing.dollar_amount"));
  assert.ok(rules("Save 12% off MSRP.").includes("pricing.discount_language"));
});

test("timing promises fail", () => {
  assert.ok(rules("Your units will be delivered within 8 weeks.").includes("timing.promised_window"));
  assert.ok(rules("Current lead time is 10-12 weeks.").includes("timing.lead_time_number"));
  assert.ok(rules("Delivery is guaranteed before July.").includes("timing.guarantee"));
});

test("eligibility and endorsement claims fail", () => {
  assert.ok(rules("Rutherford County is eligible to buy on SWC 209.").includes("eligibility.specific_agency"));
  assert.ok(rules("Your agency is eligible today.").includes("eligibility.specific_agency"));
  assert.ok(rules("We are endorsed by the Tennessee Sheriffs' Association.").includes("endorsement.implied"));
});

test("named customers warn", () => {
  const r = checkGuardrails("We recently delivered four units to Wilson County Sheriff's Office.");
  assert.ok(r.findings.some((f) => f.rule === "customers.named" && f.severity === "warning"));
});

test("voice violations fail", () => {
  assert.ok(rules("Great deals this month!").includes("voice.exclamation"));
  assert.ok(rules("Great deals this month!").includes("voice.retail_language"));
  assert.ok(rules("Ask about our cop cars.").includes("voice.wrong_vehicle_name"));
  assert.ok(rules("Unlike other dealers, we handle upfit.").includes("voice.competitor_knock"));
});

test("PIU acronym only flagged before spell-out", () => {
  assert.ok(rules("The PIU is pursuit rated.").includes("voice.piu_before_spellout"));
  assert.ok(!rules("The Police Interceptor Utility (PIU) is pursuit rated. Each PIU ships with a partition.").includes("voice.piu_before_spellout"));
});

test("internal vocabulary and partner names are caught", () => {
  assert.ok(rules("We apply GPC and Price Protection for you.").includes("vocab.internal_term"));
  assert.ok(rules("Upfit by Truckers Lighthouse with Whelen lighting.").includes("vocab.equipment_brand_or_upfitter"));
});

test("gifts to public employees fail", () => {
  assert.ok(rules("Stop by the booth for a gift card.").includes("ethics.gift_or_meal"));
});

test("unsourced numbers warn", () => {
  const r = checkGuardrails("We have served over 60 agencies in 15 years.");
  assert.ok(r.findings.some((f) => f.rule === "claims.unsourced_number"));
  assert.equal(r.status, "warn");
});

test("placeholders are exempt", () => {
  const r = checkGuardrails("Serving Tennessee agencies for [NEEDS: years holding SWC 209, e.g. 10 years].");
  assert.equal(r.findings.length, 0);
});

test("emails need an opt-out and routing", () => {
  const r = checkGuardrails("Subject: SWC 209 before budget season\n\nHere is how it works.", "email");
  assert.ok(r.findings.some((f) => f.rule === "email.missing_opt_out"));
  assert.ok(r.findings.some((f) => f.rule === "routing.no_sales_contact"));
  const ok = checkGuardrails("Here is how it works. Call Craig Baton at 615-243-1528. Reply with remove to opt out.", "email");
  assert.ok(!ok.findings.some((f) => f.rule === "email.missing_opt_out"));
  assert.ok(!ok.findings.some((f) => f.rule === "routing.no_sales_contact"));
});

test("billing routing warns when not to Wendy", () => {
  const r = checkGuardrails("For invoice questions, call Craig at 615-243-1528.");
  assert.ok(r.findings.some((f) => f.rule === "routing.billing_not_to_wendy"));
});

test("internal content is not checked", () => {
  const r = checkGuardrails("Budget book shows $1.2M in capital outlay! GPC applies.", "internal");
  assert.equal(r.status, "pass");
});
