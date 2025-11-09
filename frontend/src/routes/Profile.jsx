import { useEffect, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ConfirmDialog from '@/components/ConfirmDialog.jsx';
import { getUserAvatarUrl, getUserDisplayName, getUserInitials } from '@/lib/user';

export default function Profile({ user, api }) {
  const [posts, setPosts] = useState([]);
  const displayName = getUserDisplayName(user);
  const avatarUrl = getUserAvatarUrl(user);
  const initials = getUserInitials(user);

  const [confirmingId, setConfirmingId] = useState(null);
  const [removing, setRemoving] = useState(false);

  useEffect(() => {
    api('/posts').then(({ posts }) => setPosts(posts.filter((post) => post.creator_id === user.id)));
  }, [api, user.id]);

  const queueTakeDown = (postId) => {
    setConfirmingId(postId);
  };

  const cancelTakeDown = () => {
    if (!removing) {
      setConfirmingId(null);
    }
  };

  const confirmTakeDown = () => {
    if (!confirmingId) return;
    setRemoving(true);
    api(`/posts/${confirmingId}`, { method: 'DELETE' })
      .then(() => {
        setPosts((prev) => prev.filter((post) => post.id !== confirmingId));
      })
      .catch((err) => console.error(err))
      .finally(() => {
        setRemoving(false);
        setConfirmingId(null);
      });
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Avatar className="h-24 w-24">
          <AvatarImage src={avatarUrl} alt={displayName} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{displayName}</h1>
          <p className="text-slate-700">{user.email}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-slate-900">Your offers</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-4">
            {posts.map((post) => (
              <li key={post.id} className="flex flex-col gap-4 rounded-lg border p-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="font-semibold text-slate-900">{post.title}</h3>
                  <p className="text-sm text-slate-700">{post.description}</p>
                </div>
                <Button variant="destructive" onClick={() => queueTakeDown(post.id)}>
                  Take down
                </Button>
              </li>
            ))}
          </ul>
          {!posts.length && (
            <div className="flex items-center justify-center h-48 border-2 border-dashed rounded-lg">
              <p className="text-slate-600">No offers yet.</p>
            </div>
          )}
        </CardContent>
      </Card>
      <ConfirmDialog
        open={Boolean(confirmingId)}
        title="Take down this offer?"
        message="Members will lose access to the listing and chat."
        confirmLabel="Take down"
        onConfirm={confirmTakeDown}
        onCancel={cancelTakeDown}
        loading={removing}
      />
    </div>
  );
}
