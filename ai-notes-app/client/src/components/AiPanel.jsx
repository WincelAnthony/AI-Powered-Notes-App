import { useEffect, useState } from 'react';
import { api } from '../services/api.js';
import { fmtDate } from '../utils/format.js';

// Keyed by the database operation name so history entries and live results share one config.
const OPS = {
  summary: { path: 'summarize', button: 'Summarize', busy: 'Generating summary…', heading: 'Summary' },
  key_points: { path: 'key-points', button: 'Key Points', busy: 'Extracting key points…', heading: 'Key Points' },
  action_items: { path: 'action-items', button: 'Action Items', busy: 'Extracting action items…', heading: 'Action Items' },
  title: { path: 'title', button: 'Generate Title', busy: 'Generating title…', heading: 'Suggested Title' },
  question: { path: 'question', button: 'Ask', busy: 'Answering…', heading: 'Answer' },
};
const TOOLS = ['summary', 'key_points', 'action_items', 'title'];

/**
 * onSaveToNote(text, heading) and onUseTitle(title) are supplied by the page, because
 * "saving" means different things in the editor (edit form state) and the detail view (API call).
 * Each may return a status message string.
 */
export default function AiPanel({ noteId, onSaveToNote, onUseTitle }) {
  const [busy, setBusy] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [usage, setUsage] = useState(null);
  const [history, setHistory] = useState([]);
  const [question, setQuestion] = useState('');
  const [titleDraft, setTitleDraft] = useState('');

  useEffect(() => {
    Promise.all([api.ai.usage(), api.notes.history(noteId)])
      .then(([u, h]) => { setUsage(u.usage); setHistory(h.history); })
      .catch((e) => setError(e.message));
  }, [noteId]);

  const show = (gen, q) => {
    setResult({ ...gen, question: q ?? (gen.operation === 'question' ? gen.prompt : '') });
    setTitleDraft(gen.operation === 'title' ? gen.response : '');
    setNotice('');
  };

  async function run(operation, q) {
    setBusy(operation); setError(''); setNotice('');
    try {
      const data = await api.ai.run(OPS[operation].path, { noteId, question: q });
      show(data.generation, q);
      setUsage(data.usage);
      setHistory((h) => [data.generation, ...h].slice(0, 20));
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(null);
    }
  }

  async function act(fn) {
    setError('');
    try { setNotice((await fn()) || 'Done.'); } catch (e) { setError(e.message); }
  }

  const copy = () => navigator.clipboard.writeText(titleDraft || result.response)
    .then(() => setNotice('Copied.')).catch(() => setError('Copy failed. Select the text and copy it manually.'));

  const limitReached = usage && usage.used >= usage.limit;

  return (
    <aside className="ai-panel" aria-label="AI tools">
      <h2>AI tools</h2>
      <p className="hint">Analyzes the last saved version of this note.</p>

      <div className="tool-row">
        {TOOLS.map((op) => (
          <button key={op} className="btn" disabled={busy === op || limitReached} onClick={() => run(op)}>
            {OPS[op].button}
          </button>
        ))}
      </div>

      <form className="ask" onSubmit={(e) => { e.preventDefault(); if (question.trim()) run('question', question.trim()); }}>
        <label htmlFor="ask">Ask about this note</label>
        <div className="ask-row">
          <input id="ask" value={question} maxLength={500} placeholder="What is the deadline?"
                 onChange={(e) => setQuestion(e.target.value)} />
          <button className="btn" disabled={busy === 'question' || limitReached || !question.trim()}>Ask</button>
        </div>
      </form>

      <p className="status" role="status" aria-live="polite">{busy ? OPS[busy].busy : ''}</p>
      {error && <p className="error" role="alert">{error}</p>}
      {usage && <p className="usage">{usage.used} / {usage.limit} AI requests today</p>}

      {result && (
        <section className="result" aria-label="AI result">
          <h3>{OPS[result.operation].heading}</h3>
          {result.question && <p className="q">“{result.question}”</p>}
          {result.operation === 'title' ? (
            <input aria-label="Suggested title (editable)" value={titleDraft} maxLength={200}
                   onChange={(e) => setTitleDraft(e.target.value)} />
          ) : (
            <div className="ai-text">{result.response}</div>
          )}
          <div className="tool-row">
            {result.operation === 'title' ? (
              <button className="btn primary" disabled={!titleDraft.trim()} onClick={() => act(() => onUseTitle(titleDraft.trim()))}>Use as title</button>
            ) : (
              <button className="btn primary" onClick={() => act(() => onSaveToNote(result.response, OPS[result.operation].heading))}>Save to note</button>
            )}
            <button className="btn" onClick={copy}>Copy</button>
            <button className="btn" disabled={busy === result.operation || limitReached}
                    onClick={() => run(result.operation, result.question || undefined)}>Regenerate</button>
          </div>
          {notice && <p className="notice" role="status">{notice}</p>}
        </section>
      )}

      {history.length > 0 && (
        <section aria-label="AI history">
          <h3>History</h3>
          <ul className="history">
            {history.map((h) => (
              <li key={h.id}>
                <button className="link" onClick={() => show(h)}>
                  {OPS[h.operation].heading} <time dateTime={h.created_at}>{fmtDate(h.created_at)}</time>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </aside>
  );
}
