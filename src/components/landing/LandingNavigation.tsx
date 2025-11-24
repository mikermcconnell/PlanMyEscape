import { Link } from 'react-router-dom';
import { Tent } from 'lucide-react';

interface LandingNavigationProps {
  onGetStarted: () => void;
}

const navLinks = [
  { label: 'Overview', href: '#overview' },
  { label: 'Features', href: '#features' },
  { label: 'Plans', href: '#plans' },
  { label: 'Learn', href: '#learn' }
];

const LandingNavigation = ({ onGetStarted }: LandingNavigationProps) => {
  return (
    <header className="sticky top-0 z-30 border-b border-emerald-100/60 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <Link to="/" className="flex items-center gap-3 text-emerald-700">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 shadow-sm">
            <Tent className="h-7 w-7" />
          </span>
          <span className="text-xl font-bold text-gray-900 sm:text-2xl">PlanMyEscape</span>
        </Link>

        <nav className="flex flex-1 flex-wrap items-center gap-4 sm:justify-center">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-gray-600 transition hover:text-emerald-600"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            to="/signin"
            className="rounded-full px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50"
          >
            Sign In
          </Link>
          <button
            type="button"
            onClick={onGetStarted}
            className="rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-200 transition hover:bg-emerald-700 hover:shadow-emerald-300"
          >
            Get Started
          </button>
        </div>
      </div>
    </header>
  );
};

export default LandingNavigation;
