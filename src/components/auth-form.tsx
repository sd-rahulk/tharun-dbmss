'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, LockKeyhole } from 'lucide-react';
import { Button } from './ui';

export function AuthForm({ mode }: { mode: 'login'|'register' }) {
  const router = useRouter();
  const [form, setForm] = useState({ name:'', phone:'', gender:'PREFER_NOT_TO_SAY', email:'', password:'' });
  const [error, setError] = useState(''); const [loading, setLoading] = useState(false);
  async function submit(e: React.FormEvent) { e.preventDefault(); setLoading(true); setError(''); const response = await fetch(`/api/auth/${mode}`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(form) }); const payload=await response.json(); if (!response.ok) setError(payload.error || 'Unable to continue.'); else router.push(new URLSearchParams(window.location.search).get('next') || '/dashboard'); setLoading(false); }
  return <form onSubmit={submit} className="space-y-4">
    {mode === 'register' && <><label className="block"><span className="mb-2 block text-xs font-bold uppercase tracking-[.12em] text-black/45">Full name</span><input required value={form.name} onChange={(e)=>setForm({...form,name:e.target.value})} className="h-12 w-full rounded-xl border border-black/10 bg-white px-4 text-sm" /></label><label className="block"><span className="mb-2 block text-xs font-bold uppercase tracking-[.12em] text-black/45">Phone</span><input required value={form.phone} onChange={(e)=>setForm({...form,phone:e.target.value})} className="h-12 w-full rounded-xl border border-black/10 bg-white px-4 text-sm" /></label><label className="block"><span className="mb-2 block text-xs font-bold uppercase tracking-[.12em] text-black/45">Gender</span><select value={form.gender} onChange={(e)=>setForm({...form,gender:e.target.value})} className="h-12 w-full rounded-xl border border-black/10 bg-white px-4 text-sm"><option value="PREFER_NOT_TO_SAY">Prefer not to say</option><option value="FEMALE">Female</option><option value="MALE">Male</option><option value="NON_BINARY">Non-binary</option></select></label></>}
    <label className="block"><span className="mb-2 block text-xs font-bold uppercase tracking-[.12em] text-black/45">Email</span><input required type="email" value={form.email} onChange={(e)=>setForm({...form,email:e.target.value})} className="h-12 w-full rounded-xl border border-black/10 bg-white px-4 text-sm" /></label>
    <label className="block"><span className="mb-2 block text-xs font-bold uppercase tracking-[.12em] text-black/45">Password</span><input required type="password" minLength={8} value={form.password} onChange={(e)=>setForm({...form,password:e.target.value})} className="h-12 w-full rounded-xl border border-black/10 bg-white px-4 text-sm" /></label>
    {error && <div role="alert" className="rounded-xl bg-[#f5dcd7] px-4 py-3 text-sm font-semibold text-[#8d3b30]">{error}</div>}
    <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Working…' : mode === 'login' ? 'Sign in' : 'Create passenger account'} <ArrowRight size={16} /></Button>
    <p className="flex items-center justify-center gap-2 text-xs text-black/45"><LockKeyhole size={14} /> Passwords are hashed; sessions use HTTP-only cookies.</p>
    <p className="text-center text-sm text-black/55">{mode === 'login' ? <>New here? <Link href="/register" className="font-semibold text-transit">Create an account</Link></> : <>Already registered? <Link href="/login" className="font-semibold text-transit">Sign in</Link></>}</p>
  </form>;
}
