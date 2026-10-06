import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import Field from '../components/Field.jsx';

export default function Register() {
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/dashboard" replace />;
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    if (form.password !== form.confirmPassword) return setError('Passwords do not match.');
    setBusy(true); setError('');
    try { await register(form); navigate('/dashboard', { replace: true }); }
    catch (err) { setError(err.message); setBusy(false); }
  }

  return (
    <main className="auth">
      <form onSubmit={submit}>
        <h1>Create your account</h1>
        <Field id="name" label="Full name" autoComplete="name" required maxLength={100} value={form.name} onChange={set('name')} />
        <Field id="email" label="Email" type="email" autoComplete="email" required value={form.email} onChange={set('email')} />
        <Field id="password" label="Password (8+ characters)" type="password" autoComplete="new-password" required minLength={8} value={form.password} onChange={set('password')} />
        <Field id="confirm" label="Confirm password" type="password" autoComplete="new-password" required value={form.confirmPassword} onChange={set('confirmPassword')} />
        {error && <p className="error" role="alert">{error}</p>}
        <button className="btn primary" disabled={busy}>{busy ? 'Creating account…' : 'Create account'}</button>
        <p>Already registered? <Link to="/login">Log in</Link></p>
      </form>
    </main>
  );
}
