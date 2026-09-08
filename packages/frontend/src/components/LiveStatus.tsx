import { useEffect, useState } from 'react';
import { formatAgo, secondsAgo } from '@/lib/trainInfo';

interface LiveStatusProps {
  /** Epoch ms of the last successful fetch */
  updatedAt: number;
}

/** Pulsing dot plus how long ago the schedule was last refreshed. */
export function LiveStatus({ updatedAt }: LiveStatusProps) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(id);
  }, []);

  if (!updatedAt) return null;

  return (
    <div className="flex items-center gap-2">
      <span className="size-[5px] rounded-full bg-emerald-500 animate-livepulse" />
      <span className="text-[11.5px] tabular-nums text-muted-foreground">
        Updated {formatAgo(secondsAgo(updatedAt, now))}
      </span>
    </div>
  );
}
