---
title: "SAMPLE (built from example inventory): In-stock availability email for county purchasing and highway departments"
type: email
audience: "County purchasing directors, finance directors and highway superintendents in Tennessee"
channel: "Email from the rep's mailbox"
sender: "James Witt"
status: needs_approval
approved_by:
created: 2026-10-07T00:00:00Z
---

> SAMPLE. The units below come from `data/stock.example.csv`, not real inventory. `data/stock.csv` was not available. Replace every unit with current stock before this is sent.

**Subject:** In stock now for county fleets: F-150 and F-350 chassis cab

**Preview text:** Stock units on SWC 209, as of October 7, 2026. One quote, one PO.

---

Good morning,

Stock units on our Murfreesboro lot that fit county work, as of October 7, 2026. Eligible agencies can buy on SWC 209 without a bid; confirm with your purchasing officer.

- 2026 F-150 XL SuperCrew, 5.5' box, 4x4, Oxford White, work truck package. In stock.
- 2026 F-350 XL Regular Cab chassis cab, 60" CA, 4x4, Oxford White. In stock. Pairs with a 9' service body, quoted with the truck.
- 2026 Transit 250 cargo van, medium roof, 148" wheelbase, Oxford White. Inbound; timing confirmed at quote.
- 2026 Police Interceptor Utility, AWD hybrid, Oxford White. In stock, ready for patrol upfit, if the sheriff is buying this year.

Stock units move. If one fits a budgeted purchase, reply or call and I will send a written quote on the contract line. Three things, one purchase: vehicle, upfit, paperwork.

James Witt
Fleet Sales Rep
Ford of Murfreesboro Fleet Sales, Statewide Contract Dept
Your Statewide Contract Dealer
jwitt@fordofmurfreesboro.com | 615-542-7466
Fleet line: 615-785-9141

If you would rather not receive availability notes from our fleet office, reply with "remove" and we will remove you from the list.

## Handoff notes

- **This is a sample.** `data/stock.csv` does not exist, so the four units were taken from `data/stock.example.csv` (stock numbers F1240, F1251, F1263, F1234). Swap in real units, re-check, and update the as-of date before sending.
- No price, arrival date or lead time is stated. The Transit is listed as inbound only; the example file notes the factory ETA is not confirmed. Keep it that way.
- Eligibility is stated generally with a pointer to the purchasing officer, per guardrails.
- Sender is James Witt from his own mailbox. Sales inquiries route to James or the fleet line.
- Approver should confirm the "work truck package" and "9' service body" descriptions match the actual units and that the body is quoted brand-agnostic.
- Guardrail check on 2026-10-07: PASS (0 errors, 0 warnings). No `[NEEDS: ...]` placeholders used.
