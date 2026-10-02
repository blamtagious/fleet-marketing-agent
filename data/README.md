# Data

Put the Ford Pro Private Offer lead export (or any prospect list) at `data/leads.csv`. It is git-ignored.

Columns (header row required, extra columns are kept and searchable):

`organization,type,county,contact_name,title,email,phone,segment,notes`

- `type`: county, city, state, school, utility, fire, nonprofit, commercial
- `segment`: law_enforcement, county, city, state, school, utility, fire, nonprofit, commercial

See `leads.example.csv` for the shape. Contact data on public employees is business contact data: keep it accurate and minimal.

## Stock list

Put the current in-stock and inbound unit list at `data/stock.csv` (git-ignored). Columns:

`stock_number,year,model,body_code,trim,drivetrain,color,upfit,status,segment,notes`

- `status`: In stock or Arriving
- `segment`: which customer group the unit suits best; the agent builds flyers per segment

Do not include prices. If a column named price, msrp, cost or similar is present, the agent will not read it. See `stock.example.csv`.
