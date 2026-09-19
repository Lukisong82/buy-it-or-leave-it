const form = document.querySelector('#purchase-form');
const resultEmpty = document.querySelector('#result-empty');
const resultContent = document.querySelector('#result-content');
const resultError = document.querySelector('#result-error');
const button = document.querySelector('#evaluate-button');
let current = null;
const money = value => new Intl.NumberFormat(undefined,{style:'currency',currency:'EUR'}).format(value);
const pct = value => `${Math.round(value * 100)}%`;
const historyKey = 'buy-or-leave-history-v1';
// Remove decisions saved by older versions. New decisions last only until this page closes.
try { localStorage.removeItem(historyKey); } catch { /* Storage may be blocked. */ }
let decisions = [];
const getHistory = () => decisions;
const setText = (selector, value) => { document.querySelector(selector).textContent = value; };
function renderHistory() {
  const history = getHistory();
  const list = document.querySelector('#history-list');
  list.replaceChildren();
  document.querySelector('#clear-history').classList.toggle('hidden', !history.length);
  if (!history.length) { const p = document.createElement('p'); p.className = 'history-empty'; p.textContent = 'No decisions tracked yet.'; list.append(p); return; }
  for (const entry of history) {
    const row = document.createElement('div'); row.className = 'history-item';
    const name = document.createElement('strong'); name.textContent = entry.item;
    const detail = document.createElement('span'); detail.textContent = `${entry.choice} · ${money(entry.price)} · ${new Date(entry.date).toLocaleDateString()}`;
    row.append(name, detail); list.append(row);
  }
}
function renderResult(input, data) {
  current = { input, data };
  resultEmpty.classList.add('hidden'); resultError.classList.add('hidden'); resultContent.classList.remove('hidden');
  setText('#outcome', data.outcome); setText('#score', data.score);
  setText('#metric-price', money(Number(input.price)));
  setText('#metric-uses', input.expectedUses);
  setText('#metric-cost', data.costPerUse === null ? '—' : money(data.costPerUse));
  const caution = document.querySelector('#caution'); caution.classList.toggle('hidden', !data.caution);
  caution.textContent = data.overBudget ? 'Price exceeds the budget you entered. Treat this as a pause before buying.' : data.caution ? 'No spending limit was provided. Check affordability before acting.' : '';
  const signals = document.querySelector('#signals'); signals.replaceChildren();
  for (const signal of data.signals) {
    const row = document.createElement('div'); row.className = 'signal';
    const label = document.createElement('div'); label.className = 'signal-label'; label.textContent = signal.label;
    const value = document.createElement('strong'); value.textContent = pct(signal.probability);
    const track = document.createElement('div'); track.className = 'signal-track';
    const fill = document.createElement('div'); fill.className = `signal-fill ${signal.positive ? 'positive' : 'negative'}`; fill.style.width = pct(signal.probability); track.append(fill);
    row.append(label, value, track); signals.append(row);
  }
  setText('#method-text', data.method);
  setText('#saved-choice', '');
  document.querySelectorAll('[data-choice]').forEach(b => b.classList.remove('selected'));
}
form.addEventListener('submit', async event => {
  event.preventDefault();
  const input = Object.fromEntries(new FormData(form));
  button.disabled = true; button.querySelector('span').textContent = 'Reading the signals…';
  resultError.classList.add('hidden');
  try {
    const response = await fetch('/api/evaluate', {method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(input)});
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Could not evaluate.');
    renderResult(input, data);
  } catch (error) { resultError.textContent = error.message; resultError.classList.remove('hidden'); resultEmpty.classList.add('hidden'); resultContent.classList.add('hidden'); }
  finally { button.disabled = false; button.querySelector('span').textContent = 'Weigh this purchase'; }
});
document.querySelectorAll('[data-choice]').forEach(button => button.addEventListener('click', () => {
  if (!current) return;
  const choice = button.dataset.choice;
  const history = getHistory();
  history.unshift({item:current.input.item,price:Number(current.input.price),choice,date:new Date().toISOString()});
  decisions = history.slice(0, 50);
  document.querySelectorAll('[data-choice]').forEach(b => b.classList.toggle('selected', b === button));
  setText('#saved-choice', `${choice} saved to your decisions.`);
  renderHistory();
}));
document.querySelector('#clear-history').addEventListener('click', () => { decisions = []; renderHistory(); });
renderHistory();
