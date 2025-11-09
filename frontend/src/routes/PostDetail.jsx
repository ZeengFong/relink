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
    return <p>Loading post…</p>;
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
    <article>
      <header>
        <h2>{post.title}</h2>
        <p>
          {post.members.length}/{post.capacity} attending
        </p>
      </header>
      <p>{post.description}</p>
      <p>
        Location: {post.location.lat}, {post.location.lng}
      </p>
      <p>Members: {post.members.join(', ')}</p>
      <div>
        {isMember ? (
          <Link to="/chats">Open chat</Link>
        ) : (
          <button type="button" onClick={join}>
            Join offer
          </button>
        )}
      </div>
    </article>
  );
}
