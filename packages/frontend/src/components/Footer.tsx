import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export function Footer() {
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  useEffect(() => {
    const fetchSystemInfo = async () => {
      try {
        const data = await api.getSystemInfo();
        setLastUpdated(data.lastUpdated);
      } catch (error) {
        console.error('Failed to fetch system info:', error);
      }
    };

    fetchSystemInfo();
  }, []);

  const formatLastUpdated = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short'
    });
  };

  return (
    <footer className="mt-auto border-t bg-background relative z-10">
      <div className="container mx-auto px-4 py-6">
        <div className="text-center text-xs text-muted-foreground space-y-2">
          <p>
            Data obtained from Metra GTFS schedule
            {lastUpdated && (
              <span> • Last updated: {formatLastUpdated(lastUpdated)}</span>
            )}
          </p>
          <p>
            Schedule data provided "AS IS" and may not be accurate, complete, or timely.
            Always verify departure times with official Metra sources.
          </p>
          <p>
            Not affiliated with, sponsored by, or operated by Metra or the Regional Transportation Authority.
          </p>
        </div>
      </div>
    </footer>
  );
}
