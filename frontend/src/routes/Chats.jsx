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
    <section className="grid" style={{ gap: '1rem' }}>
      <div>
        <h2>Group chats</h2>
        <ul>
          {posts.map((post) => (
            <li key={post.id}>
              <button type="button" onClick={() => setActive(post)} aria-pressed={active?.id === post.id}>
                {post.title}
              </button>
            </li>
          ))}
          {!posts.length && <p>Join an offer to access its group chat.</p>}
        </ul>
      </div>
      {active && <ChatWindow chatId={active.chat_id} api={api} />}
    </section>
  );
}
