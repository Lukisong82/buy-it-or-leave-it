// A purchase vertical in a broader personal judgment layer.
// Each question is independently answerable from the same supplied state.
export const purchaseQuestions = {
  practical_need: { type: 'noul', instructions: 'Given the stated item, reason, current possessions, and priorities, is there a concrete practical need for this purchase now? Wanting it alone is not a practical need.' },
  impulse: { type: 'noul', instructions: 'Does the stated reason suggest a short-lived impulse, novelty, or social pressure is a major driver of this purchase?' },
  realistic_usage: { type: 'noul', instructions: 'Given the stated frequency and current habits, is the proposed usage realistic without assuming a major change in behavior?' },
  duplication: { type: 'noul', instructions: 'Can something the person already owns substantially serve the same purpose as this item?' },
  longevity: { type: 'noul', instructions: 'Based only on the supplied context, is the person likely to still value or use this item six months from now?' },
  regret_risk: { type: 'noul', instructions: 'Considering the stated price, budget, motive, and expected use, is there substantial risk the person would regret buying this item?' },
  skip_regret: { type: 'noul', instructions: 'Considering the stated need, urgency, and alternatives, is there substantial risk the person would regret skipping this purchase?' },
  goal_alignment: { type: 'noul', instructions: 'Does this purchase support the personal goals or priorities stated in the input?' },
  behavior_change: { type: 'noul', instructions: 'Would getting value from this item require the person to adopt a new habit or meaningfully change their current behavior?' }
};

export const signalDefinitions = [
  { key: 'practical_need', label: 'Practical need', positive: true, weight: 1.2 },
  { key: 'realistic_usage', label: 'Realistic use', positive: true, weight: 1.3 },
  { key: 'longevity', label: 'Long term value', positive: true, weight: 1 },
  { key: 'goal_alignment', label: 'Fits your goals', positive: true, weight: 1 },
  { key: 'skip_regret', label: 'Risk of missing out', positive: true, weight: 0.6 },
  { key: 'impulse', label: 'Impulse or social pull', positive: false, weight: 0.8 },
  { key: 'duplication', label: 'Already covered', positive: false, weight: 1.1 },
  { key: 'regret_risk', label: 'Purchase regret risk', positive: false, weight: 1 },
  { key: 'behavior_change', label: 'Needs a new habit', positive: false, weight: 0.6 }
];

export function composePurchase(input, answers) {
  const price = Number(input.price);
  const uses = Number(input.expectedUses);
  const budget = input.budget === '' ? null : Number(input.budget);
  const costPerUse = uses > 0 ? price / uses : null;
  const overBudget = budget !== null && price > budget;
  let weighted = 0;
  let totalWeight = 0;
  const signals = signalDefinitions.map(def => {
    const probability = Number(answers[def.key]?.noul);
    if (!Number.isFinite(probability) || probability < 0 || probability > 1) throw new Error(`Invalid Jev answer: ${def.key}`);
    const contribution = def.positive ? probability : 1 - probability;
    weighted += contribution * def.weight;
    totalWeight += def.weight;
    return { ...def, probability };
  });
  const score = Math.round((weighted / totalWeight) * 100);
  const caution = overBudget || (budget === null && !input.affordability.trim());
  const uncertain = score >= 42 && score <= 58;
  const outcome = caution || uncertain ? 'Pause & decide' : score > 58 ? 'Buy it' : 'Leave it';
  return { score, outcome, caution, overBudget, costPerUse, signals,
    method: 'Weighted positive signals: practical need 1.2, realistic use 1.3, long term value 1, goals 1, skip regret 0.6. Weighted inverse signals: impulse 0.8, duplication 1.1, purchase regret 1, behavior change 0.6. Scores of 42–58 or missing/over budget context become Pause & decide.' };
}
