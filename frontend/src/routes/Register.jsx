import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function Register({ api, setUser }) {
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
      .catch((err) => console.error(err));
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto grid min-h-screen max-w-6xl grid-cols-1 lg:grid-cols-2">
        <div className="hidden lg:flex lg:flex-col lg:justify-between bg-gradient-to-b from-slate-900 to-blue-700 p-12 text-white">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-blue-200">Join reLink</p>
            <h1 className="mt-6 text-4xl font-bold leading-tight">
              Create an account and start coordinating help immediately.
            </h1>
            <p className="mt-4 max-w-md text-blue-100">
              Publish offers, join chats, drop hazard reports, and get live NASA alerts—all in one workspace built for rapid disaster response.
            </p>
          </div>
          <div className="space-y-2 text-blue-100">
            <p className="text-sm">Already have an account?</p>
            <Link to="/login" className="text-base font-semibold text-white underline">
              Sign in instead →
            </Link>
          </div>
        </div>
        <div className="flex items-center justify-center px-6 py-12 sm:px-10 lg:px-16">
          <Card className="w-full max-w-xl shadow-lg">
            <CardHeader className="space-y-3">
              <CardTitle className="text-3xl text-slate-900">Create your profile</CardTitle>
              <CardDescription className="text-slate-600">
                We just need a few details to put you on the map.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="name" className="text-sm font-medium text-slate-700">
                    Name
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="Your Name"
                    required
                    value={form.name}
                    onChange={handleChange}
                    className="h-12 text-base"
                  />
                </div>
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
                  Create account
                </Button>
              </form>
            </CardContent>
            <CardFooter className="flex flex-col gap-2">
              <p className="text-sm text-slate-600">
                Already registered?{' '}
                <Link to="/login" className="font-medium text-blue-600 underline">
                  Sign in
                </Link>
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
