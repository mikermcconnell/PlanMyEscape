import { Link } from 'react-router-dom';

const LandingFooter = () => {
  return (
    <footer className="border-t border-emerald-100 bg-white py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-sm text-gray-600 sm:flex-row">
        <span>&copy; {new Date().getFullYear()} PlanMyEscape. All rights reserved.</span>
        <div className="flex flex-wrap items-center gap-3">
          <Link to="/privacy" className="text-emerald-700 transition hover:underline">
            Privacy Policy
          </Link>
          <span aria-hidden="true">•</span>
          <Link to="/terms" className="text-emerald-700 transition hover:underline">
            Terms of Service
          </Link>
          <span aria-hidden="true">•</span>
          <Link to="/cookies" className="text-emerald-700 transition hover:underline">
            Cookie Policy
          </Link>
        </div>
      </div>
    </footer>
  );
};

export default LandingFooter;
