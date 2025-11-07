import { Keyboard } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

interface KeyboardShortcut {
  key: string;
  description: string;
}

interface KeyboardShortcutsHelpProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const shortcuts: KeyboardShortcut[] = [
  { key: '/', description: 'Focus search input' },
  { key: 'h', description: 'Go to Home' },
  { key: 'l', description: 'Go to Lines' },
  { key: 'a', description: 'Go to Alerts' },
  { key: 's', description: 'Go to Statistics' },
  { key: 't', description: 'Toggle dark/light theme' },
  { key: '?', description: 'Show/hide this help' },
  { key: 'Esc', description: 'Close dialogs and menus' },
];

export function KeyboardShortcutsHelp({
  open,
  onOpenChange,
}: KeyboardShortcutsHelpProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5 text-primary" />
            Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription>
            Power user shortcuts for quick navigation
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 mt-4">
          {shortcuts.map((shortcut) => (
            <div
              key={shortcut.key}
              className="flex items-center justify-between p-3 rounded-lg bg-accent/30 hover:bg-accent/50 transition-colors"
            >
              <span className="text-sm text-muted-foreground">
                {shortcut.description}
              </span>
              <Badge
                variant="secondary"
                className="font-mono font-bold text-sm px-3 py-1"
              >
                {shortcut.key}
              </Badge>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t text-center text-xs text-muted-foreground">
          <p>Press any key to activate shortcuts from anywhere</p>
          <p className="mt-1">(except when typing in search fields)</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
