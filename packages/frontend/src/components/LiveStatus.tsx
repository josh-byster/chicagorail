import { useEffect, useState } from 'react';
import { useSystemInfo } from '@/hooks/useSystemInfo';
import { formatAgo, secondsAgo } from '@/lib/trainInfo';

interface LiveStatusProps {
  /** Epoch ms of the last successful departures fetch */
  updatedAt: number;
}

/**
 * Pulsing dot plus how long ago the board was refreshed.
 *
 * Only says "Live" when Metra's realtime feed is actually feeding us; with
 * the schedule alone it says so rather than implying live tracking.
 */
export function LiveStatus({ updatedAt }: LiveStatusProps) {
  const [now, setNow] = useState(() => Date.now());
  const {
    data: { realtime },
  } = useSystemInfo();

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(id);
  }, []);

  if (!updatedAt) return null;

  const isLive = realtime.enabled && realtime.lastUpdated !== null;

  return (
    <div className="flex items-center gap-2">
      <span
        className={`size-[5px] rounded-full ${
          isLive ? 'animate-livepulse bg-emerald-500' : 'bg-muted-foreground'
        }`}
      />
      <span className="text-[11.5px] tabular-nums text-muted-foreground">
        {isLive ? 'Live' : 'Scheduled'} &middot; updated {formatAgo(secondsAgo(updatedAt, now))}
      </span>
    </div>
  );
}
