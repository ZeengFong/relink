import { useEffect, useState } from 'react';

export default function Profile({ user, api }) {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    api('/posts').then(({ posts }) => setPosts(posts.filter((post) => post.creator_id === user.id)));
  }, [api, user.id]);

  return (
    <section className="page-section" style={{ maxWidth: '720px', margin: '0 auto' }}>
      <div className="hero">
        <strong>Profile</strong>
        <h2>{user.name}</h2>
        <p>{user.email}</p>
      </div>
      <h3>Your offers</h3>
      <ul className="news-list">
        {posts.map((post) => (
          <li key={post.id} className="news-item">
            <strong>{post.title}</strong>
            <p>{post.description}</p>
          </li>
        ))}
        {!posts.length && <li className="empty-state">No offers yet.</li>}
      </ul>
    </section>
  );
}
