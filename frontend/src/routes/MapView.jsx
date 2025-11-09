import { useCallback, useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import HazardLegend, { HAZARD_COLORS } from '../components/HazardLegend.jsx';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

const EVENT_COLORS = {
  Wildfires: '#dc2626',
  'Severe Storms': '#f97316',
  Volcanoes: '#92400e',
  Earthquakes: '#0f172a',
  Floods: '#2563eb',
};

export default function MapView({ api }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const layerGroup = useRef(null);
  const hotspotLayer = useRef(null);
  const regionLayer = useRef(null);
  const eventLayer = useRef(null);
  const [hazards, setHazards] = useState([]);
  const [hotspots, setHotspots] = useState([]);
  const [areas, setAreas] = useState([]);
  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventsError, setEventsError] = useState('');
  const [form, setForm] = useState({ type: 'fire', lat: '51.05', lng: '-114.07', radius: '500', note: '' });
  const [submitting, setSubmitting] = useState(false);
  const [locationStatus, setLocationStatus] = useState('');

  const focusOn = useCallback((lat, lng, zoom = 9) => {
    if (!mapInstance.current || Number.isNaN(lat) || Number.isNaN(lng)) return;
    mapInstance.current.setView([lat, lng], zoom, { animate: true });
  }, []);

  const applyLocation = useCallback(
    (lat, lng, message) => {
      if (Number.isNaN(lat) || Number.isNaN(lng)) return;
      const latStr = lat.toFixed(5);
      const lngStr = lng.toFixed(5);
      setForm((prev) => ({
        ...prev,
        lat: latStr,
        lng: lngStr,
      }));
      focusOn(lat, lng, 13);
      if (message) {
        setLocationStatus(message);
      }
    },
    [focusOn],
  );

  const loadHazards = useCallback(() => {
    api('/hazards')
      .then(({ hazards: list }) => setHazards(list))
      .catch((err) => console.error(err));
  }, [api]);

  const loadStaticDisasterData = useCallback(() => {
    api('/disaster/map')
      .then(({ locations }) => setHotspots(locations || []))
      .catch((err) => console.error(err));
    api('/disaster/areas')
      .then(({ areas: list }) => setAreas(list || []))
      .catch((err) => console.error(err));
  }, [api]);

  const refreshEvents = useCallback(() => {
    setEventsLoading(true);
    setEventsError('');
    api('/disaster/events')
      .then((payload) => {
        setEvents(payload.events || []);
        if (payload.error) {
          setEventsError(payload.error);
        }
      })
      .catch((err) => {
        console.error(err);
        setEventsError('Unable to load live alerts right now.');
      })
      .finally(() => setEventsLoading(false));
  }, [api]);

  useEffect(() => {
    if (!mapRef.current) return;

    mapInstance.current = L.map(mapRef.current).setView([Number(form.lat), Number(form.lng)], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(mapInstance.current);
    layerGroup.current = L.layerGroup().addTo(mapInstance.current);
    hotspotLayer.current = L.layerGroup().addTo(mapInstance.current);
    regionLayer.current = L.layerGroup().addTo(mapInstance.current);
    eventLayer.current = L.layerGroup().addTo(mapInstance.current);

    const resizeObserver = new ResizeObserver(() => {
      mapInstance.current?.invalidateSize();
    });
    resizeObserver.observe(mapRef.current);

    return () => {
      resizeObserver.disconnect();
      mapInstance.current?.remove();
      layerGroup.current = null;
      hotspotLayer.current = null;
      regionLayer.current = null;
      eventLayer.current = null;
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

    if (hazards.length) {
      const latest = hazards[hazards.length - 1];
      focusOn(latest.center.lat, latest.center.lng, 12);
    }
  }, [hazards, focusOn]);

  useEffect(() => {
    if (!hotspotLayer.current) return;
    hotspotLayer.current.clearLayers();
    hotspots.forEach((point) => {
      if (typeof point.x !== 'number' || typeof point.y !== 'number') return;
      L.circleMarker([point.x, point.y], {
        radius: 7,
        color: '#1d4ed8',
        fillColor: '#60a5fa',
        fillOpacity: 0.9,
        weight: 1,
      })
        .bindPopup(point.location || 'Hotspot')
        .addTo(hotspotLayer.current);
    });
  }, [hotspots]);

  useEffect(() => {
    if (!regionLayer.current) return;
    regionLayer.current.clearLayers();
    areas.forEach((area) => {
      if (!Array.isArray(area.coordinates)) return;
      L.polygon(area.coordinates, {
        color: '#f97316',
        weight: 2,
        fillOpacity: 0.15,
      })
        .bindPopup(area.name || 'Restricted zone')
        .addTo(regionLayer.current);
    });
  }, [areas]);

  useEffect(() => {
    if (!eventLayer.current) return;
    eventLayer.current.clearLayers();
    events.forEach((event) => {
      if (typeof event.latitude !== 'number' || typeof event.longitude !== 'number') return;
      const color = EVENT_COLORS[event.category] || '#0f172a';
      L.circleMarker([event.latitude, event.longitude], {
        radius: 8,
        color,
        fillColor: color,
        fillOpacity: 0.8,
        weight: 1.5,
      })
        .bindPopup(
          `<strong>${event.title}</strong><br/>${event.category}<br/>${
            event.date ? new Date(event.date).toLocaleString() : ''
          }`,
        )
        .addTo(eventLayer.current);
    });
  }, [events]);

  useEffect(() => {
    loadHazards();
  }, [loadHazards]);

  useEffect(() => {
    loadStaticDisasterData();
    refreshEvents();
  }, [loadStaticDisasterData, refreshEvents]);

  const handleChange = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const fallbackLocate = useCallback(() => {
    setLocationStatus('Trying network-based location…');
    fetch('https://ipapi.co/json/')
      .then((resp) => (resp.ok ? resp.json() : Promise.reject(new Error('ip lookup failed'))))
      .then((data) => {
        if (data?.latitude && data?.longitude) {
          applyLocation(Number(data.latitude), Number(data.longitude), 'Estimated your location via network lookup.');
        } else {
          throw new Error('Missing coordinates');
        }
      })
      .catch((err) => {
        console.error('Fallback geolocation failed', err);
        setLocationStatus('Unable to fetch your location. Please ensure permissions are allowed.');
      });
  }, [applyLocation]);

  const useMyLocation = () => {
    const secure =
      typeof window !== 'undefined' &&
      (window.isSecureContext || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    if (!navigator.geolocation || !secure) {
      fallbackLocate();
      return;
    }
    setLocationStatus('Locating you…');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        applyLocation(pos.coords.latitude, pos.coords.longitude, 'Centered on your location.');
      },
      (err) => {
        console.error('Failed to grab your position', err);
        fallbackLocate();
      },
      { enableHighAccuracy: true, timeout: 10000 },
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
    <div className="px-4 py-6">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <div className="w-full">
          <HazardLegend />
        </div>
        <Card className="overflow-hidden">
          <div
            ref={mapRef}
            className="w-full rounded-lg"
            style={{ aspectRatio: '16 / 10', minHeight: '360px' }}
            role="img"
            aria-label="Map of user reported hazards"
          ></div>
        </Card>
        <Card>
          <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Live disaster alerts</CardTitle>
            <Button variant="outline" size="sm" onClick={refreshEvents} disabled={eventsLoading}>
              {eventsLoading ? 'Refreshing…' : 'Refresh'}
            </Button>
          </CardHeader>
          <CardContent>
            {eventsError && <p className="text-sm text-destructive">{eventsError}</p>}
            {!eventsError && !events.length && !eventsLoading && (
              <p className="text-sm text-slate-600">No major NASA alerts in the last week.</p>
            )}
            <ul className="divide-y divide-border">
              {events.map((event) => (
                <li key={event.id} className="py-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-semibold text-slate-900">{event.title}</p>
                      <p className="text-xs uppercase tracking-wide text-slate-600">
                        {event.category} ·{' '}
                        {event.date ? new Date(event.date).toLocaleString() : 'Unknown'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-flex h-3 w-3 rounded-full"
                        style={{ backgroundColor: EVENT_COLORS[event.category] || '#0f172a' }}
                        aria-hidden="true"
                      ></span>
                      <Button variant="link" className="px-0" onClick={() => focusOn(event.latitude, event.longitude, 6)}>
                        Center map
                      </Button>
                    </div>
                  </div>
                  {event.link && (
                    <a
                      href={event.link}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-blue-600 underline"
                    >
                      View details
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Report Hazard</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <Label htmlFor="type" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Type
                </Label>
                <Select value={form.type} onValueChange={(value) => handleChange('type', value)}>
                  <SelectTrigger id="type">
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
              <div className="grid gap-4 md:grid-cols-3">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="lat" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Latitude
                  </Label>
                  <Input id="lat" name="lat" type="number" value={form.lat} onChange={(e) => handleChange(e.target.name, e.target.value)} />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="lng" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Longitude
                  </Label>
                  <Input id="lng" name="lng" type="number" value={form.lng} onChange={(e) => handleChange(e.target.name, e.target.value)} />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="radius" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Radius (m)
                  </Label>
                  <Input id="radius" name="radius" type="number" value={form.radius} onChange={(e) => handleChange(e.target.name, e.target.value)} />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="note" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Note
                </Label>
                <Textarea id="note" name="note" value={form.note} onChange={(e) => handleChange(e.target.name, e.target.value)} placeholder="Smoke drifting over…" />
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-col gap-1">
                  <Button type="button" className="bg-blue-600 text-white hover:bg-blue-500" onClick={useMyLocation}>
                    Use my location
                  </Button>
                  {locationStatus && <p className="text-xs text-slate-600">{locationStatus}</p>}
                </div>
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Submitting…' : 'Submit'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
