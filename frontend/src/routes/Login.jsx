import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function Login({ api, setUser }) {
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
      .catch((err) => console.error(err));
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto grid min-h-screen max-w-6xl grid-cols-1 lg:grid-cols-2">
        <div className="hidden p-12 text-white lg:flex lg:flex-col lg:justify-between lg:bg-gradient-to-b lg:from-blue-700 lg:to-slate-900">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-blue-200">reLink</p>
            <h1 className="mt-6 text-4xl font-bold leading-tight">
              Sign back in and keep coordinating relief faster.
            </h1>
            <p className="mt-4 max-w-md text-blue-100">
              Your feed, chats, and live hazard map pick up right where you left off.
              Every login stays secured with bcrypt and locked sessions.
            </p>
          </div>
          <div className="space-y-2 text-blue-100">
            <p className="text-sm">Need an account?</p>
            <Link to="/register" className="text-base font-semibold text-white underline">
              Create one in seconds →
            </Link>
          </div>
        </div>
        <div className="flex items-center justify-center px-6 py-12 sm:px-10 lg:px-16">
          <Card className="w-full max-w-xl shadow-lg">
            <CardHeader className="space-y-3">
              <CardTitle className="text-3xl text-slate-900">Welcome back</CardTitle>
              <CardDescription className="text-slate-600">
                Enter your credentials to access live offers, chats, and alerts.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="email" className="text-sm font-medium text-slate-700">
                    Email
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="you@rel.ink"
                    required
                    value={form.email}
                    onChange={handleChange}
                    className="h-12 text-base"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="password" className="text-sm font-medium text-slate-700">
                    Password
                  </Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={form.password}
                    onChange={handleChange}
                    className="h-12 text-base"
                  />
                </div>
                <Button type="submit" className="h-12 text-base font-semibold">
                  Sign in
                </Button>
              </form>
            </CardContent>
            <CardFooter className="flex flex-col gap-2">
              <p className="text-sm text-slate-600">
                Don't have an account?{' '}
                <Link to="/register" className="font-medium text-blue-600 underline">
                  Sign up
                </Link>
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
