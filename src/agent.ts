import { query, type Options, type SDKMessage } from "@anthropic-ai/claude-agent-sdk";
import { buildAgents } from "./agents.js";
import { PROJECT_ROOT } from "./knowledge.js";
import { buildSystemPrompt } from "./systemPrompt.js";
import { fleetServer, FLEET_TOOL_NAMES } from "./tools/index.js";

export const DEFAULT_MODEL = process.env.FLEET_AGENT_MODEL || "claude-opus-5-5";
const EFFORTS = ["low", "medium", "high", "xhigh", "max"] as const;
type Effort = (typeof EFFORTS)[number];
const effortEnv = process.env.FLEET_AGENT_EFFORT as Effort | undefined;
export const DEFAULT_EFFORT: Effort = effortEnv && EFFORTS.includes(effortEnv) ? effortEnv : "high";

const BUILTIN_TOOLS = ["Read", "Glob", "Grep", "Write", "WebSearch", "WebFetch", "Agent", "ToolSearch"];

export interface RunOptions {
  resume?: string;
  model?: string;
  effort?: Effort;
  onMessage?: (m: SDKMessage) => void;
}

export interface RunResult {
  text: string;
  sessionId: string;
  ok: boolean;
}

/**
 * Environment for the Claude Code engine. Organization-level API keys must name a workspace;
 * setting ANTHROPIC_WORKSPACE_ID in .env adds the required header without a new key.
 */
function buildEnv(): Record<string, string | undefined> {
  const env: Record<string, string | undefined> = { ...process.env };
  const workspace = process.env.ANTHROPIC_WORKSPACE_ID?.trim();
  if (workspace) {
    const header = `anthropic-workspace-id: ${workspace}`;
    env.ANTHROPIC_CUSTOM_HEADERS = env.ANTHROPIC_CUSTOM_HEADERS ? `${env.ANTHROPIC_CUSTOM_HEADERS}\n${header}` : header;
  }
  return env;
}

/** Run one turn of the fleet marketing agent and return the final text plus the session id for resuming. */
export async function runFleetAgent(prompt: string, opts: RunOptions = {}): Promise<RunResult> {
  const model = opts.model ?? DEFAULT_MODEL;
  const options: Options = {
    model,
    effort: opts.effort ?? DEFAULT_EFFORT,
    cwd: PROJECT_ROOT,
    systemPrompt: buildSystemPrompt(),
    mcpServers: { fleet: fleetServer },
    agents: buildAgents(model),
    tools: BUILTIN_TOOLS,
    allowedTools: [...BUILTIN_TOOLS, "mcp__fleet__*", ...FLEET_TOOL_NAMES],
    disallowedTools: ["Bash", "Edit", "MultiEdit", "NotebookEdit"],
    // `tools` limits which built-ins exist at all, and every remaining tool is pre-approved above,
    // so no call ever waits on a permission prompt.
    permissionMode: "acceptEdits",
    resume: opts.resume,
    maxTurns: 80,
    env: buildEnv(),
  };

  let text = "";
  let sessionId = opts.resume ?? "";
  let ok = false;

  for await (const message of query({ prompt, options })) {
    opts.onMessage?.(message);
    if (message.type === "result") {
      sessionId = message.session_id;
      if (message.subtype === "success") {
        text = message.result;
        ok = true;
      } else {
        text = `Agent stopped: ${message.subtype}`;
      }
    }
  }
  return { text, sessionId, ok };
}
