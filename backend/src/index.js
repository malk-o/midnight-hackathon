import express from "express";
import cors from "cors";
import { parseTaskToAction } from "./agent.js";
import { checkGuardrails } from "./proof.js";

const app = express();
app.use(cors());
app.use(express.json());

// Health check
app.get("/health", (req, res) => res.json({ ok: true }));

// Main endpoint: user sends a plain-English task, we run it through
// the agent, then check it against the Guardian contract's guardrails.
app.post("/agent/task", async (req, res) => {
  const { task, userId } = req.body;

  if (!task) {
    return res.status(400).json({ error: "Missing 'task' in request body" });
  }

  try {
    // 1. Agent reasoning: turn plain English into a structured action
    const action = await parseTaskToAction(task);

    // 2. Guardrail check: spending policy + private reputation proof
    const verdict = await checkGuardrails(action, userId ?? "demo-user");

    res.json({
      task,
      action,
      verdict, // { approved: boolean, reason: string }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong", detail: String(err) });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Guardian backend running on :${PORT}`));
