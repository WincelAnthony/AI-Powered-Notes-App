import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../services/api.js';
import { appendResult, fmtDate } from '../utils/format.js';
import AiPanel from '../components/AiPanel.jsx';

export default function NoteDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [note, setNote] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    setNote(null);
    api.notes.get(id).then((d) => setNote(d.note)).catch((e) => setError(e.message));
  }, [id]);

  if (error) return <p className="error" role="alert">{error} <Link to="/notes">Back to notes</Link></p>;
  if (!note) return <p role="status">Loading…</p>;

  const saveEdit = async (changes) => {
    const { note: updated } = await api.notes.update(id, { title: note.title, category: note.category, content: note.content, ...changes });
    setNote(updated);
  };
  const toggleArchive = () => api.notes.archive(id).then((d) => setNote(d.note)).catch((e) => setError(e.message));
  const remove = async () => {
    if (!window.confirm('Delete this note permanently?')) return;
    try { await api.notes.remove(id); navigate('/notes'); } catch (e) { setError(e.message); }
  };

  return (
    <>
      <header className="page-head">
        <div>
          <h1>{note.title}</h1>
          <p className="meta">
            <span className="tag">{note.category}</span>
            {note.is_archived && <span className="tag muted">Archived</span>}
            <time dateTime={note.updated_at}>Updated {fmtDate(note.updated_at)}</time>
          </p>
        </div>
        <div className="tool-row">
          <Link className="btn" to={`/notes/${id}/edit`}>Edit</Link>
          <button className="btn" onClick={toggleArchive}>{note.is_archived ? 'Unarchive' : 'Archive'}</button>
          <button className="btn danger" onClick={remove}>Delete</button>
        </div>
      </header>

      <div className="editor-layout">
        <article className="paper"><div className="note-body">{note.content || <em>This note is empty.</em>}</div></article>
        <AiPanel
          noteId={id}
          onUseTitle={async (title) => { await saveEdit({ title }); return 'Title updated.'; }}
          onSaveToNote={async (text, label) => { await saveEdit({ content: appendResult(note.content, label, text) }); return 'Saved to note.'; }}
        />
      </div>
    </>
  );
}
