import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function PostDetail({ api, user }) {
  const { id } = useParams();
  const [post, setPost] = useState(null);

  useEffect(() => {
    api(`/posts/${id}`)
      .then((post) => setPost(post))
      .catch((err) => console.error(err));
  }, [api, id]);

  if (!post) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  const isMember = post.members.includes(user.id);

  const join = () => {
    api(`/posts/${post.id}/join`, { method: 'POST' })
      .then((updated) => {
        setPost(updated);
      })
      .catch((err) => console.error(err));
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{post.title}</CardTitle>
        <CardDescription>
          {post.members.length}/{post.capacity} attending · Lat {post.location.lat}, Lng {post.location.lng}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{post.description}</p>
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
      <CardFooter className="flex justify-between">
        <Button asChild variant="secondary">
          <Link to="/">Back to feed</Link>
        </Button>
        {isMember ? (
          <Button asChild>
            <Link to="/chats">Open chat</Link>
          </Button>
        ) : (
          <Button onClick={join}>Join offer</Button>
        )}
      </CardFooter>
    </Card>
  );
}
