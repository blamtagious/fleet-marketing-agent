---
title: "In-stock availability email for county and city public works, highway and utility fleets"
type: email
audience: "County and city purchasing directors, highway superintendents, public works directors and utility fleet managers in Tennessee"
channel: "Email from the rep's mailbox"
sender: "James Witt"
status: needs_approval
approved_by:
created: 2026-10-10T00:00:00Z
---

**Subject:** In stock for public works and utility fleets: F-250 pickups and F-350/F-550 chassis cabs

**Preview text:** On-the-ground work trucks on SWC 209, as of October 10, 2026. Service or utility body quoted with the truck.

---

Good morning,

Work trucks on our Murfreesboro lot that fit highway, public works and utility fleets, as of October 10, 2026. All are white and 4x4 unless noted. Eligible agencies can buy on SWC 209 without running a bid; confirm with your purchasing officer.

**F-250 pickups, in stock**

- Qty 12: 2026 F-250 XL Regular Cab, gas, 8-foot bed
- Qty 14: 2026 F-250 XL Super Cab, gas, 6.75-foot bed
- Qty 5: 2027 F-250 XL Crew Cab, gas, 6.75-foot bed

**F-350 and F-550 chassis cabs, in stock.** A service or utility body is spec'd for the job and quoted with the truck.

- Qty 3: 2026 F-350 Regular Cab, gas, 84-inch CA, 4x2
- Qty 1: 2027 F-350 Super Cab, gas
- Qty 2: 2027 F-350 Super Cab, diesel
- Qty 1: 2027 F-350 Crew Cab, gas
- Qty 7: 2026 F-350 Crew Cab, diesel
- Qty 1: 2026 F-550 Regular Cab, diesel, 60-inch CA
- Qty 1: 2026 F-550 Super Cab, diesel, 60-inch CA

**Inbound**

- Qty 34: 2026 F-150 XL Crew Cab, V8. Inbound; timing confirmed at quote.

Stock units sell on a first-PO basis. If one fits a budgeted purchase, reply or call and I will send a written quote on the contract line. Three things, one purchase: vehicle, upfit, paperwork.

James Witt
Fleet Sales Rep
Ford of Murfreesboro Fleet Sales, Statewide Contract Dept
Your Statewide Contract Dealer
jwitt@fordofmurfreesboro.com | 615-542-7466
Fleet line: 615-785-9141

If you would rather not receive availability notes from our fleet office, reply with "remove" and we will remove you from the list.

## Handoff notes

- Built from `data/stock.csv` as of 2026-10-10, segments county and utility: stock numbers TR-04, TR-05, TR-06 (F-250 pickups), CC-01 through CC-07 (chassis cabs) and TR-03 (inbound F-150). Quantities are as listed in the file. The 2027 F-150 Super Cab (TR-02) was left out as requested.
- No price, arrival date or lead time is stated. The inbound F-150 is described as inbound only; the `eta_internal` column was ignored. Keep it that way.
- Body descriptions are brand-agnostic ("service or utility body"). No upfitter or equipment brand is named.
- Eligibility is stated generally with a pointer to the purchasing officer. No agency is named.
- Sender is James Witt from his own mailbox. Sales inquiries route to James or the fleet line.
- Approver should confirm quantities against today's lot before sending; stock units move. Confirm the chassis cab descriptions (cab, fuel, CA) match the actual units, and that CC-01 is in fact 4x2.
- Body length: the eleven unit lines the segment calls for push the body past the usual 150 words; the prose around them is about 90 words. Drop a chassis cab line if a shorter note is wanted.
- No `[NEEDS: ...]` placeholders used.
