import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export default function PostCreate({ api }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '',
    description: '',
    capacity: 10,
    lat: 51.05,
    lng: -114.07,
  });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (evt) => {
    setForm((prev) => ({ ...prev, [evt.target.name]: evt.target.value }));
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      console.error('Location not supported in this browser');
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
      () => console.error('Unable to get location permission'),
    );
  };

  const handleSubmit = async (evt) => {
    evt.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        title: form.title,
        description: form.description,
        capacity: Number(form.capacity),
        location: { lat: Number(form.lat), lng: Number(form.lng) },
      };
      const { id } = await api('/posts', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      navigate(`/posts/${id}`);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Create a new offer</CardTitle>
        <CardDescription>
          Share clear details so neighbors understand availability.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              name="title"
              required
              value={form.title}
              onChange={handleChange}
              placeholder="Hot meals tonight"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              rows="4"
              required
              value={form.description}
              onChange={handleChange}
              placeholder="Serving 30 plates with vegan options..."
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="capacity">Capacity</Label>
              <Input
                id="capacity"
                name="capacity"
                type="number"
                min="1"
                value={form.capacity}
                onChange={handleChange}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="lat">Latitude</Label>
              <Input
                id="lat"
                name="lat"
                type="number"
                step="0.0001"
                value={form.lat}
                onChange={handleChange}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="lng">Longitude</Label>
              <Input
                id="lng"
                name="lng"
                type="number"
                step="0.0001"
                value={form.lng}
                onChange={handleChange}
              />
            </div>
          </div>
          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={useMyLocation}
            >
              Use my location
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Saving…' : 'Create offer'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
