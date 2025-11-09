import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PostCard from '../components/PostCard.jsx';

export default function Feed({ api, user, showToast }) {
  const [posts, setPosts] = useState([]);
  const [news, setNews] = useState([]);
  const [coords, setCoords] = useState({ lat: 51.05, lng: -114.07 });
  const [draftCoords, setDraftCoords] = useState({ lat: 51.05, lng: -114.07 });

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

  return (
    <section>
      <header style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2>Hi {user.name}</h2>
          <p>Support nearby relief offers or create one.</p>
        </div>
        <div>
          <Link to="/posts/new">Create offer</Link>
        </div>
      </header>

      <div className="grid" style={{ gap: '2rem', alignItems: 'start' }}>
        <div>
          <h3>Offers</h3>
          <div className="card-grid">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} onJoin={join} />
            ))}
            {!posts.length && <p>No offers yet. Be the first!</p>}
          </div>
        </div>
        <aside>
          <h3>Local news</h3>
          <form
            onSubmit={(evt) => {
              evt.preventDefault();
              setCoords({ lat: Number(draftCoords.lat), lng: Number(draftCoords.lng) });
            }}
            style={{ display: 'grid', gap: '0.5rem' }}
          >
            <label htmlFor="lat">Lat</label>
            <input
              id="lat"
              name="lat"
              type="number"
              step="0.01"
              value={draftCoords.lat}
              onChange={(e) => setDraftCoords((prev) => ({ ...prev, lat: e.target.value }))}
              required
            />
            <label htmlFor="lng">Lng</label>
            <input
              id="lng"
              name="lng"
              type="number"
              step="0.01"
              value={draftCoords.lng}
              onChange={(e) => setDraftCoords((prev) => ({ ...prev, lng: e.target.value }))}
              required
            />
            <button type="submit">Update feed</button>
          </form>
          <ul className="news-list">
            {news.map((item) => (
              <li key={item.link}>
                <a href={item.link} target="_blank" rel="noreferrer">
                  {item.title}
                </a>
                <p>{item.summary}</p>
              </li>
            ))}
            {!news.length && <li>No headlines for this location.</li>}
          </ul>
        </aside>
      </div>
    </section>
  );
}
