// Uses Groq's free API (OpenAI-compatible) instead of a paid LLM API.
// Requires GROQ_API_KEY in the environment.
// Get a free key at: https://console.groq.com -> API Keys

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

/**
 * Turns a plain-English task into a structured action object:
 * { category, amount, merchant, tier_requested }
 */
export async function parseTaskToAction(task) {
  if (!GROQ_API_KEY) {
    throw new Error("Missing GROQ_API_KEY environment variable");
  }

  const response = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: "openai/gpt-oss-120b", // free tier model on Groq
      messages: [
        {
          role: "user",
          content: `You are the parsing layer of a spending agent. Given a task
in plain English, output ONLY a JSON object (no markdown, no preamble, no
explanation) with these fields:

{
  "category": one of ["travel", "food", "software", "other"],
  "amount": number (the spend amount implied or requested),
  "merchant": short string describing what/who this is for,
  "tier_requested": integer 1-3 (1 = small/routine, 2 = moderate, 3 = large/high-trust)
}

Task: "${task}"`,
        },
      ],
      temperature: 0,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Groq API error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content ?? "";

  // Strip potential code fences just in case
  const cleaned = text.replace(/```json|```/g, "").trim();
  return JSON.parse(cleaned);
}