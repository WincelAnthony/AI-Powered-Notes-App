import { NavLink, Outlet, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import { CATEGORIES } from '../utils/format.js';

export default function Layout() {
  const { user, logout } = useAuth();
  return (
    <div className="app">
      <a className="skip" href="#main">Skip to content</a>
      <aside className="sidebar">
        <Link to="/dashboard" className="brand">Marginalia</Link>
        <nav aria-label="Main">
          <NavLink to="/dashboard">Dashboard</NavLink>
          <NavLink to="/notes" end>Notes</NavLink>
          <NavLink to="/notes/new">New note</NavLink>
        </nav>
        <nav aria-label="Categories" className="cats">
          <p className="nav-title">Categories</p>
          {CATEGORIES.map((c) => <Link key={c} to={`/notes?category=${c}`}>{c}</Link>)}
        </nav>
        <div className="me">
          <span>{user.name}</span>
          <button className="link" onClick={logout}>Log out</button>
        </div>
      </aside>
      <main id="main"><Outlet /></main>
    </div>
  );
}
