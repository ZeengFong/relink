import { useCallback, useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import HazardLegend, { HAZARD_COLORS } from '../components/HazardLegend.jsx';

export default function MapView({ api, showToast }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const layerGroup = useRef(null);
  const [hazards, setHazards] = useState([]);
  const [form, setForm] = useState({ type: 'fire', lat: 51.05, lng: -114.07, radius: 500, note: '' });

  const loadHazards = useCallback(() => {
    api('/hazards')
      .then(({ hazards: list }) => setHazards(list))
      .catch((err) => showToast(err.message));
  }, [api, showToast]);

  useEffect(() => {
    loadHazards();
  }, [loadHazards]);

  useEffect(() => {
    if (!mapRef.current) {
      return;
    }
    mapInstance.current = L.map(mapRef.current).setView([form.lat, form.lng], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(mapInstance.current);
    layerGroup.current = L.layerGroup().addTo(mapInstance.current);
    return () => mapInstance.current.remove();
  }, []);

  useEffect(() => {
    if (!layerGroup.current) {
      return;
    }
    layerGroup.current.clearLayers();
    hazards.forEach((hazard) => {
      const color = HAZARD_COLORS[hazard.type] || '#0f172a';
      L.circle([hazard.center.lat, hazard.center.lng], {
        color,
        fillColor: color,
        fillOpacity: 0.2,
        radius: hazard.radius_m,
      })
        .bindPopup(`${hazard.type} — ${hazard.note || 'No note'}`)
        .addTo(layerGroup.current);
    });
  }, [hazards]);

  const handleChange = (evt) => {
    const { name, value } = evt.target;
    const numericFields = new Set(['lat', 'lng', 'radius']);
    setForm((prev) => ({ ...prev, [name]: numericFields.has(name) ? Number(value) : value }));
  };

  const handleSubmit = (evt) => {
    evt.preventDefault();
    api('/hazards', {
      method: 'POST',
      body: JSON.stringify({
        type: form.type,
        radius_m: Number(form.radius),
        center: { lat: Number(form.lat), lng: Number(form.lng) },
        note: form.note,
      }),
    })
      .then(() => {
        showToast('Hazard submitted');
        setForm((prev) => ({ ...prev, note: '' }));
        loadHazards();
      })
      .catch((err) => showToast(err.message));
  };

  return (
    <section className="grid" style={{ gap: '1.5rem' }}>
      <div>
        <h2>Hazard map</h2>
        <div ref={mapRef} className="map-container" role="img" aria-label="Map of user reported hazards"></div>
      </div>
      <div>
        <h3>Report hazard</h3>
        <form onSubmit={handleSubmit} className="grid" style={{ gap: '0.5rem' }}>
          <label htmlFor="type">Type</label>
          <select id="type" name="type" value={form.type} onChange={handleChange}>
            {Object.keys(HAZARD_COLORS).map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          <label htmlFor="lat">Latitude</label>
          <input id="lat" name="lat" type="number" value={form.lat} onChange={handleChange} />
          <label htmlFor="lng">Longitude</label>
          <input id="lng" name="lng" type="number" value={form.lng} onChange={handleChange} />
          <label htmlFor="radius">Radius (m)</label>
          <input id="radius" name="radius" type="number" value={form.radius} onChange={handleChange} />
          <label htmlFor="note">Note</label>
          <textarea id="note" name="note" value={form.note} onChange={handleChange} placeholder="Smoke drifting over…" />
          <button type="submit">Submit</button>
        </form>
        <HazardLegend />
      </div>
    </section>
  );
}
