import Link from 'next/link';
import { ArrowLeft, KeyRound } from 'lucide-react';
import { Panel } from '@/components/ui';

export default function RelationalSchemaPage() {
  const relations = [
    ['EMPLOYEE', 'emp_no, emp_name, emp_address, emp_role', 'PK emp_no', 'Emp_No -> Emp_Name, Emp_Address, Emp_Role'],
    ['BUS', 'bus_no, seat, emp_no', 'PK bus_no; FK emp_no', 'Bus_No -> Seat, Emp_No'],
    ['ROUTE', 'route_id, route_description, duration', 'PK route_id', 'Route_ID -> Route_Description, Duration'],
    ['AGENT', 'agent_name, location, travel_time, emp_no', 'PK agent_name; FK emp_no', 'Agent_Name -> Location, Travel_Time, Emp_No'],
    ['SCHEDULE', 'schedule_id, departure_date, departure_time, route_id, bus_no, emp_no', 'PK schedule_id; FKs route_id, bus_no, emp_no', 'Schedule_ID -> all non-key attributes'],
    ['TICKET', 'ticket_number, schedule_id, agent_name', 'PK ticket_number; FKs schedule_id, agent_name', 'Ticket_Number -> Schedule_ID, Agent_Name'],
    ['CITIES_TOWN', 'city_id, bus_stop, near', 'PK city_id', 'City_ID -> Bus_Stop, Near'],
    ['ROUTE_CITY', 'route_id, city_id, stop_sequence', 'PK (route_id, city_id); ordered stop extension', '(Route_ID, City_ID) -> Stop_Sequence'],
    ['SALES_LIST', 'agent_name, sales_date, price', 'PK (agent_name, sales_date); FK agent_name', '(Agent_Name, Sales_Date) -> Price; Agent_Name -> Emp_No in original']
  ];
  return <div className="space-y-8"><Link href="/dashboard/dbms" className="inline-flex items-center gap-2 text-sm font-semibold text-black/50 hover:text-transit"><ArrowLeft size={16} /> DBMS studio</Link><div><p className="eyebrow">Academic foundation</p><h1 className="display mt-3 text-5xl font-semibold">Relational schema.</h1><p className="mt-3 max-w-3xl text-sm leading-6 text-black/55">These are the nine recognizable assignment relations. The physical Supabase PostgreSQL schema adds EER subtype and application transaction tables without replacing the academic keys.</p></div><div className="space-y-3">{relations.map(([name, attributes, keys, fd]) => <Panel key={name} className="p-5"><div className="grid gap-4 lg:grid-cols-[180px_1fr_260px]"><div className="flex items-start gap-3"><KeyRound size={17} className="mt-1 text-ember" /><div><p className="font-mono text-sm font-semibold text-transit">{name}</p><p className="mt-2 text-xs text-black/45">Academic relation</p></div></div><div><p className="eyebrow">Attributes</p><p className="mt-2 font-mono text-xs leading-6 text-black/65">{attributes}</p></div><div><p className="eyebrow">Keys & dependency</p><p className="mt-2 text-xs leading-6 text-black/65">{keys}<br />{fd}</p></div></div></Panel>)}</div><Panel className="bg-[#dcebed] p-6"><p className="eyebrow text-transit">Implementation note</p><p className="mt-3 text-sm leading-7 text-black/65">The operational database is Supabase PostgreSQL. Dates are kept as ISO-compatible text where the academic schema names text attributes; identity-backed numeric keys are used only for transactional extension tables. Foreign keys, check constraints, unique indexes, and the normalized SALES_LIST compatibility view are defined in <code>database/schema.sql</code>.</p></Panel></div>;
}
