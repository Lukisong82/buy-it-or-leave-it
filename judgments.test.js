import test from 'node:test';
import assert from 'node:assert/strict';
import { composePurchase, purchaseQuestions } from './judgments.js';
const input = { price:'180', expectedUses:'72', budget:'200', affordability:'Can pay', why:'For work' };
const answers = Object.fromEntries(Object.keys(purchaseQuestions).map(key => [key, {type:'noul', noul: key === 'impulse' || key === 'duplication' || key === 'regret_risk' || key === 'behavior_change' ? .1 : .9}]));
test('keeps exact cost per use in code and shows a buy leaning', () => {
  const result = composePurchase(input, answers);
  assert.equal(result.costPerUse, 2.5);
  assert.equal(result.outcome, 'Buy it');
  assert.equal(result.signals.length, 9);
});
test('over budget pauses the recommendation', () => {
  const result = composePurchase({...input, budget:'100'}, answers);
  assert.equal(result.outcome, 'Pause & decide');
  assert.equal(result.overBudget, true);
});
test('rejects malformed model answers', () => {
  assert.throws(() => composePurchase(input, {...answers, practical_need:{noul:2}}));
});
