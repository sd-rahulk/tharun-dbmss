import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { AuthForm } from '@/components/auth-form';

export default function RegisterPage() {
  return <main className="grain grid min-h-screen place-items-center px-6 py-10"><div className="w-full max-w-md"><Link href="/" className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-black/50 hover:text-transit"><ArrowLeft size={16} /> Back to public network</Link><div className="rounded-3xl border border-black/10 bg-white/75 p-7 shadow-lift sm:p-10"><p className="eyebrow">Passenger registration</p><h1 className="display mt-4 text-4xl font-semibold">Make the next trip simpler.</h1><p className="mt-3 text-sm leading-6 text-black/55">Your profile stays in this Firebase-backed transit system. You can search first, then book and keep your ticket history here.</p><div className="mt-8"><AuthForm mode="register" /></div></div></div></main>;
}
