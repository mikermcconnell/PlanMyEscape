import { Map, Leaf, ShoppingCart, CheckSquare, Users } from 'lucide-react';
import { useReveal } from '../../hooks/useReveal';

const mediaPath = (filename: string) => `${process.env.PUBLIC_URL}/media/landing/${filename}`;

const features = [
  {
    icon: Users,
    title: 'Trip overview that stays in sync',
    description:
      'Keep destinations, dates, and groups aligned with a single dashboard everyone can trust. No more endless group chat scrolling to find the address.',
    image: mediaPath('trip-overview.webp'),
    gradient: 'from-emerald-50 to-teal-50',
    align: 'left'
  },
  {
    icon: CheckSquare,
    title: 'Smart packing lists',
    description:
      'Generate adaptive checklists for your specific activity. Assign shared gear to group members so you don\'t end up with 5 camp stoves and no fuel.',
    image: mediaPath('Screenshot_20250807_181309.webp'),
    gradient: 'from-green-50 to-emerald-50',
    align: 'right'
  },
  {
    icon: Leaf,
    title: 'Meal planning made easy',
    description:
      'Map out meals by day and time. Auto-generate shopping lists from your menu so you buy exactly what you need and nothing you don\'t.',
    image: mediaPath('Screenshot_20250807_181426.webp'),
    gradient: 'from-emerald-50 to-lime-50',
    align: 'left'
  },
  {
    icon: ShoppingCart,
    title: 'Collaborative shopping',
    description:
      'Split the shopping list among drivers or early arrivers. Mark items as bought in real-time to avoid double purchases.',
    image: mediaPath('Screenshot_20250807_181440.webp'),
    gradient: 'from-teal-50 to-emerald-50',
    align: 'right'
  }
];

const FeatureShowcase = () => {
  const revealRef = useReveal<HTMLDivElement>();

  return (
    <section
      id="features"
      ref={revealRef}
      className="overflow-hidden py-24 lg:py-32"
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center mb-20">
          <h2 className="text-base font-semibold leading-7 text-emerald-600">Everything you need</h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Plan smarter with connected tools
          </p>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            Every PlanMyEscape module talks to the others - so when you tweak one part of the trip, every list and schedule
            updates alongside it.
          </p>
        </div>

        <div className="flex flex-col gap-24 lg:gap-32">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            const isRight = feature.align === 'right';

            return (
              <div
                key={feature.title}
                className={`flex flex-col gap-12 lg:flex-row lg:items-center ${isRight ? 'lg:flex-row-reverse' : ''}`}
              >
                {/* Text Content */}
                <div className={`flex-1 space-y-8 ${isRight ? 'lg:pl-12' : 'lg:pr-12'}`}>
                  <div className={`inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${feature.gradient} text-emerald-700 shadow-sm ring-1 ring-emerald-100`}>
                    <Icon className="h-7 w-7" />
                  </div>

                  <div>
                    <h3 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                      {feature.title}
                    </h3>
                    <p className="mt-4 text-lg leading-relaxed text-gray-600">
                      {feature.description}
                    </p>
                  </div>

                  <ul className="space-y-3 text-gray-600">
                    {['Real-time updates', 'Mobile optimized', 'Works offline'].map((item) => (
                      <li key={item} className="flex items-center gap-3">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Image Content */}
                <div className="flex-1 lg:max-w-xl">
                  <div className={`relative rounded-3xl bg-gray-900/5 p-2 ring-1 ring-inset ring-gray-900/10 lg:rounded-[2.5rem] ${index % 2 === 0 ? 'rotate-1' : '-rotate-1'} hover:rotate-0 transition-transform duration-500`}>
                    <div className="rounded-2xl bg-white p-2 shadow-2xl ring-1 ring-gray-900/10 lg:rounded-[2rem]">
                      <img
                        src={feature.image}
                        alt={feature.title}
                        className="w-full rounded-xl shadow-inner lg:rounded-[1.75rem]"
                        loading="lazy"
                      />
                    </div>
                    {/* Decorative elements */}
                    <div className={`absolute -bottom-6 -right-6 -z-10 h-64 w-64 rounded-full bg-gradient-to-br ${feature.gradient} opacity-50 blur-3xl`} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FeatureShowcase;
