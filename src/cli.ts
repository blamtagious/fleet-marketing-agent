import "dotenv/config";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import type { SDKMessage } from "@anthropic-ai/claude-agent-sdk";
import { DEFAULT_EFFORT, DEFAULT_MODEL, runFleetAgent } from "./agent.js";

const dim = (s: string) => `\x1b[2m${s}\x1b[0m`;
const bold = (s: string) => `\x1b[1m${s}\x1b[0m`;

function printProgress(m: SDKMessage): void {
  if (m.type === "assistant") {
    for (const block of m.message.content) {
      if (block.type === "tool_use") {
        const input = JSON.stringify(block.input);
        const short = input.length > 140 ? input.slice(0, 140) + "…" : input;
        const who = m.parent_tool_use_id ? "  ↳ " : "";
        console.error(dim(`${who}[tool] ${block.name} ${short}`));
      }
    }
  }
}

function usage(): never {
  console.log(`fleet-marketing-agent

Usage:
  npm run agent -- "<task>"            one task, prints the result
  npm run agent -- --resume <id> "<task>"
  npm run chat                          interactive session (keeps context between turns)

Environment: FLEET_AGENT_MODEL (default ${DEFAULT_MODEL}), FLEET_AGENT_EFFORT (default ${DEFAULT_EFFORT}), ANTHROPIC_API_KEY.`);
  process.exit(1);
}

async function oneShot(prompt: string, resume?: string): Promise<void> {
  const result = await runFleetAgent(prompt, { resume, onMessage: printProgress });
  console.log(result.text);
  console.error(dim(`\nsession: ${result.sessionId}  (resume with --resume ${result.sessionId})`));
  if (!result.ok) process.exit(2);
}

async function chat(): Promise<void> {
  const rl = createInterface({ input: stdin, output: stdout });
  let sessionId: string | undefined;
  console.log(bold("Fleet marketing agent") + dim(`  model=${DEFAULT_MODEL} effort=${DEFAULT_EFFORT}`));
  console.log(dim("Type a task. /quit to exit. Drafts land in drafts/, research in research/.\n"));
  for (;;) {
    const line = (await rl.question(bold("you> "))).trim();
    if (!line) continue;
    if (line === "/quit" || line === "/exit") break;
    try {
      const result = await runFleetAgent(line, { resume: sessionId, onMessage: printProgress });
      sessionId = result.sessionId;
      console.log(`\n${result.text}\n`);
    } catch (err) {
      console.error(`error: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
  rl.close();
}

const args = process.argv.slice(2);
if (args.includes("--chat")) {
  await chat();
} else {
  let resume: string | undefined;
  const rest: string[] = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--resume") resume = args[++i];
    else rest.push(args[i]);
  }
  const prompt = rest.join(" ").trim();
  if (!prompt) usage();
  await oneShot(prompt, resume);
}
