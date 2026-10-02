# Fleet Marketing Agent

A full-service marketing agent for the **Ford of Murfreesboro Fleet Department** (Fleet Sales, Statewide Contract Dept), built on the [Claude Agent SDK](https://code.claude.com/docs/en/agent-sdk). It writes content, builds outreach sequences and campaign plans, supports events, and researches prospects for a five-person fleet office that has no marketing staff.

It drafts. A person approves and sends. Nothing it writes leaves the building on its own.

## What it does

| Job | How |
|---|---|
| Segment-specific emails, one-pagers, handouts, social and web copy | `copywriter` subagent in the department voice, checked by `guardrail_check` |
| Outreach and follow-up sequences (events, budget season, model-year updates) | `campaign-planner` subagent timed with `fiscal_calendar` |
| Campaign plans and content calendars | `campaign-planner` |
| Prospect research briefs per county, city or agency | `researcher` subagent using web search, budget books and annual financial reports, with source URLs |
| Independent brand and compliance review | `brand-reviewer` subagent |
| Lead list lookups for outreach | `search_leads` over `data/leads.csv` |
| Half-page in-stock flyers per customer segment | `search_stock` over `data/stock.csv` plus `templates/half-page-flyer.html` |

Every customer-facing draft passes a deterministic guardrail check (no prices, no lead-time promises, no eligibility claims, no named customers, no internal vocabulary, no exclamation marks, no retail language, opt-out on emails, correct routing) and is saved to `drafts/` with `status: needs_approval`.

## Setup

```bash
npm install
cp .env.example .env     # add ANTHROPIC_API_KEY, or log in with `claude` / `ant auth login`
```

Requires Node 20+. The model defaults to `claude-opus-5-5`; override with `FLEET_AGENT_MODEL`.

## Use

One task:

```bash
npm run agent -- "Draft the pre-event email to Tennessee sheriff's offices for the TSA October meeting, from Craig Baton."
npm run agent -- "Build a research brief on Putnam County, Tennessee before James makes first contact."
npm run agent -- "Plan a budget-season campaign for county purchasing directors, January through June."
npm run agent -- "Review drafts/2026-10-02-tsa-pre-event-email.md as the brand reviewer."
```

Interactive session that keeps context between turns:

```bash
npm run chat
```

Re-check an edited draft without the agent:

```bash
npm run check -- drafts/<file>.md email
```

Outputs:

- `drafts/` customer-facing drafts with front matter, guardrail findings and handoff notes (git-ignored)
- `research/` internal prospect briefs (git-ignored)

## Layout

```
knowledge/        the department brief as structured markdown; loaded into the system prompt
src/agent.ts      query() wiring: model, tools, permissions, subagents
src/agents.ts     subagent definitions (copywriter, brand-reviewer, researcher, campaign-planner)
src/guardrails.ts deterministic guardrail checker (pure, unit-tested)
src/tools/        in-process MCP tools: guardrail_check, save_draft, list_drafts, fiscal_calendar, search_leads, search_stock, open_items
src/cli.ts        one-shot and chat CLI
templates/        one-pager and half-page flyer HTML in the navy/orange, Barlow Condensed / Source Sans 3 style
data/             lead list (see data/README.md)
test/             node:test unit tests
```

## Updating what the agent knows

Edit the files in `knowledge/`. They are plain markdown and are read fresh on every run. `knowledge/12-open-items.md` lists the facts the department has not supplied yet; the agent leaves `[NEEDS: ...]` placeholders for those instead of inventing values. Filling in open items is the fastest way to make the output more specific.

## Guardrails

The rules in `knowledge/11-guardrails.md` are enforced three ways:

1. In the system prompt and every subagent prompt.
2. By `guardrail_check`, a pattern checker the agent must run before presenting or saving a draft. `save_draft` refuses copy with errors.
3. By the `brand-reviewer` subagent, which reads for problems patterns cannot catch (implied endorsement, soft timing promises, customers identified by description).

Run the checker's tests with `npm test`.

## Permissions

The agent can read the repo, write to `drafts/` and `research/`, search and fetch the web, and call its own tools. It cannot run shell commands or edit source. Any other tool request is denied automatically.
