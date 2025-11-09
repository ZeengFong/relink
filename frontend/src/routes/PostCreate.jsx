import { useRef, useState } from 'react';
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
  const [imageData, setImageData] = useState(null);
  const [imageError, setImageError] = useState('');
  const fileInputRef = useRef(null);

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
        image: imageData,
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

  const handleImageChange = (evt) => {
    const file = evt.target.files?.[0];
    if (!file) {
      setImageData(null);
      setImageError('');
      return;
    }
    const allowedTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      setImageData(null);
      setImageError('Use PNG, JPG, GIF, or WebP images.');
      return;
    }
    if (file.size > 1.5 * 1024 * 1024) {
      setImageData(null);
      setImageError('Images must be under 1.5MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setImageError('');
      setImageData(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const clearImage = () => {
    setImageData(null);
    setImageError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="px-4 py-6">
      <Card className="mx-auto w-full max-w-4xl">
        <CardHeader>
          <CardTitle className="text-slate-900">Create a new offer</CardTitle>
          <CardDescription className="text-slate-700">
            Give enough detail so neighbors instantly know what you’re providing.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <Label htmlFor="title" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Title
              </Label>
              <Input
                id="title"
                name="title"
                required
                value={form.title}
                onChange={handleChange}
                placeholder="Hot meals tonight"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="description" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Description
              </Label>
              <Textarea
                id="description"
                name="description"
                rows={5}
                required
                value={form.description}
                onChange={handleChange}
                placeholder="Serving 30 plates with vegan options..."
              />
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor="capacity" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Capacity
                </Label>
                <Input
                  id="capacity"
                  name="capacity"
                  type="number"
                  min="1"
                  value={form.capacity}
                  onChange={handleChange}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="lat" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Latitude
                </Label>
                <Input
                  id="lat"
                  name="lat"
                  type="number"
                  step="0.0001"
                  value={form.lat}
                  onChange={handleChange}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="lng" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Longitude
                </Label>
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
            <div className="flex flex-col gap-2">
              <Label htmlFor="image" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Image (optional)
              </Label>
              <input
                id="image"
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                ref={fileInputRef}
                onChange={handleImageChange}
                className="rounded-md border border-dashed border-border px-3 py-2 text-sm file:mr-4 file:rounded-md file:border-0 file:bg-muted file:px-4 file:py-2 file:text-sm file:font-medium"
              />
              {imageError && <p className="text-sm text-destructive">{imageError}</p>}
              {imageData && (
                <div className="space-y-3 rounded-lg border p-3">
                  <img
                    src={imageData}
                    alt="Offer preview"
                    className="h-48 w-full rounded-md object-cover"
                    onError={() => {
                      clearImage();
                      setImageError('Could not preview this file type.');
                    }}
                  />
                  <Button type="button" variant="outline" size="sm" onClick={clearImage}>
                    Remove image
                  </Button>
                </div>
              )}
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
              <Button type="button" className="bg-blue-600 text-white hover:bg-blue-500" onClick={useMyLocation}>
                Use my location
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Saving…' : 'Create offer'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
