import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PostCard from '../components/PostCard.jsx';
import { Button } from '@/components/ui/button';

export default function Feed({ api, user }) {
  const [posts, setPosts] = useState([]);

  const loadPosts = () => {
    api('/posts')
      .then(({ posts: list }) => setPosts(list))
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    loadPosts();
  }, [api]);

  const join = (postId) => {
    api(`/posts/${postId}/join`, { method: 'POST' })
      .then((updated) => {
        setPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      })
      .catch((err) => console.error(err));
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col items-center gap-6 text-center">
        <div className="space-y-3">
          <h1 className="text-3xl font-bold text-slate-900">Welcome back, {user.name}</h1>
          <p className="max-w-2xl text-base text-slate-700">
            Browse nearby offers, open new ones, and stay ahead of hazards.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          <Button asChild>
            <Link to="/posts/new">Create new offer</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link to="/map">View hazard map</Link>
          </Button>
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-slate-900">Offers nearby</h2>
        <div className="grid gap-4 mt-4 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} onJoin={join} userId={user.id} />
          ))}
        </div>
        {!posts.length && (
          <div className="flex items-center justify-center h-64 border-2 border-dashed rounded-lg">
            <p className="text-slate-600">No offers yet. Be the first!</p>
          </div>
        )}
      </div>
    </div>
  );
}
