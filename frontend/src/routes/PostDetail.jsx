import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import ConfirmDialog from '@/components/ConfirmDialog.jsx';

export default function PostDetail({ api, user }) {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const navigate = useNavigate();
  const [heroFailed, setHeroFailed] = useState(false);
  const [dialog, setDialog] = useState(null);
  const [dialogLoading, setDialogLoading] = useState(false);

  useEffect(() => {
    api(`/posts/${id}`)
      .then((post) => setPost(post))
      .catch((err) => console.error(err));
  }, [api, id]);

  useEffect(() => {
    setHeroFailed(false);
  }, [post?.image]);

  if (!post) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  const isMember = post.members.includes(user.id);
  const isOwner = post.creator_id === user.id;
  const filledSlots = Math.max(0, post.members.length - 1);

  const join = () => {
    api(`/posts/${post.id}/join`, { method: 'POST' })
      .then((updated) => {
        setPost(updated);
      })
      .catch((err) => console.error(err));
  };

  const closeDialog = () => {
    if (!dialogLoading) {
      setDialog(null);
    }
  };

  const confirmLeave = () => {
    setDialog('leave');
  };

  const confirmDelete = () => {
    setDialog('delete');
  };

  const leave = () => {
    setDialogLoading(true);
    api(`/posts/${post.id}/leave`, { method: 'POST' })
      .then((updated) => setPost(updated))
      .catch((err) => console.error(err))
      .finally(() => {
        setDialogLoading(false);
        setDialog(null);
      });
  };

  const takeDown = () => {
    setDialogLoading(true);
    api(`/posts/${post.id}`, { method: 'DELETE' })
      .then(() => navigate('/'))
      .catch((err) => console.error(err))
      .finally(() => {
        setDialogLoading(false);
        setDialog(null);
      });
  };

  return (
    <Card className="w-full max-w-2xl mx-auto overflow-hidden">
      {post.image && !heroFailed && (
        <div className="relative h-64 w-full">
          <img
            src={post.image}
            alt={`Preview of ${post.title}`}
            className="h-full w-full object-cover"
            onError={() => setHeroFailed(true)}
          />
        </div>
      )}
      <CardHeader>
        <CardTitle className="text-slate-900">{post.title}</CardTitle>
        <CardDescription className="text-slate-700">
          Slots filled: {filledSlots}/{post.capacity} · Lat {post.location.lat}, Lng {post.location.lng}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-slate-700">{post.description}</p>
        <div className="mt-6">
          <h3 className="text-lg font-medium">Members</h3>
          <div className="flex flex-wrap gap-4 mt-4">
            {post.members.map((member) => (
              <Avatar key={member}>
                <AvatarImage src={`https://avatar.vercel.sh/${member}.png`} />
                <AvatarFallback>{member.charAt(0)}</AvatarFallback>
              </Avatar>
            ))}
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-wrap items-center justify-between gap-3">
        <Button asChild variant="secondary">
          <Link to="/">Back to feed</Link>
        </Button>
        <div className="flex flex-wrap gap-3">
          {isOwner ? (
            <>
              <Button asChild>
                <Link to="/chats">Open chat</Link>
              </Button>
              <Button variant="destructive" onClick={confirmDelete}>
                Take down offer
              </Button>
            </>
          ) : isMember ? (
            <>
              <Button asChild>
                <Link to="/chats">Open chat</Link>
              </Button>
              <Button variant="outline" onClick={confirmLeave}>
                Leave group
              </Button>
            </>
          ) : (
            <Button onClick={join}>Join offer</Button>
          )}
        </div>
      </CardFooter>
      <ConfirmDialog
        open={dialog === 'leave'}
        title="Leave this group?"
        message="Are you sure you want to leave this group? You can rejoin if there’s space."
        confirmLabel="Yes, leave"
        onConfirm={leave}
        onCancel={closeDialog}
        loading={dialogLoading}
      />
      <ConfirmDialog
        open={dialog === 'delete'}
        title="Take down this offer?"
        message="Members will lose access to this listing and its chat."
        confirmLabel="Take down"
        onConfirm={takeDown}
        onCancel={closeDialog}
        loading={dialogLoading}
      />
    </Card>
  );
}
