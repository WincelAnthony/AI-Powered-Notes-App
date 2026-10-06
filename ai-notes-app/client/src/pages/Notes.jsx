import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../services/api.js';
import { useDebounce } from '../hooks/useDebounce.js';
import { CATEGORIES } from '../utils/format.js';
import NoteCard from '../components/NoteCard.jsx';

export default function Notes() {
  const [params, setParams] = useSearchParams();
  const category = params.get('category') || '';
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('false'); // 'false' = active, 'true' = archived, 'all'
  const [from, setFrom] = useState('');
  const debouncedQ = useDebounce(q);
  const [notes, setNotes] = useState(null);
  const [error, setError] = useState('');

  // Filtering/searching only queries our own API (never the AI).
  useEffect(() => {
    let cancelled = false;
    setError('');
    api.notes.list({ q: debouncedQ, category, archived: status, from })
      .then((d) => !cancelled && setNotes(d.notes))
      .catch((e) => !cancelled && setError(e.message));
    return () => { cancelled = true; };
  }, [debouncedQ, category, status, from]);

  const setCategory = (c) => setParams(c ? { category: c } : {});

  return (
    <>
      <header className="page-head">
        <h1>Notes</h1>
        <Link className="btn primary" to="/notes/new">New note</Link>
      </header>

      <div className="filters" role="search">
        <div className="field grow">
          <label htmlFor="q">Search notes</label>
          <input id="q" type="search" placeholder="Search title and content…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="cat">Category</label>
          <select id="cat" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">All categories</option>
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="status">Status</label>
          <select id="status" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="false">Active</option>
            <option value="true">Archived</option>
            <option value="all">All</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="from">Created since</label>
          <input id="from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
      </div>

      {error && <p className="error" role="alert">{error}</p>}
      {!notes && !error && <p role="status">Loading…</p>}
      {notes && notes.length === 0 && <p>No notes match these filters.</p>}
      {notes && notes.length > 0 && <ul className="note-list">{notes.map((n) => <NoteCard key={n.id} note={n} />)}</ul>}
    </>
  );
}
