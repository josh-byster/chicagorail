import { Link } from 'react-router-dom';

export function Header() {
  return (
    <header className="border-b bg-background" role="banner">
      <nav className="container mx-auto px-4 py-3 md:py-4 max-w-6xl" aria-label="Main navigation">
        <Link to="/" className="flex items-center gap-1.5 md:gap-2 hover:opacity-80 transition-opacity w-fit">
          <img src="/icon.png" alt="Chicago Rail logo" className="h-6 w-6 md:h-8 md:w-8 rounded-lg" width="32" height="32" />
          <span className="text-lg md:text-2xl font-bold">Chicago Rail</span>
        </Link>
      </nav>
    </header>
  );
}
