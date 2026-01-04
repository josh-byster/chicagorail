import { DatePicker } from './DatePicker';
import { Button } from './ui/button';

interface DateControlsProps {
  selectedDate: Date;
  isToday: boolean;
  onDateChange: (date: Date | undefined) => void;
}

export function DateControls({ selectedDate, isToday, onDateChange }: DateControlsProps) {
  return (
    <div className="flex items-center gap-2">
      <DatePicker
        date={selectedDate}
        onDateChange={onDateChange}
      />
      {!isToday && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDateChange(new Date())}
        >
          Today
        </Button>
      )}
    </div>
  );
}
