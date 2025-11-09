import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function Register({ api, setUser, showToast }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', name: '', password: '' });

  const handleChange = (evt) => {
    setForm((prev) => ({ ...prev, [evt.target.name]: evt.target.value }));
  };

  const handleSubmit = (evt) => {
    evt.preventDefault();
    api('/auth/register', {
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
    <section className="page-section" style={{ maxWidth: '520px', margin: '2rem auto' }}>
      <div className="hero">
        <strong>Join reLink</strong>
        <h2>Create a helper profile</h2>
        <p>Passwords stay hashed with bcrypt. Takes 30 seconds.</p>
      </div>
      <form onSubmit={handleSubmit} aria-label="Registration form" className="grid" style={{ gap: '0.9rem' }}>
        <label htmlFor="reg-email">Email</label>
        <input id="reg-email" name="email" type="email" required value={form.email} onChange={handleChange} />

        <label htmlFor="name">Name</label>
        <input id="name" name="name" required value={form.name} onChange={handleChange} />

        <label htmlFor="reg-password">Password</label>
        <input id="reg-password" name="password" type="password" required minLength={8} value={form.password} onChange={handleChange} />

        <button type="submit">Join reLink</button>
      </form>
      <p style={{ marginTop: '1rem' }}>
        Already registered? <Link to="/login">Log in</Link>
      </p>
    </section>
  );
}
