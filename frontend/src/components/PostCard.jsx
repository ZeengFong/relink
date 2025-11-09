import { Link } from 'react-router-dom';
import JoinButton from './JoinButton.jsx';

export default function PostCard({ post, onJoin, userId }) {
  const openSpots = post.capacity - post.members.length;
  const isMember = post.members.includes(userId);
  const pct = Math.min(100, Math.round((post.members.length / post.capacity) * 100));
  const lat =
    typeof post.location?.lat === 'number'
      ? post.location.lat.toFixed(3)
      : post.location?.lat ?? '—';
  const lng =
    typeof post.location?.lng === 'number'
      ? post.location.lng.toFixed(3)
      : post.location?.lng ?? '—';

  return (
    <article className="card" aria-live="polite">
      <header>
        <div>
          <p className={`capacity-pill ${openSpots <= 0 ? 'full' : ''}`}>
            {openSpots > 0 ? `${openSpots} spot${openSpots > 1 ? 's' : ''}` : 'Full'}
          </p>
          <h3>{post.title}</h3>
        </div>
        <span className={`capacity-pill ${openSpots <= 0 ? 'full' : ''}`}>
          {post.members.length}/{post.capacity}
        </span>
      </header>
      <p>{post.description}</p>
      <small>
        Lat {lat}, Lng {lng}
      </small>
      <div style={{ margin: '0.9rem 0', background: 'rgba(15,118,110,0.1)', borderRadius: '999px', height: '8px' }}>
        <div
          style={{
            width: `${pct}%`,
            height: '100%',
            borderRadius: '999px',
            background: 'linear-gradient(90deg, #0f766e, #14b8a6)',
            transition: 'width 0.3s ease',
          }}
        />
      </div>
      <footer style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
        <Link to={`/posts/${post.id}`} aria-label={`View details for ${post.title}`} className="secondary">
          Details
        </Link>
        <JoinButton
          onJoin={() => onJoin(post.id)}
          disabled={openSpots <= 0 || isMember}
          label={isMember ? 'Joined' : 'Join group'}
        />
      </footer>
    </article>
  );
}
