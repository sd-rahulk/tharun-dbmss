import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { EerDiagram } from '@/components/dbms-diagrams';
export default function EerDiagramPage() { return <div className="space-y-8"><Link href="/dashboard/dbms" className="inline-flex items-center gap-2 text-sm font-semibold text-black/50 hover:text-transit"><ArrowLeft size={16}/> DBMS studio</Link><div><p className="eyebrow">Extended conceptual model</p><h1 className="display mt-3 text-5xl font-semibold">EER diagram.</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-black/55">The superclass/subclass model is separate from the original operational BUS relation. Shared primary keys make the specialization visible in SQLite.</p></div><EerDiagram /></div>; }
