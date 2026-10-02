# fleet-marketing-agent

Marketing agent for the Ford of Murfreesboro Fleet Department, built on the Claude Agent SDK (TypeScript, ESM, Node 20+).

- `npm run typecheck` and `npm test` must pass before committing.
- The department brief lives in `knowledge/*.md`. Change facts there, not in prompts.
- `src/guardrails.ts` is a pure function with tests in `test/guardrails.test.ts`. Add a test for every new rule.
- Subagents are defined in `src/agents.ts`; tools in `src/tools/index.ts`. Tool names are `mcp__fleet__<name>`.
- The agent never sends anything. Drafts are saved with `status: needs_approval`. Keep it that way.
- Voice: no exclamation marks, no retail language, no prices, no lead times, no named customers.
