import { useQuery } from '@tanstack/react-query';
import { fetchLines } from '../services/api';
import type { Line } from '@metra/shared';

export function useLines() {
  return useQuery<Line[], Error>({
    queryKey: ['lines'],
    queryFn: fetchLines,
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
    gcTime: 1000 * 60 * 60 * 24 * 7, // 7 days
  });
}

export function useLine(lineId: string | undefined) {
  const { data: lines } = useLines();
  return lines?.find((line) => line.line_id === lineId);
}
