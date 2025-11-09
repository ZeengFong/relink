import { Button } from '@/components/ui/button';

export default function JoinButton({ onJoin, disabled, label = 'Join' }) {
  return (
    <Button onClick={onJoin} disabled={disabled}>
      {label}
    </Button>
  );
}
