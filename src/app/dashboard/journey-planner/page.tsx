import { getDb } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { JourneySearch } from '@/components/journey-search';

export const dynamic = 'force-dynamic';

export default function DashboardJourneyPlanner() {
  const user = getSessionUser();
  const stops = getDb().prepare('SELECT city_id, bus_stop, near FROM cities_town ORDER BY bus_stop').all() as Array<{city_id:string;bus_stop:string;near:string}>;
  return <div className="space-y-8"><div><p className="eyebrow">Direct service search</p><h1 className="display mt-3 text-5xl font-semibold">Plan the next leg.</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-black/55">The planner validates ordered stops on the same route, calculates the fare from SQLite fare rules, and derives remaining capacity from valid tickets.</p></div><JourneySearch stops={stops} canBook={user?.role === 'PASSENGER'} /></div>;
}
