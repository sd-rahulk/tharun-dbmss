import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getDb } from '@/lib/db';
import { SiteHeader } from '@/components/site-header';
import { JourneySearch } from '@/components/journey-search';
export const dynamic='force-dynamic';
export default async function JourneyPlannerPage() { const stops=await getDb().prepare('SELECT city_id,bus_stop,near FROM cities_town ORDER BY bus_stop').all<{city_id:string;bus_stop:string;near:string}>(); return <main className="grain min-h-screen"><SiteHeader/><div className="mx-auto max-w-[1440px] px-6 pb-24 pt-8 lg:px-12"><Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-black/50 hover:text-transit"><ArrowLeft size={16}/> Network home</Link><div className="mt-14 max-w-4xl"><p className="eyebrow">Route search</p><h1 className="display mt-4 text-6xl font-semibold leading-[.95]">A journey should read like a clear sentence.</h1><p className="mt-6 max-w-2xl text-lg leading-8 text-black/60">Choose two stops. The planner only returns direct services where the destination follows the origin in the ordered route sequence.</p></div><div className="mt-14"><JourneySearch stops={stops}/></div></div></main>; }
