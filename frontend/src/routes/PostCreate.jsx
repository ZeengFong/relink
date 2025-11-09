import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function PostCreate({ api, showToast }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '',
    description: '',
    capacity: 10,
    lat: 51.05,
    lng: -114.07,
  });

  const handleChange = (evt) => {
    setForm((prev) => ({ ...prev, [evt.target.name]: evt.target.value }));
  };

  const handleSubmit = (evt) => {
    evt.preventDefault();
    api('/posts', {
      method: 'POST',
      body: JSON.stringify({
        title: form.title,
        description: form.description,
        capacity: Number(form.capacity),
        location: { lat: Number(form.lat), lng: Number(form.lng) },
      }),
    })
      .then(({ id }) => {
        showToast('Offer published');
        navigate(`/posts/${id}`);
      })
      .catch((err) => showToast(err.message));
  };

  return (
    <section>
      <h2>New offer</h2>
      <form onSubmit={handleSubmit} className="grid">
        <label htmlFor="title">Title</label>
        <input id="title" name="title" required value={form.title} onChange={handleChange} />

        <label htmlFor="description">Description</label>
        <textarea id="description" name="description" required value={form.description} onChange={handleChange} />

        <label htmlFor="capacity">Capacity</label>
        <input id="capacity" name="capacity" type="number" min="1" value={form.capacity} onChange={handleChange} />

        <label htmlFor="lat">Latitude</label>
        <input id="lat" name="lat" type="number" step="0.0001" value={form.lat} onChange={handleChange} />

        <label htmlFor="lng">Longitude</label>
        <input id="lng" name="lng" type="number" step="0.0001" value={form.lng} onChange={handleChange} />

        <button type="submit">Create offer</button>
      </form>
    </section>
  );
}
