'use client';

import { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { Button } from './ui';

export function PassPurchase({ options }: { options: Array<{ pass_id:string; pass_type:string; price_minor:number; validity_days:number }> }) {
  const [passId,setPassId]=useState(options[0]?.pass_id || ''); const [message,setMessage]=useState(''); const [error,setError]=useState(''); const [loading,setLoading]=useState(false);
  async function purchase(){setLoading(true);setError('');setMessage('');const response=await fetch('/api/passes/purchase',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({passId})});const payload=await response.json();if(!response.ok)setError(payload.error||'Pass purchase failed.');else{setMessage(`Pass activated with purchase reference ${payload.purchaseId}.`);setTimeout(()=>window.location.reload(),500);}setLoading(false);}
  return <div className="rounded-2xl border border-black/10 bg-[#dcebed] p-5"><p className="eyebrow text-transit">Simulated purchase</p><div className="mt-4 flex flex-wrap items-end gap-3"><label className="block min-w-[220px] flex-1"><span className="mb-2 block text-xs font-bold uppercase tracking-[.12em] text-black/45">Pass type</span><select value={passId} onChange={(e)=>setPassId(e.target.value)} className="h-11 w-full rounded-xl border border-black/10 bg-white px-3 text-sm">{options.map((option)=><option key={option.pass_id} value={option.pass_id}>{option.pass_type} · ₹{(option.price_minor/100).toFixed(0)} · {option.validity_days} days</option>)}</select></label><Button onClick={purchase} disabled={loading||!passId}>{loading?'Processing':'Purchase pass'}</Button></div>{error&&<p className="mt-3 text-sm font-semibold text-[#8d3b30]">{error}</p>}{message&&<p className="mt-3 flex items-center gap-2 text-sm font-semibold text-signal"><CheckCircle2 size={16}/>{message}</p>}<p className="mt-3 text-xs text-black/45">Simulated payment only. No card details are collected.</p></div>;
}
