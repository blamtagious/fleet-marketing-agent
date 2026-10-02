/**
 * Deterministic guardrail checker for customer-facing fleet marketing copy.
 *
 * Encodes the "Never / Always" rules and voice rules from the department brief
 * as pattern checks. It is intentionally conservative: it flags, a human decides.
 * Pure function, no I/O, so it is unit-testable and safe to call from a tool.
 */

export type Severity = "error" | "warning" | "info";

export type ContentType =
  | "email"
  | "one_pager"
  | "social"
  | "web"
  | "handout"
  | "letter"
  | "internal"
  | "other";

export interface Finding {
  rule: string;
  severity: Severity;
  match: string;
  excerpt: string;
  fix: string;
}

export interface GuardrailReport {
  status: "pass" | "warn" | "fail";
  errors: number;
  warnings: number;
  findings: Finding[];
}

interface Rule {
  id: string;
  severity: Severity;
  pattern: RegExp;
  fix: string;
  /** Only apply to these content types (default: all customer-facing). */
  only?: ContentType[];
}

const EXCERPT_RADIUS = 60;

const RULES: Rule[] = [
  // --- Pricing ---------------------------------------------------------------
  {
    id: "pricing.dollar_amount",
    severity: "error",
    pattern: /\$\s?\d[\d,]*(\.\d+)?/g,
    fix: "Remove the dollar figure. Pricing comes only from a rep's written quote. Say 'contract pricing is published per model year; request a written quote'.",
  },
  {
    id: "pricing.discount_language",
    severity: "error",
    pattern:
      /\b(\d{1,3}\s?%\s?(off|discount|savings)|percent\s+off|discount(s|ed)?\s+(of|up to)|save\s+(up\s+to\s+)?\$?\d|rebate\s+of|incentive\s+of\s+\$?\d|msrp\s+(of|is)\s+\$?\d)/gi,
    fix: "Do not state a discount, rebate or incentive amount. Describe the mechanism (contract pricing, Ford Pro incentives applied by us) without numbers.",
  },
  {
    id: "pricing.internal_figures",
    severity: "error",
    pattern:
      /\b(dealer\s+cost|our\s+margin|margins?\s+(on|of)|invoice\s+pric(e|ing)|incentive\s+amount|upfitter\s+pric(e|ing)|receivables?)\b/gi,
    fix: "Internal figures (dealer cost, margin, incentive amounts, upfitter pricing, receivables) are never disclosed.",
  },

  // --- Timing promises ------------------------------------------------------
  {
    id: "timing.promised_window",
    severity: "error",
    pattern:
      /\b(deliver(y|ed|s)?|arrive(s|d)?|ship(s|ped)?|ready|built|in\s+service|on\s+the\s+road)\s+(by|within|in)\s+(\d+|a|one|two|three|four|five|six|eight|ten|twelve)\s*(-?\s*\d+)?\s*(business\s+)?(days?|weeks?|months?)\b/gi,
    fix: "Never promise a build, delivery date or lead time. Say 'lead times follow Ford's order banks and build schedules; your rep will give current timing when you request a quote'.",
  },
  {
    id: "timing.lead_time_number",
    severity: "error",
    pattern: /\blead[\s-]?times?\b[^.\n]{0,40}\b\d+\s*(-\s*\d+\s*)?(days?|weeks?|months?)\b/gi,
    fix: "Do not state a lead-time number. Lead times vary and are never guaranteed (open item: ranges reps are comfortable stating).",
  },
  {
    id: "timing.guarantee",
    severity: "error",
    pattern: /\bguarantee[ds]?\b/gi,
    fix: "Nothing about timing, pricing or availability is guaranteed. Remove the word.",
  },

  // --- Eligibility and endorsement -----------------------------------------
  {
    id: "eligibility.specific_agency",
    severity: "error",
    pattern:
      /\b([Yy]ou|[Yy]our\s+(agency|department|county|city|office|district|school)|[A-Z][a-z]+(\s+[A-Z][a-z]+)*\s+(County|City|Police|Sheriff'?s?\s+Office|Schools?))\s+(is|are|qualif(y|ies)\s+as|'re)\s+(an?\s+)?eligible\b/g,
    fix: "Never state that a specific agency is eligible. Say 'eligible agencies can buy on SWC 209; confirm with your purchasing officer'.",
  },
  {
    id: "endorsement.implied",
    severity: "error",
    pattern:
      /\b(endorsed\s+by|recommended\s+by\s+the\s+state|approved\s+(vendor|dealer)\s+of\s+the|preferred\s+(vendor|dealer|partner)\s+(of|for)|official\s+(vehicle|dealer|partner|supplier)\s+of|the\s+state'?s\s+choice|trusted\s+by\s+(the\s+)?(state|tennessee|sheriffs|chiefs))\b/gi,
    fix: "Do not imply endorsement by the State of Tennessee, any association or any agency. 'Awarded dealer on SWC 209' is the factual claim.",
  },
  {
    id: "customers.named",
    severity: "warning",
    pattern:
      /\b[A-Z][a-z]+(\s+[A-Z][a-z]+)?\s+(County\s+(Sheriff'?s?\s+Office|Board\s+of\s+Education|Schools|Government|Highway\s+Department)|Police\s+Department|Sheriff'?s?\s+Office|Fire\s+(Department|Rescue))\b/g,
    fix: "This looks like a named customer or agency. Customers are not named, shown or quoted without written permission. If it is a prospect being addressed (not cited as a customer), this is fine.",
  },

  // --- Voice ----------------------------------------------------------------
  {
    id: "voice.exclamation",
    severity: "error",
    pattern: /!/g,
    fix: "No exclamation marks. Replace with a period.",
  },
  {
    id: "voice.retail_language",
    severity: "error",
    pattern:
      /\b(deals?|savings\s+event|hurry(\s+in)?|limited[\s-]time|act\s+now|don'?t\s+miss|blowout|clearance|sale\s+(ends|event|price)|special\s+offer|while\s+supplies\s+last|best\s+price|lowest\s+price|unbeatable|amazing|incredible|exciting)\b/gi,
    fix: "Retail language is out of voice. Say what we do and what the buyer has to do, plainly.",
  },
  {
    id: "voice.competitor_knock",
    severity: "warning",
    pattern:
      /\b(unlike\s+other\s+dealers|other\s+dealers\s+(won'?t|can'?t|don'?t)|competitors?\b|better\s+than\s+(any|other)|the\s+only\s+dealer)\b/gi,
    fix: "Non-adversarial voice: no knocking competitors, other dealers, upfitters or associations. State our claim without the comparison.",
  },
  {
    id: "voice.wrong_vehicle_name",
    severity: "error",
    pattern: /\b(cop\s+cars?|explorer\s+police\s+package|police\s+explorer)\b/gi,
    fix: "Use 'Police Interceptor Utility' (spelled out on first mention).",
  },
  {
    id: "voice.piu_before_spellout",
    severity: "warning",
    pattern: /\bPIU\b/g,
    fix: "Spell out 'Police Interceptor Utility' on first mention before using 'PIU'.",
  },

  // --- Internal vocabulary and partners ------------------------------------
  {
    id: "vocab.internal_term",
    severity: "error",
    pattern:
      /\b(GPC|CPA|price\s+protection|fleet\s+credit|B4A|billing\s+cover\s+sheet|Tess|FMC\s+Dealer|Ford\s+Pro\s+Order\s+Status|ACFR|budget\s+book)\b/g,
    fix: "Internal term. Never appears in customer-facing copy.",
  },
  {
    id: "vocab.equipment_brand_or_upfitter",
    severity: "warning",
    pattern:
      /\b(Truckers\s+Lighthouse|Lehr|Reading\s+Truck|Whelen|Federal\s+Signal|Setina|Havis|Code\s*3|SoundOff|Feniex|Knapheide|Pro-?Gard|Troy\s+Products)\b/gi,
    fix: "Public materials stay brand-agnostic on equipment and upfitters. Say 'lighting, siren, console, partition, cargo barrier, radio prep'.",
  },

  // --- Public employee ethics ---------------------------------------------
  {
    id: "ethics.gift_or_meal",
    severity: "error",
    pattern:
      /\b(gift\s*cards?|free\s+(gift|lunch|dinner|meal|tickets?)|lunch\s+(on\s+us|is\s+on\s+us)|giveaways?|raffle|door\s+prizes?|swag|we'?ll\s+buy\s+(you\s+)?(lunch|dinner|coffee))\b/gi,
    fix: "Never offer gifts, meals or anything of value to public employees.",
  },

  // --- Claims that need a source -------------------------------------------
  {
    id: "claims.unsourced_number",
    severity: "warning",
    pattern:
      /\b((over|more\s+than|nearly|about|\d+\+?)\s+)?\d{1,4}\+?\s+(years|units|vehicles|agencies|counties|departments|customers|deliveries)\b/gi,
    fix: "Proof points are not yet documented (open item). Replace with a [NEEDS: source] placeholder or remove the number.",
  },
  {
    id: "claims.superlative",
    severity: "warning",
    pattern: /\b(largest|biggest|#1|number\s+one|leading|premier|top[\s-]rated)\b/gi,
    fix: "Superlatives need a source the brief does not supply. Remove or back with a documented fact.",
  },
];

const EMAIL_OPT_OUT = /\b(unsubscribe|opt[\s-]?out|reply\s+(stop|remove)|remove\s+you\s+from|stop\s+receiving)\b/i;
const ROUTING_SALES = /615-785-9141|cbaton@|jwitt@|615-243-1528|615-542-7466|your\s+(fleet\s+)?rep/i;
const BILLING_MENTION = /\b(invoice|billing|payment|accounts?\s+receivable)\b/i;
const BILLING_ROUTE = /wendy\s+carlton|wcarlton@/i;
const PIU_SPELLED = /police\s+interceptor\s+utility/i;

function excerpt(text: string, index: number, length: number): string {
  const start = Math.max(0, index - EXCERPT_RADIUS);
  const end = Math.min(text.length, index + length + EXCERPT_RADIUS);
  const prefix = start > 0 ? "…" : "";
  const suffix = end < text.length ? "…" : "";
  return prefix + text.slice(start, end).replace(/\s+/g, " ") + suffix;
}

export function checkGuardrails(text: string, contentType: ContentType = "other"): GuardrailReport {
  const findings: Finding[] = [];

  if (contentType === "internal") {
    return { status: "pass", errors: 0, warnings: 0, findings };
  }

  for (const rule of RULES) {
    if (rule.only && !rule.only.includes(contentType)) continue;
    const re = new RegExp(rule.pattern.source, rule.pattern.flags);
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      // PIU rule: only flag when the acronym appears before the spelled-out form.
      if (rule.id === "voice.piu_before_spellout") {
        const before = text.slice(0, m.index);
        if (PIU_SPELLED.test(before)) break;
      }
      // Placeholders are allowed to contain anything.
      if (isInsidePlaceholder(text, m.index)) continue;
      findings.push({
        rule: rule.id,
        severity: rule.severity,
        match: m[0],
        excerpt: excerpt(text, m.index, m[0].length),
        fix: rule.fix,
      });
      if (m[0].length === 0) re.lastIndex++;
    }
  }

  if (contentType === "email" && !EMAIL_OPT_OUT.test(text)) {
    findings.push({
      rule: "email.missing_opt_out",
      severity: "warning",
      match: "",
      excerpt: "",
      fix: "Email to public employees needs an easy opt-out line, e.g. 'Reply with remove and we will take you off this list.'",
    });
  }

  if (["email", "one_pager", "handout", "letter", "web"].includes(contentType) && !ROUTING_SALES.test(text)) {
    findings.push({
      rule: "routing.no_sales_contact",
      severity: "info",
      match: "",
      excerpt: "",
      fix: "Sales inquiries route to the fleet line (615-785-9141) or a named rep. Add a contact if this piece has a call to action.",
    });
  }

  if (BILLING_MENTION.test(text) && /\b(contact|call|email|reach|questions?)\b/i.test(text) && !BILLING_ROUTE.test(text)) {
    findings.push({
      rule: "routing.billing_not_to_wendy",
      severity: "warning",
      match: "",
      excerpt: "",
      fix: "Billing and payment questions route to Wendy Carlton (wcarlton@fordofmurfreesboro.com).",
    });
  }

  const errors = findings.filter((f) => f.severity === "error").length;
  const warnings = findings.filter((f) => f.severity === "warning").length;
  const status = errors > 0 ? "fail" : warnings > 0 ? "warn" : "pass";
  return { status, errors, warnings, findings };
}

function isInsidePlaceholder(text: string, index: number): boolean {
  const open = text.lastIndexOf("[NEEDS:", index);
  if (open === -1) return false;
  const close = text.indexOf("]", open);
  return close !== -1 && close >= index;
}

export function formatReport(report: GuardrailReport): string {
  const head = `Guardrail check: ${report.status.toUpperCase()} (${report.errors} errors, ${report.warnings} warnings)`;
  if (report.findings.length === 0) return head;
  const lines = report.findings.map((f) => {
    const where = f.match ? ` "${f.match}"` : "";
    const ex = f.excerpt ? `\n    context: ${f.excerpt}` : "";
    return `- [${f.severity}] ${f.rule}${where}\n    fix: ${f.fix}${ex}`;
  });
  return `${head}\n${lines.join("\n")}`;
}
