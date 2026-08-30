// Uses Groq's free API (OpenAI-compatible) instead of a paid LLM API.
// Requires GROQ_API_KEY in the environment.
// Get a free key at: https://console.groq.com -> API Keys

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

const VALID_CATEGORIES = ["travel", "food", "software", "other"];

const SYSTEM_PROMPT = `You are the parsing layer of a spending agent. Given a
task in plain English, output ONLY a JSON object (no markdown, no preamble,
no explanation, no trailing commentary) with exactly these fields:

{
  "category": one of ["travel", "food", "software", "other"],
  "amount": number (the spend amount implied or requested, no currency symbols),
  "merchant": short string describing what/who this is for,
  "tier_requested": integer 1-3 (1 = small/routine, 2 = moderate, 3 = large/high-trust)
}

If the task doesn't clearly specify a category, use "other". If no amount is
given, make a reasonable estimate based on the task. Output raw JSON only.`;

/**
 * Turns a plain-English task into a structured action object:
 * { category, amount, merchant, tier_requested }
 * Retries once on a malformed/unparsable response, then validates and
 * clamps the result so a bad LLM output can never crash or bypass the
 * downstream guardrail check.
 */
export async function parseTaskToAction(task) {
  if (!GROQ_API_KEY) {
    throw new Error("Missing GROQ_API_KEY environment variable");
  }
  if (!task || typeof task !== "string" || !task.trim()) {
    throw new Error("Task must be a non-empty string");
  }

  let lastErr;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const raw = await callGroq(task);
      const parsed = extractJson(raw);
      return validateAction(parsed);
    } catch (err) {
      lastErr = err;
    }
  }
  throw new Error(`Failed to parse task after retry: ${lastErr?.message ?? lastErr}`);
}

async function callGroq(task) {
  const response = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: "openai/gpt-oss-120b", // free tier model on Groq
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `Task: "${task}"` },
      ],
      temperature: 0,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Groq API error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content ?? "";
}

// Strips code fences and pulls out the first {...} block, so a stray
// preamble/explanation from the model doesn't break JSON.parse.
function extractJson(text) {
  const cleaned = text.replace(/```json|```/g, "").trim();
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) {
    throw new Error(`No JSON object found in model output: ${cleaned.slice(0, 200)}`);
  }
  return JSON.parse(match[0]);
}

// Validates and clamps the parsed action so malformed/adversarial model
// output can never reach the guardrail check in an invalid shape.
function validateAction(parsed) {
  const category = VALID_CATEGORIES.includes(parsed.category) ? parsed.category : "other";

  let amount = Number(parsed.amount);
  if (!Number.isFinite(amount) || amount < 0) amount = 0;
  amount = Math.round(amount * 100) / 100;

  let tier_requested = Number.parseInt(parsed.tier_requested, 10);
  if (!Number.isInteger(tier_requested) || tier_requested < 1 || tier_requested > 3) {
    tier_requested = 1;
  }

  const merchant =
    typeof parsed.merchant === "string" && parsed.merchant.trim()
      ? parsed.merchant.trim().slice(0, 120)
      : "Unspecified";

  return { category, amount, merchant, tier_requested };
}