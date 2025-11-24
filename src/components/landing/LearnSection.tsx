import { Calendar, Layers, Share2, CheckCircle } from 'lucide-react';
import { useReveal } from '../../hooks/useReveal';

const steps = [
  {
    icon: Calendar,
    title: 'Set the scene',
    description: 'Pick trip type, dates, and group size - PlanMyEscape tunes every module instantly.'
  },
  {
    icon: Layers,
    title: 'Customize every list',
    description: 'Assign gear, meals, and todos while live progress keeps everyone accountable.'
  },
  {
    icon: Share2,
    title: 'Loop in your crew',
    description: 'Invite collaborators, share updates, and export offline packs for the trail.'
  },
  {
    icon: CheckCircle,
    title: 'Head out confident',
    description: 'Track completion in real time so you launch with zero loose ends.'
  }
];

const LearnSection = () => {
  const revealRef = useReveal<HTMLDivElement>();

  return (
    <section
      id="learn"
      ref={revealRef}
      className="opacity-0 translate-y-10 transition-all duration-700"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-12 px-4 py-24 lg:flex-row lg:items-center">
        <div className="max-w-lg">
          <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">See how your trip comes together</h2>
          <p className="mt-4 text-lg text-gray-600">
            PlanMyEscape guides you from idea to packed car. Each module feeds the next, so you focus on the experience
            rather than spreadsheets.
          </p>
        </div>

        <ol className="grid flex-1 gap-6 sm:grid-cols-2">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <li
                key={step.title}
                className="rounded-3xl border border-emerald-100 bg-white/80 p-6 shadow-[0_16px_36px_rgba(16,185,129,0.16)] transition duration-500 hover:-translate-y-1 hover:border-emerald-200"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                    <Icon className="h-6 w-6" />
                  </span>
                  <span className="text-sm font-semibold uppercase tracking-wide text-emerald-600">
                    Step {index + 1}
                  </span>
                </div>
                <h3 className="mt-4 text-lg font-semibold text-gray-900">{step.title}</h3>
                <p className="mt-2 text-sm text-gray-600">{step.description}</p>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
};

export default LearnSection;
