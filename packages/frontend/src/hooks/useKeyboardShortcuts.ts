import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/components/ThemeProvider';

interface ShortcutAction {
  key: string;
  description: string;
  action: () => void;
  modifier?: 'ctrl' | 'alt' | 'meta';
}

/**
 * Power user keyboard shortcuts
 * Provides quick navigation and actions via keyboard
 */
export function useKeyboardShortcuts() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [showHelp, setShowHelp] = useState(false);

  const shortcuts: ShortcutAction[] = [
    {
      key: '/',
      description: 'Focus search input',
      action: () => {
        const searchInput = document.querySelector(
          '[cmdk-input]'
        ) as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
        } else {
          navigate('/');
          setTimeout(() => {
            const input = document.querySelector(
              '[cmdk-input]'
            ) as HTMLInputElement;
            input?.focus();
          }, 100);
        }
      },
    },
    {
      key: 'h',
      description: 'Go to Home',
      action: () => navigate('/'),
    },
    {
      key: 'l',
      description: 'Go to Lines',
      action: () => navigate('/lines'),
    },
    {
      key: 'a',
      description: 'Go to Alerts',
      action: () => navigate('/alerts'),
    },
    {
      key: 's',
      description: 'Go to Statistics',
      action: () => navigate('/stats'),
    },
    {
      key: 't',
      description: 'Toggle theme',
      action: () => setTheme(theme === 'dark' ? 'light' : 'dark'),
    },
    {
      key: '?',
      description: 'Show keyboard shortcuts',
      action: () => setShowHelp(!showHelp),
    },
  ];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input/textarea
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        // Allow '?' shortcut even in input fields
        if (e.key !== '?') {
          return;
        }
      }

      const shortcut = shortcuts.find((s) => {
        const keyMatch = s.key === e.key;
        const modifierMatch = s.modifier
          ? (e.ctrlKey && s.modifier === 'ctrl') ||
            (e.altKey && s.modifier === 'alt') ||
            (e.metaKey && s.modifier === 'meta')
          : !e.ctrlKey && !e.altKey && !e.metaKey;

        return keyMatch && modifierMatch;
      });

      if (shortcut) {
        e.preventDefault();
        shortcut.action();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate, theme, setTheme, showHelp]);

  return {
    shortcuts,
    showHelp,
    setShowHelp,
  };
}
