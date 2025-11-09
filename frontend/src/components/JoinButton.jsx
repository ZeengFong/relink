export default function JoinButton({ onJoin, disabled }) {
  return (
    <button type="button" onClick={onJoin} disabled={disabled} aria-label="Join offer">
      {disabled ? 'Full' : 'Join'}
    </button>
  );
}
