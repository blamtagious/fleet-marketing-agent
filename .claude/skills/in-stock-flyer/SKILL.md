---
name: in-stock-flyer
description: Build half-page in-stock flyers and matching cover emails for one customer segment from the stock list. Use when Jason asks for in-stock, available-now, or inventory flyers or emails.
---

# In-stock flyer

1. Read `data/stock.csv`. If it is missing, say so and offer to use `data/stock.example.csv` with the output marked SAMPLE.
2. Ask which segment if not stated (law enforcement, county, city, utilities, schools, fire, nonprofit, commercial). Pick four to six units that fit that buyer. Group by segment, never one flyer for everyone.
3. For each unit list quantity, model, body code, trim, drivetrain, color, upfit readiness and status (In stock or Arriving). Never a price. Never an arrival date or month for inbound units, even if a rep's note mentions one.
4. Write the flyer copy: headline, the unit table, an as-of date line ("Availability as of <date>. Units sell on a first-PO basis. SWC 209 contract pricing applies for eligible agencies; your rep provides a written quote."), three short reasons to buy from this department drawn from `knowledge/07-positioning.md`, and one rep as the contact with the fleet line.
5. Write a three-sentence cover email the rep pastes above the attachment, with subject line and opt-out line.
6. Save to `drafts/` as `type: handout` for the flyer and `type: email` for the cover email, run `npm run check` on both, fix errors, commit and push.
7. If a designed version is wanted, fill `templates/half-page-flyer.html` (the `{{PLACEHOLDERS}}`) and save it as `drafts/<same-name>.html`; it prints two-up on letter or to PDF from a browser.
