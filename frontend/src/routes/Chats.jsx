import { useEffect, useState } from 'react';
import ChatWindow from '../components/ChatWindow.jsx';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function Chats({ api, user }) {
  const [posts, setPosts] = useState([]);
  const [active, setActive] = useState(null);

  useEffect(() => {
    api('/posts')
      .then(({ posts: list }) => {
        const mine = list.filter((post) => post.members.includes(user.id));
        setPosts(mine);
        setActive(mine[0] || null);
      })
      .catch((err) => console.error(err));
  }, [api, user.id]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[calc(100vh-120px)]">
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
        <Card className="h-full">
          {active ? (
            <ChatWindow chatId={active.chat_id} api={api} user={user} />
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">Select a chat.</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
