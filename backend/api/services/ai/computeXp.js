// Ported from ai/ai-judge/src/xp.ts's computeXp (same rationale as
// rubrics.js - backend/api can't import that TS package's compiled output
// the way it does @katalyst/ai-client). The LLM only selects performance
// levels; this pure function does the deterministic scaling to a score/XP,
// per KATALYST_AI_SPEC.md §4.2 step 4 - never trust a number the model
// invents on its own.

const { PERFORMANCE_LEVEL_PERCENTAGES } = require('./rubrics');

/**
 * @param {{ key: string, weight_pct: number }[]} criteria
 * @param {{ criterion_key: string, level_key: string }[]} selectedLevels
 * @param {number} moduleXpWeight - the activity's xpReward, scaled by total_earned_pct
 */
function computeXp(criteria, selectedLevels, moduleXpWeight) {
  const levelByCriterion = new Map(selectedLevels.map((l) => [l.criterion_key, l]));

  const criteriaLevels = criteria.map((criterion) => {
    const selected = levelByCriterion.get(criterion.key);
    if (!selected) {
      throw new Error(`Missing performance level for criterion "${criterion.key}"`);
    }
    const levelPct = PERFORMANCE_LEVEL_PERCENTAGES[selected.level_key] ?? 0;
    const earnedPct = (criterion.weight_pct * levelPct) / 100;
    return {
      criterionKey: criterion.key,
      levelKey: selected.level_key,
      weightPct: criterion.weight_pct,
      earnedPct,
      justification: selected.justification
    };
  });

  const totalEarnedPct = criteriaLevels.reduce((sum, c) => sum + c.earnedPct, 0);
  const xpAwarded = Math.round((totalEarnedPct / 100) * moduleXpWeight);

  return { criteriaLevels, totalEarnedPct, xpAwarded };
}

module.exports = { computeXp };
