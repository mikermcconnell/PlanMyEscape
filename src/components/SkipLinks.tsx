import React from 'react';

/**
 * Skip links component for accessibility navigation
 */
export const SkipLinks: React.FC = () => {
  return (
    <div className="sr-only focus-within:not-sr-only focus-within:absolute focus-within:top-0 focus-within:left-0 focus-within:z-50">
      <a
        href="#main-content"
        className="block p-2 bg-blue-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        Skip to main content
      </a>
      <a
        href="#navigation"
        className="block p-2 bg-blue-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        Skip to navigation
      </a>
      <a
        href="#footer"
        className="block p-2 bg-blue-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        Skip to footer
      </a>
    </div>
  );
};

export default SkipLinks;