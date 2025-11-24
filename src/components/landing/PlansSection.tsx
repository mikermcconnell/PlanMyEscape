import { Car, Mountain, Home as House, Tent } from 'lucide-react';
import { useReveal } from '../../hooks/useReveal';

const CanoeIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-6 w-6"
  >
    <path d="M2 16s3-4 10-4 10 4 10 4" />
    <path d="M2 16l10 4 10-4" />
  </svg>
);

const plans = [
  {
    icon: Car,
    title: 'Car Camping',
    description: 'Perfect for weekend getaways with the family. Includes pre-built checklists for comfort camping.',
    features: ['Family packing lists', 'Weather alerts', 'Campsite reservation tracking'],
    popular: false
  },
  {
    icon: CanoeIcon,
    title: 'Backcountry Paddle',
    description: 'Specialized tools for portage trips. Calculate pack weights and plan meals for remote travel.',
    features: ['Weight calculator', 'Portage route planning', 'Offline maps export'],
    popular: true
  },
  {
    icon: Mountain,
    title: 'Alpine Expedition',
    description: 'For serious summits. Track technical gear, acclimatization schedules, and nutrition.',
    features: ['Technical gear tracking', 'Summit day planner', 'Calorie planning'],
    popular: false
  },
  {
    icon: House,
    title: 'Cottage Retreat',
    description: 'Relaxed planning for group stays. Manage shared groceries, chores, and arrival times.',
    features: ['Shared grocery list', 'Chore assignment', 'Guest handbook'],
    popular: false
  }
];

const PlansSection = () => {
  const revealRef = useReveal<HTMLDivElement>();

  return (
    <section
      id="plans"
      ref={revealRef}
      className="bg-gray-50 py-24 lg:py-32"
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <h2 className="text-base font-semibold leading-7 text-emerald-600">Choose your adventure</h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Tailored templates for every trip style
          </p>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            Start with a curated template, then fine-tune packing, meals, and todos until it fits the way your group travels.
          </p>
        </div>

        <div className="mx-auto grid max-w-md grid-cols-1 gap-8 lg:max-w-none lg:grid-cols-4">
          {plans.map((plan) => {
            const Icon = plan.icon;
            return (
              <div
                key={plan.title}
                className={`relative flex flex-col justify-between rounded-3xl bg-white p-8 shadow-xl ring-1 ring-gray-900/10 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl ${plan.popular ? 'ring-2 ring-emerald-600 scale-105 lg:scale-110 z-10' : ''
                  }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-0 right-0 mx-auto w-32 rounded-full bg-emerald-600 px-3 py-1 text-center text-sm font-medium text-white shadow-md">
                    Most Popular
                  </div>
                )}

                <div>
                  <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${plan.popular ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-600'}`}>
                    <Icon className="h-6 w-6" />
                  </div>

                  <h3 className="mt-6 text-xl font-bold tracking-tight text-gray-900">{plan.title}</h3>
                  <p className="mt-4 text-sm leading-6 text-gray-600">{plan.description}</p>

                  <ul className="mt-8 space-y-3 text-sm leading-6 text-gray-600">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex gap-x-3">
                        <svg className={`h-6 w-5 flex-none ${plan.popular ? 'text-emerald-600' : 'text-emerald-500'}`} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                        </svg>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  className={`mt-8 block w-full rounded-full px-3 py-2 text-center text-sm font-semibold leading-6 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${plan.popular
                      ? 'bg-emerald-600 text-white hover:bg-emerald-500 focus-visible:outline-emerald-600 shadow-lg shadow-emerald-600/20'
                      : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                    }`}
                >
                  Use Template
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default PlansSection;
