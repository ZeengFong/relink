import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

export default function PostDetail({ api, user, showToast }) {
  const { id } = useParams();
  const [post, setPost] = useState(null);

  useEffect(() => {
    api('/posts')
      .then(({ posts }) => posts.find((p) => p.id === id))
      .then((match) => setPost(match || null));
  }, [api, id]);

  if (!post) {
    return <p className="page-section">Loading post…</p>;
  }

  const isMember = post.members.includes(user.id);

  const join = () => {
    api(`/posts/${post.id}/join`, { method: 'POST' })
      .then((updated) => {
        setPost(updated);
        showToast('Joined offer');
      })
      .catch((err) => showToast(err.message));
  };

  return (
    <article className="page-section" style={{ maxWidth: '760px', margin: '0 auto' }}>
      <header className="hero">
        <strong>Offer detail</strong>
        <h2>{post.title}</h2>
        <p>
          {post.members.length}/{post.capacity} attending · Lat {post.location.lat}, Lng {post.location.lng}
        </p>
      </header>
      <p>{post.description}</p>
      <section style={{ margin: '1.5rem 0' }}>
        <h4>Members</h4>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {post.members.map((member) => (
            <span key={member} className="capacity-pill">
              {member}
            </span>
          ))}
        </div>
      </section>
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        {isMember ? (
          <Link to="/chats" className="secondary" style={{ textDecoration: 'none' }}>
            Open chat
          </Link>
        ) : (
          <button type="button" onClick={join}>
            Join offer
          </button>
        )}
        <Link to="/" className="secondary" style={{ textDecoration: 'none' }}>
          Back to feed
        </Link>
      </div>
    </article>
  );
}
