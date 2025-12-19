import skylineSvg from '../assets/Chicago-Skyline-Silhouette.svg';

export function ChicagoSkyline({ className = "" }: { className?: string }) {
  return (
    <img
      src={skylineSvg}
      alt=""
      className={className}
      style={{ filter: 'var(--skyline-filter, none)' }}
    />
  );
}
