import { useEffect, useState } from 'react';
import ChatWindow from '../components/ChatWindow.jsx';

export default function Chats({ api, user, showToast }) {
  const [posts, setPosts] = useState([]);
  const [active, setActive] = useState(null);

  useEffect(() => {
    api('/posts')
      .then(({ posts: list }) => {
        const mine = list.filter((post) => post.members.includes(user.id));
        setPosts(mine);
        setActive(mine[0] || null);
      })
      .catch((err) => showToast(err.message));
  }, [api, showToast, user.id]);

  return (
    <section className="page-section" style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
      <div>
        <div className="hero" style={{ marginBottom: '1rem' }}>
          <strong>Group chats</strong>
          <h2>Coordinate fast</h2>
          <p>Every offer spawns a socket room. Tap to switch.</p>
        </div>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {posts.map((post) => (
            <li key={post.id}>
              <button
                type="button"
                onClick={() => setActive(post)}
                aria-pressed={active?.id === post.id}
                className={active?.id === post.id ? '' : 'secondary'}
                style={{ width: '100%' }}
              >
                {post.title}
              </button>
            </li>
          ))}
        </ul>
        {!posts.length && <p className="empty-state" style={{ marginTop: '1rem' }}>Join an offer to access its group chat.</p>}
      </div>
      {active ? <ChatWindow chatId={active.chat_id} api={api} user={user} /> : <div className="empty-state">Select a chat.</div>}
    </section>
  );
}
