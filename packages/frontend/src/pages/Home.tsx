import { Link } from 'react-router-dom';
import { ArrowRight, ArrowLeftRight, Calendar } from 'lucide-react';

const userFlows = [
  {
    title: 'View Departures',
    description: 'Check upcoming train departures from any station',
    icon: ArrowRight,
    path: '/departures',
    color: 'from-blue-500 to-blue-600',
  },
  {
    title: 'View Arrivals',
    description: 'See trains arriving at your station',
    icon: Calendar,
    path: '/arrivals',
    color: 'from-green-500 to-green-600',
  },
  {
    title: 'Plan a Trip',
    description: 'Find trains from point A to point B',
    icon: ArrowLeftRight,
    path: '/trip-planner',
    color: 'from-purple-500 to-purple-600',
  },
];

export function Home() {
  return (
    <div className="min-h-[calc(100vh-73px)] bg-background">
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        <div className="text-center mb-12">
          <h2 className="text-5xl font-bold mb-4">Track Metra Trains</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Real-time departure and arrival information for Chicago's Metra rail system.
            Quick access to the tools you need.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {userFlows.map((flow) => {
            const Icon = flow.icon;
            return (
              <Link
                key={flow.path}
                to={flow.path}
                className="group relative overflow-hidden rounded-xl border bg-card p-6 transition-all hover:shadow-lg hover:scale-105"
              >
                <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
                  <div className={`w-full h-full bg-gradient-to-br ${flow.color} rounded-full blur-2xl`} />
                </div>

                <div className="relative">
                  <div className={`inline-flex p-3 rounded-lg bg-gradient-to-br ${flow.color} mb-4`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>

                  <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
                    {flow.title}
                  </h3>

                  <p className="text-muted-foreground text-sm">
                    {flow.description}
                  </p>

                  <div className="mt-4 flex items-center text-sm font-medium text-primary">
                    Get started
                    <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
