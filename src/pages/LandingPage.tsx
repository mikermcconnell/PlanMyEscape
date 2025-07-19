import { useEffect, useRef, useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronDown, Leaf, Map, ShoppingCart, Car, Mountain, Home as House, Users, Brain, Utensils, CheckCircle, Tent } from 'lucide-react';
import SupaSignIn from '../components/SupaSignIn';
import { AuthContext } from '../contexts/AuthContext';

// Simple inline SVG for a canoe icon (not available in lucide-react)
const CanoeIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-12 w-12 text-green-600"
  >
    <path d="M2 16s3-4 10-4 10 4 10 4" />
    <path d="M2 16l10 4 10-4" />
  </svg>
);

// Simple intersection-observer hook for fade-in animations
const useReveal = () => {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry && entry.isIntersecting) {
          el.classList.add('opacity-100', 'translate-y-0');
          observer.unobserve(el);
        }
      },
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return ref;
};

const features = [
  {
    icon: <Map className="h-8 w-8 text-green-600" />,
    title: 'Smart Trip Setup',
    desc: 'Choose trip type and duration — we generate a full plan tailored to you.'
  },
  {
    icon: <Leaf className="h-8 w-8 text-green-600" />,
    title: 'Intelligent Packing Lists',
    desc: 'Smart packing suggestions so you never forget essentials.'
  },
  {
    icon: <ShoppingCart className="h-8 w-8 text-green-600" />,
    title: 'Unified Shopping Lists',
    desc: 'Automatic shopping lists that merge gear and meal ingredients.'
  }
];

