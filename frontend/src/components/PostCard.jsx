import { Link } from 'react-router-dom';
import JoinButton from './JoinButton.jsx';

export default function PostCard({ post, onJoin }) {
  const openSpots = post.capacity - post.members.length;
  return (
    <article>
      <header>
        <h3>{post.title}</h3>
        <p>Capacity: {post.members.length}/{post.capacity}</p>
      </header>
      <p>{post.description}</p>
      <footer style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
        <Link to={`/posts/${post.id}`} aria-label={`View details for ${post.title}`}>
          View details
        </Link>
        <JoinButton onJoin={() => onJoin(post.id)} disabled={openSpots <= 0} />
      </footer>
    </article>
  );
}
