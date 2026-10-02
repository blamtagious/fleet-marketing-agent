# Data

Put the Ford Pro Private Offer lead export (or any prospect list) at `data/leads.csv`. It is git-ignored.

Columns (header row required, extra columns are kept and searchable):

`organization,type,county,contact_name,title,email,phone,segment,notes`

- `type`: county, city, state, school, utility, fire, nonprofit, commercial
- `segment`: law_enforcement, county, city, state, school, utility, fire, nonprofit, commercial

See `leads.example.csv` for the shape. Contact data on public employees is business contact data: keep it accurate and minimal.
