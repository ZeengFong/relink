import { useCallback, useEffect, useState } from 'react';
import ChatWindow from '../components/ChatWindow.jsx';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function Chats({ api, user }) {
  const [posts, setPosts] = useState([]);
  const [active, setActive] = useState(null);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const loadMembership = useCallback(() => {
    api('/posts')
      .then(({ posts: list }) => {
        const mine = list.filter((post) => post.members.includes(user.id));
        setPosts(mine);
        setActive((prev) => {
          if (!mine.length) {
            return null;
          }
          if (prev) {
            const stillHere = mine.find((post) => post.id === prev.id);
            if (stillHere) {
              return stillHere;
            }
          }
          return mine[0];
        });
      })
      .catch((err) => console.error(err));
  }, [api, user.id]);

  useEffect(() => {
    loadMembership();
  }, [loadMembership]);

  const leaveGroup = () => {
    if (!active) return;
    setLeaving(true);
    api(`/posts/${active.id}/leave`, { method: 'POST' })
      .then(() => loadMembership())
      .catch((err) => console.error(err))
      .finally(() => {
        setLeaving(false);
        setConfirmLeave(false);
      });
  };

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3 h-[calc(100vh-120px)]">
      {confirmLeave && active && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-sm rounded-lg bg-background p-6 shadow-xl">
            <h3 className="text-lg font-semibold">Leave {active.title}?</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Are you sure you want to leave this group?
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setConfirmLeave(false)} disabled={leaving}>
                No
              </Button>
              <Button variant="destructive" onClick={leaveGroup} disabled={leaving}>
                {leaving ? 'Leaving…' : 'Yes'}
              </Button>
            </div>
          </div>
        </div>
      )}
      <div className="md:col-span-1 flex flex-col gap-4">
        <Card>
          <div className="p-4">
            <h2 className="text-2xl font-bold">Group chats</h2>
            <p className="text-muted-foreground">
              Every offer spawns a socket room. Tap to switch.
            </p>
          </div>
        </Card>
        <Card className="flex-1">
          <div className="p-4">
            <ul className="space-y-2">
              {posts.map((post) => (
                <li key={post.id}>
                  <Button
                    variant={active?.id === post.id ? 'default' : 'outline'}
                    className="w-full justify-start"
                    onClick={() => setActive(post)}
                  >
                    {post.title}
                  </Button>
                </li>
              ))}
            </ul>
            {!posts.length && (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">
                  Join an offer to access its group chat.
                </p>
              </div>
            )}
          </div>
        </Card>
      </div>
      <div className="md:col-span-2">
        <Card className="flex h-full flex-col">
          {active ? (
            <>
              <div className="flex items-center justify-between border-b px-4 py-3">
                <div>
                  <h3 className="text-lg font-semibold">{active.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {Math.max(0, active.members.length - 1)} / {active.capacity} slots filled
                  </p>
                </div>
                <Button variant="destructive" size="sm" onClick={() => setConfirmLeave(true)}>
                  Leave group
                </Button>
              </div>
              <div className="flex-1 overflow-hidden">
                <ChatWindow chatId={active.chat_id} api={api} user={user} />
              </div>
            </>
          ) : (
            <div className="flex h-full items-center justify-center">
              <p className="text-muted-foreground">Select a chat.</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
