import { useState } from 'react';
import { Share2, Check, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface ShareButtonProps {
  url?: string;
  title?: string;
  text?: string;
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export function ShareButton({
  url = window.location.href,
  title = 'Metra Train Schedule',
  text = 'Check out this Metra train schedule',
  variant = 'outline',
  size = 'default',
}: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);

  const canShare = typeof navigator !== 'undefined' && 'share' in navigator;

  const handleShare = async () => {
    if (canShare) {
      try {
        await navigator.share({
          title,
          text,
          url,
        });
      } catch {
        // User cancelled or error occurred
        // Silently ignore errors
      }
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
        setOpen(false);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (canShare) {
    return (
      <Button onClick={handleShare} variant={variant} size={size}>
        <Share2 className="h-4 w-4" />
        {size !== 'icon' && <span className="ml-2">Share</span>}
      </Button>
    );
  }

  // Fallback to copy to clipboard with popover
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant={variant} size={size}>
          <Share2 className="h-4 w-4" />
          {size !== 'icon' && <span className="ml-2">Share</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-3">
          <h4 className="font-semibold text-sm">Share this route</h4>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={url}
              readOnly
              className="flex-1 px-3 py-2 text-sm border rounded-md bg-background"
              onClick={(e) => (e.target as HTMLInputElement).select()}
            />
            <Button onClick={handleCopy} size="sm" variant="secondary">
              {copied ? (
                <>
                  <Check className="h-4 w-4 text-green-500" />
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
          {copied && (
            <p className="text-xs text-green-600 dark:text-green-400">
              Copied to clipboard!
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
