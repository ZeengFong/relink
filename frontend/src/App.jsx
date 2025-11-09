import { useCallback, useEffect, useState } from 'react';
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import Login from './routes/Login.jsx';
import Register from './routes/Register.jsx';
import Feed from './routes/Feed.jsx';
import PostCreate from './routes/PostCreate.jsx';
import PostDetail from './routes/PostDetail.jsx';
import Chats from './routes/Chats.jsx';
import MapView from './routes/MapView.jsx';
import Profile from './routes/Profile.jsx';

const api = async (path, options = {}) => {
  const resp = await fetch(`/api${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    throw new Error(data.error || 'Request failed');
  }
  return data;
};

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    api('/me')
      .then(({ user: me }) => setUser(me))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const showToast = useCallback((message) => {
    setToast(message);
    setTimeout(() => setToast(''), 4000);
  }, []);

  const handleLogout = () => {
    api('/auth/logout', { method: 'POST' })
      .then(() => {
        setUser(null);
        navigate('/login');
      })
      .catch((err) => showToast(err.message));
  };

  if (loading) {
    return <main aria-busy="true">Loading reLink…</main>;
  }

  return (
    <>
      <Navbar user={user} onLogout={handleLogout} />
      <main>
        {toast && <p role="alert" className="toast">{toast}</p>}
        <Routes>
          <Route path="/" element={user ? <Feed api={api} user={user} showToast={showToast} /> : <Navigate to="/login" />} />
          <Route path="/login" element={<Login api={api} setUser={setUser} showToast={showToast} />} />
          <Route path="/register" element={<Register api={api} setUser={setUser} showToast={showToast} />} />
          <Route path="/posts/new" element={user ? <PostCreate api={api} showToast={showToast} /> : <Navigate to="/login" />} />
          <Route path="/posts/:id" element={user ? <PostDetail api={api} user={user} showToast={showToast} /> : <Navigate to="/login" />} />
          <Route path="/chats" element={user ? <Chats api={api} user={user} showToast={showToast} /> : <Navigate to="/login" />} />
          <Route path="/map" element={user ? <MapView api={api} showToast={showToast} /> : <Navigate to="/login" />} />
          <Route path="/profile" element={user ? <Profile user={user} api={api} /> : <Navigate to="/login" />} />
        </Routes>
      </main>
    </>
  );
}
