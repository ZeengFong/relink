import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import JoinButton from './JoinButton.jsx';

export default function PostCard({ post, onJoin, userId }) {
  const [hideImage, setHideImage] = useState(false);
  const filledSlots = Math.max(0, post.members.length - 1);
  const openSpots = Math.max(0, post.capacity - filledSlots);
  const isMember = post.members.includes(userId);
  const pct = post.capacity
    ? Math.min(100, Math.round((filledSlots / post.capacity) * 100))
    : 0;
  const showImage = Boolean(post.image) && !hideImage;

  return (
    <Card className="overflow-hidden">
      {showImage && (
        <div className="relative h-40 w-full">
          <img
            src={post.image}
            alt={`Preview of ${post.title}`}
            className="h-full w-full object-cover"
            loading="lazy"
            onError={() => setHideImage(true)}
          />
        </div>
      )}
      <CardHeader className="space-y-1.5">
        <CardTitle className="text-slate-900">{post.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-slate-700">{post.description}</p>
        <div className="mt-4">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>
              {filledSlots} / {post.capacity} slots filled
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
