export default function JoinButton({ onJoin, disabled, label = 'Join' }) {
  return (
    <button type="button" onClick={onJoin} disabled={disabled} aria-label="Join offer">
      {disabled ? 'Unavailable' : label}
    </button>
  );
}
