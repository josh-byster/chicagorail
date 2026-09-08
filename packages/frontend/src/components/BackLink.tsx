import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

interface BackLinkProps {
  to?: React.ComponentProps<typeof Link>['to'];
  children?: React.ReactNode;
}

export function BackLink({ to = '/', children = 'Home' }: BackLinkProps) {
  return (
    <Link
      to={to}
      className="flex h-7 w-fit items-center gap-1.5 rounded-lg border border-border py-0 pl-2 pr-[11px] text-[12.5px] font-medium text-ink-subtle transition-colors hover:bg-foreground/5 hover:text-foreground"
    >
      <ChevronLeft className="size-[13px]" />
      {children}
    </Link>
  );
}
