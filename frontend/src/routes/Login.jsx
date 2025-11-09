import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function Login({ api, setUser, showToast }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });

  const handleChange = (evt) => {
    setForm((prev) => ({ ...prev, [evt.target.name]: evt.target.value }));
  };

  const handleSubmit = (evt) => {
    evt.preventDefault();
    api('/auth/login', {
      method: 'POST',
      body: JSON.stringify(form),
    })
      .then((data) => {
        setUser(data);
        navigate('/');
      })
      .catch((err) => showToast(err.message));
  };

  return (
    <section>
      <h2>Welcome back</h2>
      <form onSubmit={handleSubmit} aria-label="Login form">
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" required value={form.email} onChange={handleChange} autoComplete="email" />

        <label htmlFor="password">Password</label>
        <input id="password" name="password" type="password" required value={form.password} onChange={handleChange} autoComplete="current-password" />

        <button type="submit">Log in</button>
      </form>
      <p>
        No account yet? <Link to="/register">Create one</Link>
      </p>
    </section>
  );
}
