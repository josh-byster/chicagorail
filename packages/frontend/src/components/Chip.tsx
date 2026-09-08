import { cn } from '@/lib/utils';

interface ChipProps extends React.ComponentProps<'button'> {
  selected?: boolean;
  dashed?: boolean;
}

/** Pill-shaped filter / toggle control used across the boards. */
export function Chip({ selected = false, dashed = false, className, ...props }: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={cn(
        'inline-flex h-7 items-center gap-1.5 rounded-full px-3 text-[12.5px] transition-colors',
        selected
          ? 'bg-foreground font-semibold text-background'
          : 'border border-border font-medium text-ink-subtle hover:bg-foreground/5 hover:text-foreground',
        !selected && dashed && 'border-dashed border-hairline-strong',
        className
      )}
      {...props}
    />
  );
}
