import { useCallback, useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import HazardLegend, { HAZARD_COLORS } from '../components/HazardLegend.jsx';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

export default function MapView({ api }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const layerGroup = useRef(null);
  const [hazards, setHazards] = useState([]);
  const [form, setForm] = useState({ type: 'fire', lat: 51.05, lng: -114.07, radius: 500, note: '' });
  const [submitting, setSubmitting] = useState(false);

  const loadHazards = useCallback(() => {
    api('/hazards')
      .then(({ hazards: list }) => setHazards(list))
      .catch((err) => console.error(err));
  }, [api]);

  useEffect(() => {
    loadHazards();
  }, [loadHazards]);

  useEffect(() => {
    if (!mapRef.current) return;

    mapInstance.current = L.map(mapRef.current).setView([form.lat, form.lng], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(mapInstance.current);
    layerGroup.current = L.layerGroup().addTo(mapInstance.current);

    const resizeObserver = new ResizeObserver(() => {
      mapInstance.current?.invalidateSize();
    });
    resizeObserver.observe(mapRef.current);

    return () => {
      resizeObserver.disconnect();
      mapInstance.current?.remove();
    };
  }, []);

  useEffect(() => {
    if (!layerGroup.current) return;

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
  }, [hazards]);

  const handleChange = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      console.error('Location not supported');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((prev) => ({
          ...prev,
          lat: Number(pos.coords.latitude.toFixed(5)),
          lng: Number(pos.coords.longitude.toFixed(5)),
        }));
      },
      () => console.error('Failed to grab your position'),
    );
  };

  const handleSubmit = async (evt) => {
    evt.preventDefault();
    setSubmitting(true);
    try {
      await api('/hazards', {
        method: 'POST',
        body: JSON.stringify({
          type: form.type,
          radius_m: Number(form.radius),
          center: { lat: Number(form.lat), lng: Number(form.lng) },
          note: form.note,
        }),
      });
      setForm((prev) => ({ ...prev, note: '' }));
      loadHazards();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[calc(100vh-120px)]">
      <div className="md:col-span-2">
        <Card className="h-full">
          <div ref={mapRef} className="h-full w-full rounded-lg" role="img" aria-label="Map of user reported hazards"></div>
        </Card>
      </div>
      <div className="md:col-span-1 flex flex-col gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Report Hazard</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="type">Type</Label>
                <Select value={form.type} onValueChange={(value) => handleChange('type', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a hazard type" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(HAZARD_COLORS).map((type) => (
                      <SelectItem key={type} value={type} className="capitalize">
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="lat">Latitude</Label>
                  <Input id="lat" name="lat" type="number" value={form.lat} onChange={(e) => handleChange(e.target.name, e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="lng">Longitude</Label>
                  <Input id="lng" name="lng" type="number" value={form.lng} onChange={(e) => handleChange(e.target.name, e.target.value)} />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="radius">Radius (m)</Label>
                <Input id="radius" name="radius" type="number" value={form.radius} onChange={(e) => handleChange(e.target.name, e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="note">Note</Label>
                <Textarea id="note" name="note" value={form.note} onChange={(e) => handleChange(e.target.name, e.target.value)} placeholder="Smoke drifting over…" />
              </div>
              <div className="flex justify-between">
                <Button type="button" variant="outline" onClick={useMyLocation}>
                  Use my location
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Submitting…' : 'Submit'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
        <HazardLegend />
      </div>
    </div>
  );
}
