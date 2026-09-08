import type { Route } from '@chicagorail/shared';

interface RouteBadgeProps {
  route: Route;
  /** Board rows align badges to a common width */
  wide?: boolean;
}

export function RouteBadge({ route, wide = false }: RouteBadgeProps) {
  return (
    <span
      className={`inline-flex h-5 items-center justify-center rounded-md px-[7px] text-[11px] font-bold ${
        wide ? 'min-w-11' : ''
      }`}
      style={{
        backgroundColor: `#${route.route_color}`,
        color: `#${route.route_text_color || 'FFFFFF'}`,
      }}
    >
      {route.route_short_name}
    </span>
  );
}
