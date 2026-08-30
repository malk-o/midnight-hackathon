// proof.js
//
// This module MOCKS the reputation store and the guardrail check in plain
// JS for fast, responsive live demos. The real logic is independently
// verified as an actual Compact ZK contract on a local Midnight devnet
// (see contracts/guardian.compact + contracts/test/guardian.test.ts, 4/4
// tests passing, including a test that grows reputation from repeated
// approved actions until a previously-blocked spend clears the gate).
//
// This mock mirrors that same growth behavior: every approved action bumps
// the user's in-memory reputation by +5, so you can watch a user's
// reputation cross a tier threshold live during a demo, in real time.

// Mutable in-memory reputation store: userId -> current score.
// Resets whenever the backend restarts (npm run dev).
const MOCK_REPUTATION = {
  "demo-user": 65,
  "new-user": 5,
  "trusted-user": 250,
};

const REPUTATION_BUMP_ON_APPROVAL = 5;

// Policy tables — mirror contracts/guardian.compact
const CATEGORY_LIMITS = {
  1: { travel: 100, food: 30, software: 50, other: 50 },
  2: { travel: 500, food: 100, software: 300, other: 200 },
  3: { travel: 2000, food: 300, software: 1000, other: 500 },
};

const TIER_THRESHOLDS = { 1: 0, 2: 50, 3: 200 };

export async function checkGuardrails(action, userId) {
  const { category, amount, tier_requested } = action;
  const tier = tier_requested in CATEGORY_LIMITS ? tier_requested : 1;

  const reputationScore = MOCK_REPUTATION[userId] ?? 0;

  const { approved, reason } = evaluateInJs({
    category,
    amount,
    tier,
    reputationScore,
  });

  // Reputation grows from approved actions, exactly like the real
  // recordApprovedAction circuit in guardian.compact.
  if (approved) {
    MOCK_REPUTATION[userId] = reputationScore + REPUTATION_BUMP_ON_APPROVAL;
  }

  return {
    approved,
    reason,
    tier,
    reputationCheckPassed: reputationScore >= TIER_THRESHOLDS[tier],
    // Exposed for demo/debugging only — a real UI would never show this;
    // the frontend intentionally does not render this field.
    _newReputationAfterThisAction: MOCK_REPUTATION[userId],
  };
}

function evaluateInJs({ category, amount, tier, reputationScore }) {
  const limit = CATEGORY_LIMITS[tier]?.[category];
  if (limit === undefined) {
    return { approved: false, reason: `Unknown category "${category}" for tier ${tier}` };
  }

  const withinPolicy = amount <= limit;
  const threshold = TIER_THRESHOLDS[tier];
  const reputationOk = reputationScore >= threshold;

  if (!withinPolicy && !reputationOk) {
    return {
      approved: false,
      reason: `Blocked: amount $${amount} exceeds tier ${tier} limit ($${limit}) for "${category}", AND reputation is below the required threshold for this tier.`,
    };
  }
  if (!withinPolicy) {
    return {
      approved: false,
      reason: `Blocked: amount $${amount} exceeds tier ${tier} limit ($${limit}) for "${category}".`,
    };
  }
  if (!reputationOk) {
    return {
      approved: false,
      reason: `Blocked: reputation proof failed for tier ${tier} (requires proof of score >= ${threshold}).`,
    };
  }
  return { approved: true, reason: `Approved: within policy and reputation proof passed for tier ${tier}. Reputation grew by +${REPUTATION_BUMP_ON_APPROVAL} from this action.` };
}