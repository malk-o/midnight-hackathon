# Guardian — Private AI Spending Agent with Reputation-Gated Guardrails

**Track:** AI Track (Midnight Hackathon, Aug 2026)

## The idea

An AI agent takes a plain-English task ("book me a hotel for $150/night, travel
category") and turns it into a structured action. Before the action is allowed to
execute, it must pass two guardrails enforced by a Midnight (Compact) smart contract:

1. **Spending policy** — the amount must be within the limit for that category and tier.
2. **Reputation gate** — the user's private reputation score (built from past
   approved actions) must be at or above the threshold required for that spending
   tier. This is proven with a zero-knowledge proof — the contract learns
   "yes, above threshold" without ever seeing the actual score or history.

If both checks pass, the action is approved. If either fails, the agent is
blocked, live. Reputation also grows from approved actions over time, so a
low-trust user can earn their way into higher spending tiers — without ever
exposing their actual score.

## Why Midnight

Normally, "prove your reputation is good enough" means handing over your full
history to whoever's asking. Midnight lets the user prove *just the fact that
matters* (score ≥ threshold) without exposing the score itself or the actions
that built it. That's the actual privacy story here — not just wrapping an
API call in blockchain buzzwords.

## How it works

![Guardian architecture](docs/guardian-architecture.svg)

A plain-English task is parsed by an AI agent into a structured action
(category, amount, tier). That action is checked against two guardrails —
spending policy (public) and a reputation threshold (private, proven via ZK).

## What's real vs. simulated

- **Real:** `contracts/guardian.compact` is an actual Compact zero-knowledge
  smart contract, compiled and deployed to a local Midnight devnet.
  `contracts/test/guardian.test.ts` deploys it and calls it for real —
  **4/4 automated tests passing**, including a test where a user's reputation
  grows from repeated approved actions until a previously-blocked spend
  clears the gate.
- **Simulated (for the live demo):** the running backend (`backend/src/proof.js`)
  uses a JS mock with policy tables and thresholds confirmed identical to the
  real contract's logic, so the live UI is fast and responsive during judging.
  The real contract's correctness is independently proven by the automated
  test suite, not by the live demo path.

## Architecture

```
frontend/     UI: type a task, watch the agent reason, watch the guardrail decide
backend/      Node.js server: parses task via LLM (Groq), requests the guardrail check
contracts/    Real Compact contract + witnesses + automated devnet tests
docs/         setup notes, architecture diagram
```

## Status

- [x] Compact toolchain set up (WSL2 + Docker local devnet)
- [x] Spending policy check in Compact
- [x] Reputation threshold check (private witness, ZK proof)
- [x] Dynamic reputation growth (recordApprovedAction circuit)
- [x] Real contract deployed + tested — 4/4 passing on local devnet
- [x] Backend: LLM parses task -> structured action
- [x] Backend: guardrail check wired to Express endpoint
- [x] Frontend: task input, step-by-step reasoning, verdict, public/private split, proof receipt, session ledger, side-by-side user comparison
- [x] Demo video
- [x] Devpost write-up

## Local setup

See `docs/SETUP.md` for step-by-step environment setup (Compact toolchain, Node, etc).
See `contracts/test/guardian.test.ts` for the automated proof of the real contract.