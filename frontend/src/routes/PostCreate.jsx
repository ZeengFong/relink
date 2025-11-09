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
    address: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (evt) => {
    setForm((prev) => ({ ...prev, [evt.target.name]: evt.target.value }));
  };

  const geocodeAddress = async (query) => {
    const url = new URL('https://nominatim.openstreetmap.org/search');
    url.searchParams.set('q', query);
    url.searchParams.set('format', 'json');
    url.searchParams.set('limit', '1');
    const resp = await fetch(url.toString(), {
      headers: { Accept: 'application/json' },
    });
    if (!resp.ok) {
      throw new Error('Address lookup failed');
    }
    const results = await resp.json();
    if (!results.length) {
      throw new Error('No results for that address');
    }
    return { lat: Number(results[0].lat), lng: Number(results[0].lon) };
  };

  const locateFromAddress = async () => {
    if (!form.address.trim()) {
      showToast('Enter an address first');
      return;
    }
    setSubmitting(true);
    try {
      const coords = await geocodeAddress(form.address.trim());
      setForm((prev) => ({ ...prev, lat: coords.lat, lng: coords.lng }));
      showToast('Coordinates filled from address');
    } catch (err) {
      showToast(err?.message || 'Unable to create offer');
    } finally {
      setSubmitting(false);
    }
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      showToast('Location not supported in this browser');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((prev) => ({
          ...prev,
          lat: Number(pos.coords.latitude.toFixed(5)),
          lng: Number(pos.coords.longitude.toFixed(5)),
        }));
        showToast('Coordinates updated from your location');
      },
      () => showToast('Unable to get location permission'),
    );
  };

  const handleSubmit = async (evt) => {
    evt.preventDefault();
    setSubmitting(true);
    try {
      let lat = Number(form.lat);
      let lng = Number(form.lng);
      if (form.address.trim()) {
        const coords = await geocodeAddress(form.address.trim());
        lat = coords.lat;
        lng = coords.lng;
      }
      const payload = {
        title: form.title,
        description: form.description,
        capacity: Number(form.capacity),
        location: { lat, lng },
      };
      const { id } = await api('/posts', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      showToast('Offer published');
      navigate(`/posts/${id}`);
    } catch (err) {
      showToast(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="page-section" style={{ maxWidth: '720px', margin: '0 auto' }}>
      <div className="hero">
        <strong>New offer</strong>
        <h2>Describe how you can help</h2>
        <p>Share clear details so neighbors understand availability.</p>
      </div>
      <form onSubmit={handleSubmit} className="grid" style={{ gap: '1rem' }}>
        <label htmlFor="title">Title</label>
        <input id="title" name="title" required value={form.title} onChange={handleChange} placeholder="Hot meals tonight" />

        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          name="description"
          rows="4"
          required
          value={form.description}
          onChange={handleChange}
          placeholder="Serving 30 plates with vegan options..."
        />

        <label htmlFor="address">Address (auto geocode)</label>
        <input
          id="address"
          name="address"
          value={form.address}
          onChange={handleChange}
          placeholder="e.g. 373 Memorial Dr NW, Calgary"
        />

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '160px' }}>
            <label htmlFor="capacity">Capacity</label>
            <input id="capacity" name="capacity" type="number" min="1" value={form.capacity} onChange={handleChange} />
          </div>
          <div style={{ flex: 1, minWidth: '160px' }}>
            <label htmlFor="lat">Latitude</label>
            <input id="lat" name="lat" type="number" step="0.0001" value={form.lat} onChange={handleChange} />
          </div>
          <div style={{ flex: 1, minWidth: '160px' }}>
            <label htmlFor="lng">Longitude</label>
            <input id="lng" name="lng" type="number" step="0.0001" value={form.lng} onChange={handleChange} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button type="button" className="secondary" onClick={useMyLocation}>
            Use my location
          </button>
          <button type="button" className="secondary" onClick={locateFromAddress} disabled={submitting}>
            {submitting ? 'Resolving…' : 'Locate address'}
          </button>
        </div>
        <button type="submit" disabled={submitting}>
          {submitting ? 'Saving…' : 'Create offer'}
        </button>
      </form>
    </section>
  );
}
