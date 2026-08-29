# Guardian — Private AI Spending Agent with Reputation-Gated Guardrails

**Track:** AI Track (Midnight Hackathon, Aug 2026)

## The idea

An AI agent takes a plain-English task ("book me a hotel under $200/night, travel
category") and turns it into a structured action. Before the action is allowed to
execute, it must pass two guardrails enforced by a Midnight (Compact) smart contract:

1. **Spending policy** — the amount must be within the limit for that category.
2. **Reputation gate** — the user's private reputation score (built from past
   approved actions) must be at or above the threshold required for that spending
   tier. This is proven with a zero-knowledge proof — the contract learns
   "yes, above threshold" without ever seeing the actual score or history.

If both checks pass, the action is approved (simulated execution — no real
payments in this build). If either fails, the agent is blocked, and the failed
proof is shown live. That moment — the guardrail actually stopping the agent
in real time — is the demo.

## Why Midnight

Normally, "prove your reputation is good enough" means handing over your full
history to whoever's asking. Midnight lets the user prove *just the fact that
matters* (score ≥ threshold) without exposing the score itself or the actions
that built it. That's the actual privacy story here — not just wrapping an
API call in blockchain buzzwords.

## Architecture

```
frontend/     simple UI: type a task, watch the agent reason, watch the guardrail decide
backend/      Node.js server: parses task via LLM, builds the action, requests the proof
contracts/    Compact contract: spending policy + reputation threshold check
docs/         notes, demo script, submission write-up drafts
```

## Status

- [ ] Compact "hello world" running locally
- [ ] Spending policy check in Compact
- [ ] Reputation threshold check (private input, ZK proof)
- [ ] Backend: LLM parses task -> structured action
- [ ] Backend: wires action into proof request, returns pass/fail + reason
- [ ] Frontend: minimal UI showing the agent's reasoning and the guardrail verdict
- [ ] Demo video
- [ ] Devpost write-up

## Local setup

See `docs/SETUP.md` for step-by-step environment setup (Compact toolchain, Node, etc).
