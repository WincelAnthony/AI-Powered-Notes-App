import { Link } from 'react-router-dom';
import { fmtDate } from '../utils/format.js';

export default function NoteCard({ note }) {
  return (
    <li className="note-card">
      <Link to={`/notes/${note.id}`}>
        <h3>{note.title}</h3>
        {note.excerpt && <p>{note.excerpt}</p>}
        <span className="meta">
          <span className="tag">{note.category}</span>
          {note.is_archived && <span className="tag muted">Archived</span>}
          <time dateTime={note.updated_at}>{fmtDate(note.updated_at)}</time>
        </span>
      </Link>
    </li>
  );
}
