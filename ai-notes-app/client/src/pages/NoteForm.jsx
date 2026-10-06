import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../services/api.js';
import { CATEGORIES, appendResult } from '../utils/format.js';
import AiPanel from '../components/AiPanel.jsx';

// Used for both /notes/new and /notes/:id/edit.
export default function NoteForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: '', category: 'Other', content: '' });
  const [loading, setLoading] = useState(Boolean(id));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    api.notes.get(id)
      .then(({ note }) => setForm({ title: note.title, category: note.category, content: note.content }))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      const { note } = id ? await api.notes.update(id, form) : await api.notes.create(form);
      navigate(`/notes/${note.id}`);
    } catch (err) {
      setError(err.message); setSaving(false);
    }
  }

  if (loading) return <p role="status">Loading…</p>;

  return (
    <>
      <header className="page-head"><h1>{id ? 'Edit note' : 'New note'}</h1></header>
      <div className="editor-layout">
        <form className="paper" onSubmit={submit}>
          <div className="field">
            <label htmlFor="title">Title</label>
            <input id="title" required maxLength={200} value={form.title} onChange={set('title')} />
          </div>
          <div className="field">
            <label htmlFor="category">Category</label>
            <select id="category" value={form.category} onChange={set('category')}>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="field">
            <label htmlFor="content">Content</label>
            <textarea id="content" rows={14} maxLength={20000} value={form.content} onChange={set('content')} />
          </div>
          {error && <p className="error" role="alert">{error}</p>}
          <div className="tool-row">
            <button className="btn primary" disabled={saving}>{saving ? 'Saving…' : 'Save note'}</button>
            <Link className="btn" to={id ? `/notes/${id}` : '/notes'}>Cancel</Link>
          </div>
        </form>

        {id ? (
          <AiPanel
            noteId={id}
            onUseTitle={(title) => { setForm((f) => ({ ...f, title })); return 'Title applied. Click Save note to keep it.'; }}
            onSaveToNote={(text, label) => {
              setForm((f) => ({ ...f, content: appendResult(f.content, label, text) }));
              return 'Added to the editor. Click Save note to keep it.';
            }}
          />
        ) : (
          <aside className="ai-panel"><h2>AI tools</h2><p className="hint">Save the note first, then summarize it, pull out key points and action items, or ask questions.</p></aside>
        )}
      </div>
    </>
  );
}
