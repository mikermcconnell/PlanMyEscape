import { useReveal } from '../../hooks/useReveal';

interface FinalCTAProps {
  onGetStarted: () => void;
}

const FinalCTA = ({ onGetStarted }: FinalCTAProps) => {
  const revealRef = useReveal<HTMLDivElement>();

  return (
    <section
      ref={revealRef}
      className="opacity-0 translate-y-10 transition-all duration-700"
    >
      <div className="mx-auto max-w-6xl px-4 pb-24">
        <div className="overflow-hidden rounded-[3rem] bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-700 px-8 py-16 text-center text-white shadow-[0_35px_70px_rgba(13,148,136,0.45)]">
          <h2 className="text-3xl font-bold sm:text-4xl">Launch your next escape with confidence</h2>
          <p className="mt-4 text-lg text-emerald-50">
            Join planners who rely on PlanMyEscape to coordinate cabins, campsites, and backcountry expeditions without
            the last minute scramble.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
            <button
              type="button"
              onClick={onGetStarted}
              className="rounded-full bg-white px-8 py-3 text-base font-semibold text-emerald-700 shadow-[0_18px_40px_rgba(15,118,110,0.35)] transition hover:bg-emerald-50"
            >
              Create Your Free Account
            </button>
            <a
              href="#overview"
              className="rounded-full border border-white/60 px-8 py-3 text-base font-semibold text-white transition hover:bg-white/10"
            >
              Revisit the Overview
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FinalCTA;
