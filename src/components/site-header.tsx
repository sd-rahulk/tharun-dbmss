import Link from 'next/link';
import { ArrowUpRight, TrainFront } from 'lucide-react';

export function SiteHeader({ signedIn = false }: { signedIn?: boolean }) {
  return <header className="relative z-20 mx-auto flex max-w-[1440px] items-center justify-between px-6 py-6 lg:px-12">
    <Link href="/" className="group flex items-center gap-3" aria-label="Transit home">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-ink text-white transition-transform group-hover:-rotate-6"><TrainFront size={19} strokeWidth={1.8} /></span>
      <span className="leading-none"><span className="display block text-lg font-semibold">Transit / 26</span><span className="mt-1 block text-[10px] font-bold uppercase tracking-[.16em] text-black/45">Public network</span></span>
    </Link>
    <nav className="hidden items-center gap-8 text-sm font-semibold text-black/65 md:flex" aria-label="Primary">
      <Link href="/journey-planner" className="transition-colors hover:text-transit">Plan a journey</Link>
      <Link href="/routes" className="transition-colors hover:text-transit">Routes</Link>
      <Link href="/dashboard" className="transition-colors hover:text-transit">Operations</Link>
    </nav>
    <div className="flex items-center gap-3">
      <Link href={signedIn ? '/dashboard' : '/login'} className="inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-transit">{signedIn ? 'Open workspace' : 'Sign in'} <ArrowUpRight size={16} /></Link>
    </div>
  </header>;
}
