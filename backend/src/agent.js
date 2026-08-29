import Anthropic from "@anthropic-ai/sdk";

// Requires ANTHROPIC_API_KEY in the environment.
const client = new Anthropic();

/**
 * Turns a plain-English task into a structured action object:
 * { category, amount, merchant, tier_requested }
 *
 * tier_requested is the agent's own judgment of how much trust this
 * action needs — a bigger/riskier ask should request a higher tier,
 * which in turn requires a higher reputation score to pass.
 */
export async function parseTaskToAction(task) {
  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 300,
    messages: [
      {
        role: "user",
        content: `You are the parsing layer of a spending agent. Given a task
in plain English, output ONLY a JSON object (no markdown, no preamble) with
these fields:

{
  "category": one of ["travel", "food", "software", "other"],
  "amount": number (the spend amount implied or requested),
  "merchant": short string describing what/who this is for,
  "tier_requested": integer 1-3 (1 = small/routine, 2 = moderate, 3 = large/high-trust)
}

Task: "${task}"`,
      },
    ],
  });

  const text = response.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("");

  // Strip potential code fences just in case
  const cleaned = text.replace(/```json|```/g, "").trim();
  return JSON.parse(cleaned);
}
