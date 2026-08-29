// proof.js
//
// This module currently MOCKS the reputation store and the guardrail check
// in plain JS, so the rest of the app (agent -> action -> verdict -> UI) can
// be built and demoed end-to-end before the real Midnight/Compact proof
// generation is wired in.
//
// TODO (once Compact toolchain is set up): replace `evaluateInJs` below with
// an actual call to the compiled `guardian.compact` circuit via the Midnight
// JS SDK, passing `category`/`amount`/`tier` as public inputs and
// `reputation_score` as a private input. The rest of this file's shape
// (checkGuardrails' signature and return value) should stay the same, so
// nothing else needs to change.

// Mock reputation store: userId -> private score.
// In the real version this would be built from a user's actual private
// history, not hardcoded like this.
const MOCK_REPUTATION = {
  "demo-user": 65,
  "new-user": 5,
  "trusted-user": 250,
};

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

  return {
    approved,
    reason,
    tier,
    // Notice: we return whether reputation passed, NOT the score itself.
    // That's the property the real ZK proof will actually enforce —
    // here we're just faking that same information boundary in JS.
    reputationCheckPassed: reputationScore >= TIER_THRESHOLDS[tier],
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
  return { approved: true, reason: `Approved: within policy and reputation proof passed for tier ${tier}.` };
}
