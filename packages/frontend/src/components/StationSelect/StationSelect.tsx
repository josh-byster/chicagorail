import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useStations } from '@/hooks/useStations';

interface StationSelectProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function StationSelect({
  value,
  onChange,
  placeholder = 'Select station',
  disabled = false,
}: StationSelectProps) {
  const { data: stations, isLoading, error } = useStations();

  if (isLoading) {
    return <Skeleton className="h-10 w-full" />;
  }

  if (error) {
    return (
      <Select disabled>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Error loading stations" />
        </SelectTrigger>
      </Select>
    );
  }

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {stations?.map((station) => (
          <SelectItem key={station.station_id} value={station.station_id}>
            {station.station_name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
