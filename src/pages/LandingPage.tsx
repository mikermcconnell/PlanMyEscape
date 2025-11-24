import { useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LandingNavigation from '../components/landing/LandingNavigation';
import HeroSection from '../components/landing/HeroSection';
import FeatureShowcase from '../components/landing/FeatureShowcase';
import PlansSection from '../components/landing/PlansSection';
import LearnSection from '../components/landing/LearnSection';
import FinalCTA from '../components/landing/FinalCTA';
import LandingFooter from '../components/landing/LandingFooter';
import { auth } from '../firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { AuthContext } from '../contexts/AuthContext';
import { logSecurityEvent } from '../utils/securityLogger';

const mediaPath = (filename: string) => `${process.env.PUBLIC_URL}/media/landing/${filename}`;

const heroSnapshots = [
  {
    src: mediaPath('Screenshot_20250807_181309.webp'),
    alt: 'Packing list overview with grouped items, progress counters, and reset controls.',
    className: 'top-6 -left-16 rotate-[-10deg]'
  },
  {
    src: mediaPath('Screenshot_20250807_181349.webp'),
    alt: 'Group gear assignments showing shared equipment categories and quick actions.',
    className: '-bottom-12 -left-12 rotate-[-4deg]'
  },
  {
    src: mediaPath('Screenshot_20250807_181426.webp'),
    alt: 'Meal planner timeline with meals organized by day and color-coded cards.',
    className: '-top-16 right-0 rotate-[8deg]'
  },
  {
    src: mediaPath('Screenshot_20250807_181440.webp'),
    alt: 'Shopping list dashboard with buy status indicators and export controls.',
    className: 'bottom-4 right-10 rotate-[4deg]'
  },
  {
    src: mediaPath('Screenshot_20250807_181524.webp'),
    alt: 'Trip todo list with completion tracker and prioritized action items.',
    className: 'top-1/2 left-1/2 -translate-x-1/2 translate-y-10 rotate-[-6deg]'
  }
];

const LandingPage = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  useEffect(() => {
    document.title = 'PlanMyEscape — Group Trip Planning Made Effortless';
  }, []);

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        await logSecurityEvent({
          type: 'login', // Note: We might not distinguish SIGNED_IN vs USER_UPDATED here easily without more state
          userId: user.uid,
          userAgent: navigator.userAgent
        });
        navigate('/dashboard');
      }
    });

    return () => {
      unsubscribe();
    };
  }, [navigate]);

  const handleGetStarted = () => {
    navigate('/signin');
  };

  return (
    <>
      <LandingNavigation onGetStarted={handleGetStarted} />

      <main className="bg-white text-gray-900">
        <HeroSection
          onGetStarted={handleGetStarted}
          mainScreenshot={{
            src: mediaPath('trip-overview.webp'),
            alt: 'Trip overview dashboard showing schedule, packing progress, and quick navigation.'
          }}
          snapshots={heroSnapshots}
        />
        <FeatureShowcase />
        <PlansSection />
        <LearnSection />
        <FinalCTA onGetStarted={handleGetStarted} />
      </main>

      <LandingFooter />
    </>
  );
};

export default LandingPage;
