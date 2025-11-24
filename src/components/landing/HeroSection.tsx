interface HeroSnapshot {
  src: string;
  alt: string;
  className: string;
}

interface HeroSectionProps {
  onGetStarted: () => void;
  mainScreenshot: { src: string; alt: string };
  snapshots: HeroSnapshot[];
}

const HeroSection = ({ onGetStarted, mainScreenshot, snapshots }: HeroSectionProps) => {
  return (
    <section
      id="overview"
      className="relative overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-emerald-100 pb-20 pt-24 lg:pb-32 lg:pt-32"
    >
      {/* Background decorative blobs */}
      <div className="absolute -left-20 -top-20 h-96 w-96 rounded-full bg-emerald-200/30 blur-3xl filter" />
      <div className="absolute -right-20 bottom-0 h-96 w-96 rounded-full bg-emerald-300/20 blur-3xl filter" />

      <div className="mx-auto flex max-w-7xl flex-col gap-16 px-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-xl space-y-8 animate-fade-in-up">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-xs font-bold uppercase tracking-widest text-emerald-700 shadow-sm ring-1 ring-emerald-100 backdrop-blur-sm">
            <span className="flex h-2 w-2">
              <span className="absolute inline-flex h-2 w-2 animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
            </span>
            Smart Trip Planning
          </div>

          <h1 className="text-5xl font-extrabold tracking-tight text-gray-900 sm:text-6xl lg:text-7xl">
            Plan your next <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">adventure</span> with ease
          </h1>

          <p className="text-xl leading-relaxed text-gray-600 sm:text-2xl">
            PlanMyEscape brings every detail together—trip overview, packing, meals, shopping, and todos—so your
            group stays aligned before you ever hit the road.
          </p>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center pt-4">
            <button
              type="button"
              onClick={onGetStarted}
              className="animate-pulse-soft rounded-full bg-emerald-600 px-8 py-4 text-lg font-bold text-white shadow-lg transition-all hover:bg-emerald-700 hover:shadow-emerald-500/30 hover:-translate-y-1"
            >
              Start Planning Free
            </button>
            <a
              href="#features"
              className="group flex items-center justify-center gap-2 rounded-full border border-emerald-200 bg-white/50 px-8 py-4 text-lg font-semibold text-emerald-700 backdrop-blur-sm transition-all hover:border-emerald-300 hover:bg-emerald-50"
            >
              Explore Features
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-5 w-5 transition-transform group-hover:translate-x-1">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </a>
          </div>
        </div>

        <div className="relative mx-auto flex max-w-lg flex-col items-center lg:mx-0 lg:max-w-none lg:flex-1">
          {/* Main Screenshot Container */}
          <div className="relative z-10 w-full max-w-md rounded-[2.5rem] bg-gray-900 p-3 shadow-2xl ring-1 ring-gray-900/10 landing-float lg:max-w-lg">
            <div className="overflow-hidden rounded-[2rem] bg-white ring-1 ring-white/10">
              <img
                src={mainScreenshot.src}
                alt={mainScreenshot.alt}
                className="h-full w-full object-cover"
                loading="eager"
              />
            </div>
          </div>

          {/* Floating Snapshots - Desktop */}
          <div className="pointer-events-none absolute inset-0 hidden lg:block">
            {snapshots.map((snapshot, index) => (
              <figure
                key={snapshot.src}
                className={`landing-float-delayed absolute w-56 overflow-hidden rounded-2xl bg-white p-2 shadow-xl ring-1 ring-black/5 backdrop-blur-md ${snapshot.className}`}
                style={{ animationDelay: `${index * -3}s` }}
              >
                <img src={snapshot.src} alt={snapshot.alt} className="h-full w-full rounded-xl object-cover" loading="lazy" />
              </figure>
            ))}
          </div>

          {/* Mobile Snapshots Carousel */}
          <div className="mt-12 flex w-full gap-6 overflow-x-auto pb-8 lg:hidden scrollbar-hide snap-x snap-mandatory">
            {snapshots.map((snapshot) => (
              <figure
                key={snapshot.src}
                className="min-w-[260px] flex-none snap-center rounded-2xl bg-white p-2 shadow-lg ring-1 ring-black/5"
              >
                <img src={snapshot.src} alt={snapshot.alt} className="h-full w-full rounded-xl object-cover" loading="lazy" />
              </figure>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
