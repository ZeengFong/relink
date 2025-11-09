import { useEffect, useState } from 'react';

export default function Profile({ user, api }) {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    api('/posts').then(({ posts }) => setPosts(posts.filter((post) => post.creator_id === user.id)));
  }, [api, user.id]);

  return (
    <section>
      <h2>{user.name}</h2>
      <p>{user.email}</p>
      <h3>Your offers</h3>
      <ul>
        {posts.map((post) => (
          <li key={post.id}>{post.title}</li>
        ))}
        {!posts.length && <li>No offers yet.</li>}
      </ul>
    </section>
  );
}
