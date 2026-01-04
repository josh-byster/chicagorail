import { utils } from '@chicagorail/shared';

interface TimeCardProps {
  time: string;
  routeColor: string;
  subtitle: React.ReactNode;
}

export function TimeCard({ time, routeColor, subtitle }: TimeCardProps) {
  return (
    <div className="border rounded-lg px-3 py-2.5 hover:bg-accent transition-colors bg-background/50">
      <div className="flex items-center gap-1.5 justify-center mb-0.5">
        <div
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: `#${routeColor}` }}
        />
        <span className="font-semibold text-lg tabular-nums">
          {utils.formatTime(time)}
        </span>
      </div>
      <div className="text-xs text-muted-foreground text-center truncate">
        {subtitle}
      </div>
    </div>
  );
}
