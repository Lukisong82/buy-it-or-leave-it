import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { purchaseQuestions, composePurchase } from './judgments.js';

const root = path.dirname(fileURLToPath(import.meta.url));
try {
  const env = await fs.readFile(path.join(root, '.env'), 'utf8');
  for (const line of env.split(/\r?\n/)) {
    const match = line.match(/^([A-Z_]+)=(.*)$/);
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2];
  }
} catch {}
const port = Number(process.env.PORT || 3000);
const fields = ['item','price','why','frequency','expectedUses','similar','replaces','budget','affordability','urgency','goals'];
const send = (res, status, value) => { res.writeHead(status, {'content-type':'application/json; charset=utf-8','cache-control':'no-store'}); res.end(JSON.stringify(value)); };
const clean = value => typeof value === 'string' ? value.trim().slice(0, 1800) : '';
function validate(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('Please complete the purchase details.');
  const input = Object.fromEntries(fields.map(field => [field, clean(raw[field])]));
  if (!input.item || !input.why || !input.frequency || !input.goals) throw new Error('Add the item, reason, likely use, and priorities.');
  const price = Number(input.price), uses = Number(input.expectedUses);
  if (!Number.isFinite(price) || price < 0 || !Number.isFinite(uses) || uses <= 0) throw new Error('Enter a valid price and expected number of uses.');
  if (input.budget && (!Number.isFinite(Number(input.budget)) || Number(input.budget) < 0)) throw new Error('Enter a valid budget.');
  if (!input.budget && !input.affordability) throw new Error('Add a budget or affordability context.');
  return input;
}
async function evaluate(input) {
  if (!process.env.TYPESAFE_API_KEY || process.env.TYPESAFE_API_KEY === 'replace-with-your-key') {
    const error = new Error('Jev is not configured. Add TYPESAFE_API_KEY to .env on the server.'); error.status = 503; throw error;
  }
  const response = await fetch('https://api.typesafe.ai/v1/systemone', {
    method: 'POST', headers: { 'authorization': `Bearer ${process.env.TYPESAFE_API_KEY}`, 'content-type': 'application/json' },
    body: JSON.stringify({ model: process.env.TYPESAFE_MODEL || 'jev-latest', state: { purchase: input }, questions: purchaseQuestions }),
    signal: AbortSignal.timeout(20000)
  });
  if (!response.ok) { const error = new Error(response.status === 401 ? 'The server TypeSafe key was rejected.' : 'Jev could not evaluate this purchase. Please try again.'); error.status = 502; throw error; }
  const data = await response.json();
  return { ...composePurchase(input, data.answers), model: data.model || 'Jev' };
}
const types = { '.html':'text/html; charset=utf-8', '.css':'text/css; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.svg':'image/svg+xml', '.png':'image/png' };
const server = http.createServer(async (req, res) => {
  if (req.method === 'POST' && req.url === '/api/evaluate') {
    try {
      let body = '';
      for await (const part of req) { body += part; if (body.length > 20000) throw new Error('Input is too long.'); }
      const input = validate(JSON.parse(body));
      send(res, 200, await evaluate(input));
    } catch (error) { send(res, error.status || 400, { error: error.message || 'Could not evaluate.' }); }
    return;
  }
  if (req.method !== 'GET') { res.writeHead(405); res.end(); return; }
  const route = req.url === '/' ? '/index.html' : req.url;
  if (!['/index.html','/styles.css','/app.js','/logo-horizontal.png','/logo-original.png'].includes(route)) { res.writeHead(404); res.end(); return; }
  const file = path.join(root, 'public', route);
  try { const contents = await fs.readFile(file); res.writeHead(200, {'content-type': types[path.extname(file)], 'x-content-type-options':'nosniff'}); res.end(contents); }
  catch { res.writeHead(404); res.end(); }
});
const host = process.env.RENDER ? '0.0.0.0' : '127.0.0.1';
server.listen(port, host, () => console.log(`Buy It or Leave It: http://localhost:${port}`));
