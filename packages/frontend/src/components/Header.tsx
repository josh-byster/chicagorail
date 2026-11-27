import { Link } from 'react-router-dom';
import { Search, TrainFront } from 'lucide-react';
import { useStationPicker } from '@/hooks/useStationPicker';

export function Header() {
  const openPicker = useStationPicker();

  return (
    <header
      className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-hairline bg-background/80 px-4 sm:px-5 backdrop-blur-xl"
      role="banner"
    >
      <Link to="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-80">
        <span className="flex size-[26px] items-center justify-center rounded-[7px] bg-foreground/[.07]">
          <TrainFront className="size-[15px] text-ink-subtle" />
        </span>
        <span className="whitespace-nowrap text-sm font-semibold tracking-[-0.01em]">Chicago Rail</span>
      </Link>

      <nav className="ml-auto flex items-center gap-1.5" aria-label="Main navigation">
        <button
          type="button"
          onClick={() => openPicker('from')}
          className="flex h-[30px] items-center gap-2 rounded-full border border-border px-2.5 sm:px-3 text-[12.5px] font-medium text-ink-subtle transition-colors hover:bg-foreground/5 hover:text-foreground"
        >
          <Search className="size-[13px]" />
          <span className="hidden sm:inline">Search stations</span>
          <span className="sr-only sm:hidden">Search stations</span>
        </button>
      </nav>
    </header>
  );
}
