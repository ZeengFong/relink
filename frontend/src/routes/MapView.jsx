import { useCallback, useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import HazardLegend, { HAZARD_COLORS } from '../components/HazardLegend.jsx';

export default function MapView({ api, showToast }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const layerGroup = useRef(null);
  const [hazards, setHazards] = useState([]);
  const [form, setForm] = useState({ type: 'fire', lat: 51.05, lng: -114.07, radius: 500, note: '', address: '' });
  const [resolving, setResolving] = useState(false);

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
    if (hazards.length && mapInstance.current) {
      const latest = hazards[hazards.length - 1];
      mapInstance.current.setView([latest.center.lat, latest.center.lng], 12);
    }
    if (mapInstance.current) {
      setTimeout(() => mapInstance.current?.invalidateSize(), 150);
    }
  }, [hazards]);

  const handleChange = (evt) => {
    const { name, value } = evt.target;
    const numericFields = new Set(['lat', 'lng', 'radius']);
    setForm((prev) => ({ ...prev, [name]: numericFields.has(name) ? Number(value) : value }));
  };

  const lookupAddress = async (address) => {
    const url = new URL('https://nominatim.openstreetmap.org/search');
    url.searchParams.set('q', address);
    url.searchParams.set('format', 'json');
    url.searchParams.set('limit', '1');
    const resp = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!resp.ok) {
      throw new Error('Lookup failed');
    }
    const data = await resp.json();
    if (!data.length) {
      throw new Error('Address not found');
    }
    return { lat: Number(data[0].lat), lng: Number(data[0].lon) };
  };

  const geocodeAddress = async () => {
    if (!form.address.trim()) {
      showToast('Enter an address first');
      return;
    }
    setResolving(true);
    try {
      const coords = await lookupAddress(form.address.trim());
      setForm((prev) => ({ ...prev, lat: coords.lat, lng: coords.lng }));
      showToast('Location updated from address');
    } catch (err) {
      showToast(err.message);
    } finally {
      setResolving(false);
    }
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      showToast('Location not supported');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((prev) => ({
          ...prev,
          lat: Number(pos.coords.latitude.toFixed(5)),
          lng: Number(pos.coords.longitude.toFixed(5)),
        }));
        showToast('Using your current coordinates');
      },
      () => showToast('Failed to grab your position'),
    );
  };

  const handleSubmit = async (evt) => {
    evt.preventDefault();
    try {
      let lat = Number(form.lat);
      let lng = Number(form.lng);
      if (form.address.trim()) {
        const coords = await lookupAddress(form.address.trim());
        lat = coords.lat;
        lng = coords.lng;
        setForm((prev) => ({ ...prev, lat, lng }));
      }
      await api('/hazards', {
        method: 'POST',
        body: JSON.stringify({
          type: form.type,
          radius_m: Number(form.radius),
          center: { lat, lng },
          note: form.note,
        }),
      });
      showToast('Hazard submitted');
      setForm((prev) => ({ ...prev, note: '' }));
      loadHazards();
    } catch (err) {
      showToast(err?.message || 'Unable to submit hazard');
    }
  };

  return (
    <section className="page-section" style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
      <div>
        <div className="hero">
          <strong>Report hazard</strong>
          <h2>Keep neighbors out of danger</h2>
          <p>Circles update instantly for everyone on reLink.</p>
        </div>
        <form onSubmit={handleSubmit} className="grid" style={{ gap: '0.75rem' }}>
          <label htmlFor="type">Type</label>
          <select id="type" name="type" value={form.type} onChange={handleChange}>
            {Object.keys(HAZARD_COLORS).map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          <label htmlFor="address">Address (optional)</label>
          <input
            id="address"
            name="address"
            value={form.address}
            onChange={handleChange}
            placeholder="e.g. 425 6 Ave SE, Calgary"
          />
          <label htmlFor="lat">Latitude</label>
          <input id="lat" name="lat" type="number" value={form.lat} onChange={handleChange} />
          <label htmlFor="lng">Longitude</label>
          <input id="lng" name="lng" type="number" value={form.lng} onChange={handleChange} />
          <label htmlFor="radius">Radius (m)</label>
          <input id="radius" name="radius" type="number" value={form.radius} onChange={handleChange} />
          <label htmlFor="note">Note</label>
          <textarea id="note" name="note" value={form.note} onChange={handleChange} placeholder="Smoke drifting over…" />
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button type="button" className="secondary" onClick={useMyLocation}>
              Use my location
            </button>
            <button type="button" className="secondary" onClick={geocodeAddress} disabled={resolving}>
              {resolving ? 'Locating…' : 'Locate address'}
            </button>
          </div>
          <button type="submit">Submit</button>
        </form>
        <HazardLegend />
      </div>
      <div>
        <h3 style={{ marginTop: 0 }}>Live hazard map</h3>
        <div ref={mapRef} className="map-container" role="img" aria-label="Map of user reported hazards"></div>
      </div>
    </section>
  );
}
