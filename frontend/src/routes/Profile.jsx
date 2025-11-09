import { useEffect, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getUserAvatarUrl, getUserDisplayName, getUserInitials } from '@/lib/user';

export default function Profile({ user, api }) {
  const [posts, setPosts] = useState([]);
  const displayName = getUserDisplayName(user);
  const avatarUrl = getUserAvatarUrl(user);
  const initials = getUserInitials(user);

  useEffect(() => {
    api('/posts').then(({ posts }) => setPosts(posts.filter((post) => post.creator_id === user.id)));
  }, [api, user.id]);

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Avatar className="h-24 w-24">
          <AvatarImage src={avatarUrl} alt={displayName} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-3xl font-bold">{displayName}</h1>
          <p className="text-muted-foreground">{user.email}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your offers</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-4">
            {posts.map((post) => (
              <li key={post.id} className="p-4 border rounded-lg">
                <h3 className="font-semibold">{post.title}</h3>
                <p className="text-sm text-muted-foreground">{post.description}</p>
              </li>
            ))}
          </ul>
          {!posts.length && (
            <div className="flex items-center justify-center h-48 border-2 border-dashed rounded-lg">
              <p className="text-muted-foreground">No offers yet.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
