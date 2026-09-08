/**
 * Follows the OS colour scheme by toggling the `dark` class on <html>.
 */

const query = '(prefers-color-scheme: dark)';

export function syncThemeWithSystem(): void {
  const media = window.matchMedia(query);

  const apply = (isDark: boolean) => {
    document.documentElement.classList.toggle('dark', isDark);
  };

  apply(media.matches);
  media.addEventListener('change', (event) => apply(event.matches));
}
