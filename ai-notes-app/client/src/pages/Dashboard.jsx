import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api.js';
import NoteCard from '../components/NoteCard.jsx';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => { api.notes.stats().then(setStats).catch((e) => setError(e.message)); }, []);

  if (error) return <p className="error" role="alert">{error}</p>;
  if (!stats) return <p role="status">Loading…</p>;

  return (
    <>
      <header className="page-head">
        <h1>Dashboard</h1>
        <Link className="btn primary" to="/notes/new">New note</Link>
      </header>

      <section className="figures" aria-label="Totals">
        <div><strong>{stats.active}</strong> active notes</div>
        <div><strong>{stats.archived}</strong> archived</div>
        <div><strong>{stats.categories.length}</strong> categories in use</div>
      </section>

      <section>
        <h2>Recent notes</h2>
        {stats.recent.length === 0
          ? <p>No notes yet. <Link to="/notes/new">Write your first one.</Link></p>
          : <ul className="note-list">{stats.recent.map((n) => <NoteCard key={n.id} note={n} />)}</ul>}
      </section>

      {stats.categories.length > 0 && (
        <section>
          <h2>By category</h2>
          <ul className="chips">
            {stats.categories.map((c) => (
              <li key={c.category}><Link to={`/notes?category=${c.category}`}>{c.category} <b>{c.count}</b></Link></li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
