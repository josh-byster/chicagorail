import { Train } from 'lucide-react';
import { DatePicker } from './DatePicker';
import { ThemeToggle } from './ThemeToggle';

interface HeaderProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

export function Header({ selectedDate, onDateChange }: HeaderProps) {
  return (
    <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Train className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold">Metra Tracker</h1>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <DatePicker selectedDate={selectedDate} onDateChange={onDateChange} />
        </div>
      </div>
    </header>
  );
}
