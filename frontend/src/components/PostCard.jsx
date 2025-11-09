import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import JoinButton from './JoinButton.jsx';

export default function PostCard({ post, onJoin, userId }) {
  const openSpots = post.capacity - post.members.length;
  const isMember = post.members.includes(userId);
  const pct = Math.min(100, Math.round((post.members.length / post.capacity) * 100));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{post.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{post.description}</p>
        <div className="mt-4">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>
              {post.members.length} / {post.capacity} members
            </span>
            <span>{openSpots > 0 ? `${openSpots} spots left` : 'Full'}</span>
          </div>
          <Progress value={pct} className="mt-1" />
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button asChild variant="secondary">
          <Link to={`/posts/${post.id}`}>Details</Link>
        </Button>
        <JoinButton
          onJoin={() => onJoin(post.id)}
          disabled={openSpots <= 0 || isMember}
          label={isMember ? 'Joined' : 'Join group'}
        />
      </CardFooter>
    </Card>
  );
}