export default function LandingPage() {
  const heroRef = useReveal();
  const featureRef = useReveal();
  const tripTypeRef = useReveal();
  const finalCtaRef = useReveal();
  const [showSignIn, setShowSignIn] = useState(false);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      setShowSignIn(false);
      navigate('/dashboard');
    }
  }, [user, navigate]);

  return (
    <>
      {/* Set title via useEffect to avoid additional deps */}
      {useEffect(() => {
        document.title = 'PlanMyEscape – Effortless Camping & Cottage Trip Planning';
      }, [])}
      {/* Sign-in Modal */}
      {showSignIn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full relative" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setShowSignIn(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 z-10"
              aria-label="Close sign in"
            >
              ✕
            </button>
            <div className="p-6">
              <SupaSignIn />
              
              {/* Continue without signing in option */}
              <div className="mt-6 border-t border-gray-200 pt-6">
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-amber-800">
                    <strong>Note:</strong> If you continue without signing in, your trip data will only be saved locally on this device and won't be accessible from other devices.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowSignIn(false);
                    navigate('/dashboard');
                  }}
                  className="w-full px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Continue without signing in
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="w-full bg-gray-50 text-gray-800 scroll-smooth">
        {/* Hero */}
        <section
          ref={heroRef}
          className="relative h-screen flex flex-col justify-center items-center text-center px-6 transition-all duration-700 opacity-0 translate-y-8 bg-cover bg-center"
          style={{
            backgroundImage:
              'url(https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1920&q=80)'
          }}
        >
          {/* Title Bar */}
          <div className="absolute top-6 left-6 right-6 flex items-center justify-between z-20">
            <div className="flex items-center gap-2">
              <Tent className="h-6 w-6 text-green-400" />
              <span className="font-bold text-white text-xl drop-shadow">PlanMyEscape</span>
            </div>
          </div>
          {/* Dark overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-black/80" />
          <div className="relative z-10 max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-extrabold text-white drop-shadow-lg max-w-2xl">
              Plan Perfect Outdoor Adventures, Every Time
            </h1>
            <ul className="mt-6 space-y-3 text-lg md:text-2xl max-w-2xl text-white drop-shadow-md text-left mx-auto">
              <li className="flex items-center gap-3"><Users className="h-6 w-6 text-green-300" />Coordinate groups for any adventure</li>
              <li className="flex items-center gap-3"><Brain className="h-6 w-6 text-green-300" />Pack smart with intelligent lists</li>
              <li className="flex items-center gap-3"><Utensils className="h-6 w-6 text-green-300" />Plan meals and shopping in minutes</li>
              <li className="flex items-center gap-3"><CheckCircle className="h-6 w-6 text-green-300" />Never forget essentials again</li>
            </ul>
            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => setShowSignIn(true)}
                className="px-8 py-4 rounded-full bg-green-600 hover:bg-green-700 text-white text-lg font-semibold shadow-lg"
              >
                Start Planning Your Adventure
              </button>
              <a
                href="#features"
                className="px-8 py-4 rounded-full border border-green-600 text-green-600 hover:bg-green-100 text-lg font-semibold"
              >
                See How It Works
              </a>
            </div>
          </div>
          <ChevronDown className="absolute bottom-10 animate-bounce text-white z-10" />
        </section>

        {/* Problem / Solution & Features */}
        <section
          id="features"
          ref={featureRef}
          className="py-20 transition-all duration-700 opacity-0 translate-y-8"
        >
          <div className="max-w-6xl mx-auto px-6">
            <h2 className="text-3xl md:text-4xl font-bold text-center">
              Say goodbye to stressful trip planning
            </h2>
            <p className="mt-4 max-w-3xl mx-auto text-center text-lg">
              PlanMyEscape saves hours of preparation time per trip, ensures no essential gear is forgotten, and
              keeps every member of your group on the same page.
            </p>

            {/* Feature cards */}
            <div className="mt-14 grid md:grid-cols-3 gap-8">
              {features.map((f) => (
                <div
                  key={f.title}
                  className="bg-white rounded-xl shadow p-8 flex flex-col items-start hover:shadow-lg transition-shadow"
                >
                  {f.icon}
                  <h3 className="mt-4 text-xl font-semibold">{f.title}</h3>
                  <p className="mt-2 text-gray-600">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Trip Types */}
        <section
          ref={tripTypeRef}
          className="py-20 bg-gradient-to-b from-green-50 to-white transition-all duration-700 opacity-0 translate-y-8"
        >
          <div className="max-w-6xl mx-auto px-6">
            <h2 className="text-3xl md:text-4xl font-bold text-center">Tailored to Any Adventure</h2>
            <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: 'Car Camping', icon: <Car className="h-12 w-12 text-green-600" /> },
                { label: 'Canoe Camping', icon: <CanoeIcon /> },
                { label: 'Hike Camping', icon: <Mountain className="h-12 w-12 text-green-600" /> },
                { label: 'Cottage', icon: <House className="h-12 w-12 text-green-600" /> }
              ].map(({ label, icon }) => (
                <div
                  key={label}
                  className="bg-white/70 backdrop-blur-md border border-white/40 rounded-xl p-8 shadow hover:shadow-lg transition-shadow flex flex-col items-center"
                >
                  {icon}
                  <h3 className="mt-4 text-lg font-semibold">{label}</h3>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section
          ref={finalCtaRef}
          className="py-24 bg-green-700 text-white text-center transition-all duration-700 opacity-0 translate-y-8"
        >
          <h2 className="text-3xl md:text-4xl font-extrabold">Ready to make your next trip effortless?</h2>
          <p className="mt-4 text-lg max-w-2xl mx-auto">
            Join thousands of outdoor enthusiasts who trust PlanMyEscape to coordinate, pack, and embark with
            confidence. Free forever — no credit card required.
          </p>
          <button
            onClick={() => setShowSignIn(true)}
            className="inline-block mt-10 px-10 py-4 rounded-full bg-white text-green-700 font-semibold text-lg hover:bg-green-100 shadow-lg"
          >
            Sign Up Free
          </button>
        </section>

        {/* Footer */}
        <footer className="py-8 bg-gray-100 text-center text-sm text-gray-600 space-x-2">
          <span>© {new Date().getFullYear()} PlanMyEscape. All rights reserved.</span>
          <span className="hidden sm:inline">|</span>
          <Link to="/privacy" className="text-green-600 hover:underline">Privacy Policy</Link>
          <span className="hidden sm:inline">|</span>
          <Link to="/terms" className="text-green-600 hover:underline">Terms of Service</Link>
          <span className="hidden sm:inline">|</span>
          <Link to="/cookies" className="text-green-600 hover:underline">Cookie Policy</Link>
        </footer>
      </div>
    </>
  );
} 