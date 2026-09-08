/**
 * Footer component
 *
 * Displays data attribution and last update time.
 */

import { useSystemInfo } from '@/hooks/useSystemInfo';

function formatLastUpdated(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  });
}

export function Footer() {
  const {
    data: { lastUpdated },
    error,
  } = useSystemInfo();

  return (
    <footer className="mt-auto" role="contentinfo">
      <div className="mx-auto w-full max-w-[720px] px-5 pb-10">
        <div className="flex flex-col gap-[3px] border-t border-hairline pt-3.5 text-[11.5px] text-muted-foreground">
          <p>
            Metra GTFS schedule
            {error ? (
              <span> &middot; update time unavailable</span>
            ) : lastUpdated ? (
              <span>
                {' '}
                &middot; updated{' '}
                <time dateTime={lastUpdated}>{formatLastUpdated(lastUpdated)}</time>
              </span>
            ) : null}
          </p>
          <p>
            Times are scheduled, not live &mdash; always verify with{' '}
            <a
              href="https://metra.com"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-foreground"
            >
              Metra
            </a>
            .
          </p>
          <p>Not affiliated with Metra or the Regional Transportation Authority.</p>
        </div>
      </div>
    </footer>
  );
}
