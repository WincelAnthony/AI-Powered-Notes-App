import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import Field from '../components/Field.jsx';

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const from = useLocation().state?.from?.pathname || '/dashboard';
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={from} replace />;

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setError('');
    try { await login(form); navigate(from, { replace: true }); }
    catch (err) { setError(err.message); setBusy(false); }
  }
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <main className="auth">
      <form onSubmit={submit}>
        <h1>Log in</h1>
        <Field id="email" label="Email" type="email" autoComplete="email" required value={form.email} onChange={set('email')} />
        <Field id="password" label="Password" type="password" autoComplete="current-password" required value={form.password} onChange={set('password')} />
        {error && <p className="error" role="alert">{error}</p>}
        <button className="btn primary" disabled={busy}>{busy ? 'Logging in…' : 'Log in'}</button>
        <p>New here? <Link to="/register">Create an account</Link></p>
      </form>
    </main>
  );
}
