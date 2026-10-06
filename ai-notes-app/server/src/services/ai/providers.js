import { config } from '../../config.js';

// Each provider takes the same input and returns plain text. Swap with AI_PROVIDER in .env.
// The API key lives only in this server process and is sent only to the provider.
const { provider, apiKey, model, baseUrl, timeoutMs } = config.ai;

async function postJson(url, headers, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs), // AI timeout
  });
  if (!res.ok) throw new Error(`Provider responded with status ${res.status}`);
  return res.json();
}

const anthropic = async ({ system, user, maxTokens }) => {
  const data = await postJson(
    'https://api.anthropic.com/v1/messages',
    { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
    { model, max_tokens: maxTokens, system, messages: [{ role: 'user', content: user }] },
  );
  return data.content?.filter((b) => b.type === 'text').map((b) => b.text).join('');
};

const openai = async ({ system, user, maxTokens }) => {
  const data = await postJson(
    `${baseUrl}/chat/completions`,
    { authorization: `Bearer ${apiKey}` },
    { model, max_tokens: maxTokens, messages: [{ role: 'system', content: system }, { role: 'user', content: user }] },
  );
  return data.choices?.[0]?.message?.content;
};

// Offline stand-in so you can run and test the whole app without an API key.
const MOCK = {
  summary: 'Mock summary: the note was analyzed successfully.',
  key_points: '{"items": ["Mock key point one", "Mock key point two"]}',
  action_items: '{"items": [{"owner": null, "task": "Mock task from the note"}]}',
  title: 'Mock Generated Title',
  question: 'Mock answer based on the note.',
};
const mock = async ({ operation, user }) => {
  if (user.includes('FORCE_AI_FAILURE')) throw new Error('Simulated provider outage');
  return MOCK[operation];
};

const providers = { anthropic, openai, mock };
if (!providers[provider]) throw new Error(`Unknown AI_PROVIDER "${provider}". Use anthropic, openai or mock.`);
export const complete = providers[provider];
