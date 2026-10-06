// Never trust model output: check it exists, is bounded, and has the shape we asked for.
export class InvalidAiResponse extends Error {}

const MAX_CHARS = 4000;
const fail = (why) => { throw new InvalidAiResponse(why); };

function parseItems(raw) {
  const unfenced = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  let data;
  try {
    data = JSON.parse(unfenced);
  } catch {
    const match = unfenced.match(/\{[\s\S]*\}/); // model added chatter around the JSON
    if (!match) fail('not JSON');
    try { data = JSON.parse(match[0]); } catch { fail('not JSON'); }
  }
  if (!Array.isArray(data?.items) || data.items.length > 15) fail('bad items array');
  return data.items;
}

const str = (v, max) => (typeof v === 'string' && v.trim() && v.length <= max ? v.trim() : fail('bad string item'));

export function validateAiOutput(operation, raw) {
  if (typeof raw !== 'string' || !raw.trim()) fail('empty response');
  if (raw.length > MAX_CHARS) fail('response too large');

  switch (operation) {
    case 'key_points': {
      const items = parseItems(raw).map((i) => str(i, 500));
      if (!items.length) fail('no key points');
      return items.map((i) => `• ${i}`).join('\n');
    }
    case 'action_items': {
      const items = parseItems(raw).map((i) => {
        const task = str(i?.task, 500);
        const owner = i.owner == null ? null : str(i.owner, 100);
        return owner ? `☐ ${owner} — ${task}` : `☐ ${task}`;
      });
      return items.length ? items.join('\n') : 'No explicit action items found in this note.';
    }
    case 'title': {
      const title = raw.trim().split('\n')[0].replace(/^title:\s*/i, '').replace(/^["'“]+|["'”.]+$/g, '').trim();
      if (!title || title.length > 120) fail('bad title');
      return title;
    }
    default: // summary, question
      return raw.trim();
  }
}
