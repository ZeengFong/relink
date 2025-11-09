import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import PostCard from '../components/PostCard.jsx';

export default function Feed({ api, user, showToast }) {
  const [posts, setPosts] = useState([]);
  const [news, setNews] = useState([]);
  const [coords, setCoords] = useState({ lat: 51.05, lng: -114.07 });
  const [draftCoords, setDraftCoords] = useState({ lat: 51.05, lng: -114.07 });

  const stats = useMemo(() => {
    const open = Math.max(0, posts.reduce((acc, post) => acc + (post.capacity - post.members.length), 0));
    return {
      total: posts.length,
      open,
      active: posts.filter((post) => post.members.includes(user.id)).length,
    };
  }, [posts, user.id]);

  const loadPosts = () => {
    api('/posts')
      .then(({ posts: list }) => setPosts(list))
      .catch((err) => showToast(err.message));
  };

  const loadNews = () => {
    api(`/news?lat=${coords.lat}&lng=${coords.lng}`)
      .then(({ items }) => setNews(items))
      .catch(() => setNews([]));
  };

  useEffect(() => {
    loadPosts();
  }, [api, showToast]);

  useEffect(() => {
    loadNews();
  }, [api, coords.lat, coords.lng]);

  useEffect(() => {
    setDraftCoords(coords);
  }, [coords.lat, coords.lng]);

  const join = (postId) => {
    api(`/posts/${postId}/join`, { method: 'POST' })
      .then((updated) => {
        setPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
        showToast('Joined offer!');
      })
      .catch((err) => showToast(err.message));
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      showToast('Location not supported in this browser');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setDraftCoords({ lat: latitude.toFixed(4), lng: longitude.toFixed(4) });
        setCoords({ lat: latitude, lng: longitude });
        showToast('Using your current location');
      },
      () => showToast('Unable to fetch location. Please allow access.'),
    );
  };

  return (
    <div className="page-section">
      <div className="hero">
        <strong>Welcome back</strong>
        <h2>{user.name}, let’s link neighbors faster</h2>
        <p>Browse nearby offers, open new ones, and stay ahead of hazards.</p>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '1rem' }}>
          <Link to="/posts/new" className="secondary" style={{ textDecoration: 'none' }}>
            Create new offer
          </Link>
          <Link to="/map" className="secondary" style={{ textDecoration: 'none' }}>
            View hazard map
          </Link>
        </div>
      </div>

      <section className="card-grid" style={{ marginBottom: '2rem' }}>
        <article className="card">
          <h4>Live offers</h4>
          <p style={{ fontSize: '2rem', margin: 0 }}>{stats.total}</p>
          <small>Opportunities to help right now.</small>
        </article>
        <article className="card">
          <h4>Open slots</h4>
          <p style={{ fontSize: '2rem', margin: 0 }}>{stats.open}</p>
          <small>Remaining capacity across the network.</small>
        </article>
        <article className="card">
          <h4>Your groups</h4>
          <p style={{ fontSize: '2rem', margin: 0 }}>{stats.active}</p>
          <small>Offers you’ve already joined.</small>
        </article>
      </section>

      <div className="grid" style={{ gap: '2rem', alignItems: 'start' }}>
        <section>
          <h3>Offers nearby</h3>
          <div className="card-grid">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} onJoin={join} userId={user.id} />
            ))}
            {!posts.length && <p className="empty-state">No offers yet. Be the first!</p>}
          </div>
        </section>
        <aside className="card" style={{ position: 'sticky', top: '6rem' }}>
          <h3>Local weather news</h3>
          <form
            onSubmit={(evt) => {
              evt.preventDefault();
              setCoords({ lat: Number(draftCoords.lat), lng: Number(draftCoords.lng) });
            }}
            style={{ display: 'grid', gap: '0.7rem', marginTop: '1rem' }}
          >
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <label style={{ flex: 1 }}>
                <span className="visually-hidden">Latitude</span>
                <input
                  name="lat"
                  type="number"
                  step="0.01"
                  value={draftCoords.lat}
                  onChange={(e) => setDraftCoords((prev) => ({ ...prev, lat: e.target.value }))}
                  placeholder="Latitude"
                  required
                />
              </label>
              <label style={{ flex: 1 }}>
                <span className="visually-hidden">Longitude</span>
                <input
                  name="lng"
                  type="number"
                  step="0.01"
                  value={draftCoords.lng}
                  onChange={(e) => setDraftCoords((prev) => ({ ...prev, lng: e.target.value }))}
                  placeholder="Longitude"
                  required
                />
              </label>
            </div>
            <button type="submit">Refresh headlines</button>
            <button type="button" className="secondary" onClick={useMyLocation}>
              Use my location
            </button>
          </form>
          <ul className="news-list">
            {news.map((item) => {
              const summary = item.summary ? item.summary.replace(/<[^>]+>/g, '') : '';
              return (
                <li key={item.link || item.title} className="news-item">
                  <a href={item.link} target="_blank" rel="noreferrer">
                    {item.title}
                  </a>
                  <p>{summary}</p>
                  <small>{item.published}</small>
                </li>
              );
            })}
            {!news.length && <li className="empty-state">No headlines for this location.</li>}
          </ul>
        </aside>
      </div>
    </div>
  );
}
