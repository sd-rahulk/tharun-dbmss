import alasql from 'alasql';
import { applicationDefault, cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore, type Firestore, type Transaction } from 'firebase-admin/firestore';

export const FIRESTORE_COLLECTIONS = [
  'employee', 'bus', 'route', 'agent', 'vehicle_type', 'vehicle', 'vehicle_bus', 'mini_bus', 'metro_train',
  'bus_vehicle', 'schedule', 'cities_town', 'route_city', 'ticket', 'sales_list', 'fare_rule', 'passenger',
  'transit_pass', 'pass_purchase', 'trip', 'trip_passenger', 'passenger_booking', 'booking_ticket', 'fare_payment',
  'app_user', 'session', 'service_alert', 'notification', 'audit_log'
] as const;

export const FIRESTORE_SCHEMA: Record<string, { columns: Array<{ name: string; type: string; pk?: boolean }>; foreignKeys: Array<{ from_column: string; table_name: string; to_column: string }>; indexes: string[] }> = {
  employee: { columns: [{ name: 'emp_no', type: 'string', pk: true }, { name: 'emp_name', type: 'string' }, { name: 'emp_address', type: 'string' }, { name: 'emp_role', type: 'string' }], foreignKeys: [], indexes: [] },
  bus: { columns: [{ name: 'bus_no', type: 'string', pk: true }, { name: 'seat', type: 'number' }, { name: 'emp_no', type: 'string' }, { name: 'status', type: 'string' }], foreignKeys: [{ from_column: 'emp_no', table_name: 'employee', to_column: 'emp_no' }], indexes: [] },
  route: { columns: [{ name: 'route_id', type: 'string', pk: true }, { name: 'route_description', type: 'string' }, { name: 'duration', type: 'number' }, { name: 'mode', type: 'string' }, { name: 'status', type: 'string' }], foreignKeys: [], indexes: [] },
  agent: { columns: [{ name: 'agent_name', type: 'string', pk: true }, { name: 'location', type: 'string' }, { name: 'travel_time', type: 'string' }, { name: 'emp_no', type: 'string' }], foreignKeys: [{ from_column: 'emp_no', table_name: 'employee', to_column: 'emp_no' }], indexes: [] },
  vehicle_type: { columns: [{ name: 'type_id', type: 'string', pk: true }, { name: 'type_name', type: 'string' }, { name: 'description', type: 'string' }], foreignKeys: [], indexes: [] },
  vehicle: { columns: [{ name: 'vehicle_id', type: 'string', pk: true }, { name: 'reg_no', type: 'string' }, { name: 'model', type: 'string' }, { name: 'capacity', type: 'number' }, { name: 'type_id', type: 'string' }, { name: 'route_id', type: 'string' }, { name: 'subtype', type: 'string' }, { name: 'status', type: 'string' }], foreignKeys: [{ from_column: 'type_id', table_name: 'vehicle_type', to_column: 'type_id' }, { from_column: 'route_id', table_name: 'route', to_column: 'route_id' }], indexes: [] },
  vehicle_bus: { columns: [{ name: 'vehicle_id', type: 'string', pk: true }, { name: 'no_of_seats', type: 'number' }, { name: 'engine_type', type: 'string' }], foreignKeys: [{ from_column: 'vehicle_id', table_name: 'vehicle', to_column: 'vehicle_id' }], indexes: [] },
  mini_bus: { columns: [{ name: 'vehicle_id', type: 'string', pk: true }, { name: 'no_of_seats', type: 'number' }, { name: 'ac_non_ac', type: 'string' }], foreignKeys: [{ from_column: 'vehicle_id', table_name: 'vehicle', to_column: 'vehicle_id' }], indexes: [] },
  metro_train: { columns: [{ name: 'vehicle_id', type: 'string', pk: true }, { name: 'no_of_coaches', type: 'number' }, { name: 'system_type', type: 'string' }], foreignKeys: [{ from_column: 'vehicle_id', table_name: 'vehicle', to_column: 'vehicle_id' }], indexes: [] },
  bus_vehicle: { columns: [{ name: 'bus_no', type: 'string', pk: true }, { name: 'vehicle_id', type: 'string' }], foreignKeys: [{ from_column: 'bus_no', table_name: 'bus', to_column: 'bus_no' }, { from_column: 'vehicle_id', table_name: 'vehicle', to_column: 'vehicle_id' }], indexes: [] },
  schedule: { columns: [{ name: 'schedule_id', type: 'string', pk: true }, { name: 'departure_date', type: 'string' }, { name: 'departure_time', type: 'string' }, { name: 'route_id', type: 'string' }, { name: 'bus_no', type: 'string' }, { name: 'emp_no', type: 'string' }, { name: 'vehicle_id', type: 'string' }, { name: 'status', type: 'string' }], foreignKeys: [{ from_column: 'route_id', table_name: 'route', to_column: 'route_id' }, { from_column: 'bus_no', table_name: 'bus', to_column: 'bus_no' }, { from_column: 'emp_no', table_name: 'employee', to_column: 'emp_no' }, { from_column: 'vehicle_id', table_name: 'vehicle', to_column: 'vehicle_id' }], indexes: ['departure_date, departure_time', 'route_id', 'vehicle_id'] },
  cities_town: { columns: [{ name: 'city_id', type: 'string', pk: true }, { name: 'bus_stop', type: 'string' }, { name: 'near', type: 'string' }], foreignKeys: [], indexes: [] },
  route_city: { columns: [{ name: 'route_id', type: 'string', pk: true }, { name: 'city_id', type: 'string', pk: true }, { name: 'stop_sequence', type: 'number' }], foreignKeys: [{ from_column: 'route_id', table_name: 'route', to_column: 'route_id' }, { from_column: 'city_id', table_name: 'cities_town', to_column: 'city_id' }], indexes: ['route_id, stop_sequence'] },
  ticket: { columns: [{ name: 'ticket_number', type: 'string', pk: true }, { name: 'schedule_id', type: 'string' }, { name: 'agent_name', type: 'string' }], foreignKeys: [{ from_column: 'schedule_id', table_name: 'schedule', to_column: 'schedule_id' }, { from_column: 'agent_name', table_name: 'agent', to_column: 'agent_name' }], indexes: ['schedule_id'] },
  sales_list: { columns: [{ name: 'agent_name', type: 'string', pk: true }, { name: 'sales_date', type: 'string', pk: true }, { name: 'price', type: 'number' }], foreignKeys: [{ from_column: 'agent_name', table_name: 'agent', to_column: 'agent_name' }], indexes: [] },
  fare_rule: { columns: [{ name: 'fare_rule_id', type: 'string', pk: true }, { name: 'route_id', type: 'string' }, { name: 'base_fare_minor', type: 'number' }, { name: 'per_stop_minor', type: 'number' }], foreignKeys: [{ from_column: 'route_id', table_name: 'route', to_column: 'route_id' }], indexes: ['route_id'] },
  passenger: { columns: [{ name: 'passenger_id', type: 'string', pk: true }, { name: 'name', type: 'string' }, { name: 'gender', type: 'string' }, { name: 'phone', type: 'string' }], foreignKeys: [], indexes: ['phone'] },
  transit_pass: { columns: [{ name: 'pass_id', type: 'string', pk: true }, { name: 'pass_type', type: 'string' }, { name: 'validity_days', type: 'number' }, { name: 'price_minor', type: 'number' }], foreignKeys: [], indexes: [] },
  pass_purchase: { columns: [{ name: 'purchase_id', type: 'string', pk: true }, { name: 'passenger_id', type: 'string' }, { name: 'pass_id', type: 'string' }, { name: 'purchase_date', type: 'string' }, { name: 'valid_from', type: 'string' }, { name: 'valid_until', type: 'string' }, { name: 'status', type: 'string' }], foreignKeys: [{ from_column: 'passenger_id', table_name: 'passenger', to_column: 'passenger_id' }, { from_column: 'pass_id', table_name: 'transit_pass', to_column: 'pass_id' }], indexes: ['passenger_id', 'status'] },
  trip: { columns: [{ name: 'trip_id', type: 'string', pk: true }, { name: 'travel_date', type: 'string' }, { name: 'boarding_time', type: 'string' }, { name: 'alighting_time', type: 'string' }, { name: 'schedule_id', type: 'string' }, { name: 'boarding_city_id', type: 'string' }, { name: 'destination_city_id', type: 'string' }, { name: 'status', type: 'string' }], foreignKeys: [{ from_column: 'schedule_id', table_name: 'schedule', to_column: 'schedule_id' }], indexes: ['travel_date'] },
  trip_passenger: { columns: [{ name: 'trip_id', type: 'string', pk: true }, { name: 'passenger_id', type: 'string', pk: true }], foreignKeys: [{ from_column: 'trip_id', table_name: 'trip', to_column: 'trip_id' }, { from_column: 'passenger_id', table_name: 'passenger', to_column: 'passenger_id' }], indexes: ['passenger_id'] },
  passenger_booking: { columns: [{ name: 'booking_id', type: 'number', pk: true }, { name: 'booking_reference', type: 'string' }, { name: 'passenger_id', type: 'string' }, { name: 'schedule_id', type: 'string' }, { name: 'boarding_city_id', type: 'string' }, { name: 'destination_city_id', type: 'string' }, { name: 'quantity', type: 'number' }, { name: 'total_fare_minor', type: 'number' }, { name: 'status', type: 'string' }, { name: 'created_at', type: 'string' }, { name: 'cancelled_at', type: 'string' }], foreignKeys: [{ from_column: 'passenger_id', table_name: 'passenger', to_column: 'passenger_id' }, { from_column: 'schedule_id', table_name: 'schedule', to_column: 'schedule_id' }], indexes: ['passenger_id, status', 'schedule_id, status'] },
  booking_ticket: { columns: [{ name: 'ticket_id', type: 'number', pk: true }, { name: 'ticket_number', type: 'string' }, { name: 'booking_id', type: 'number' }, { name: 'passenger_id', type: 'string' }, { name: 'schedule_id', type: 'string' }, { name: 'seat_number', type: 'string' }, { name: 'status', type: 'string' }], foreignKeys: [{ from_column: 'booking_id', table_name: 'passenger_booking', to_column: 'booking_id' }, { from_column: 'passenger_id', table_name: 'passenger', to_column: 'passenger_id' }, { from_column: 'schedule_id', table_name: 'schedule', to_column: 'schedule_id' }], indexes: ['schedule_id, seat_number', 'booking_id'] },
  fare_payment: { columns: [{ name: 'payment_id', type: 'string', pk: true }, { name: 'trip_id', type: 'string' }, { name: 'booking_id', type: 'number' }, { name: 'amount', type: 'number' }, { name: 'payment_method', type: 'string' }, { name: 'payment_status', type: 'string' }, { name: 'paid_at', type: 'string' }, { name: 'transaction_reference', type: 'string' }], foreignKeys: [{ from_column: 'trip_id', table_name: 'trip', to_column: 'trip_id' }, { from_column: 'booking_id', table_name: 'passenger_booking', to_column: 'booking_id' }], indexes: ['payment_status'] },
  app_user: { columns: [{ name: 'user_id', type: 'string', pk: true }, { name: 'email', type: 'string' }, { name: 'password_hash', type: 'string' }, { name: 'role', type: 'string' }, { name: 'passenger_id', type: 'string' }, { name: 'agent_name', type: 'string' }, { name: 'display_name', type: 'string' }, { name: 'status', type: 'string' }, { name: 'created_at', type: 'string' }], foreignKeys: [{ from_column: 'passenger_id', table_name: 'passenger', to_column: 'passenger_id' }, { from_column: 'agent_name', table_name: 'agent', to_column: 'agent_name' }], indexes: ['email'] },
  session: { columns: [{ name: 'session_token_hash', type: 'string', pk: true }, { name: 'user_id', type: 'string' }, { name: 'expires_at', type: 'string' }], foreignKeys: [{ from_column: 'user_id', table_name: 'app_user', to_column: 'user_id' }], indexes: ['expires_at'] },
  service_alert: { columns: [{ name: 'alert_id', type: 'string', pk: true }, { name: 'title', type: 'string' }, { name: 'message', type: 'string' }, { name: 'severity', type: 'string' }, { name: 'route_id', type: 'string' }, { name: 'active_from', type: 'string' }, { name: 'active_until', type: 'string' }], foreignKeys: [{ from_column: 'route_id', table_name: 'route', to_column: 'route_id' }], indexes: ['active_from', 'active_until'] },
  notification: { columns: [{ name: 'notification_id', type: 'string', pk: true }, { name: 'user_id', type: 'string' }, { name: 'title', type: 'string' }, { name: 'message', type: 'string' }, { name: 'read_at', type: 'string' }, { name: 'created_at', type: 'string' }], foreignKeys: [{ from_column: 'user_id', table_name: 'app_user', to_column: 'user_id' }], indexes: [] },
  audit_log: { columns: [{ name: 'audit_id', type: 'number', pk: true }, { name: 'user_id', type: 'string' }, { name: 'action', type: 'string' }, { name: 'entity_name', type: 'string' }, { name: 'entity_id', type: 'string' }, { name: 'details', type: 'string' }, { name: 'created_at', type: 'string' }], foreignKeys: [{ from_column: 'user_id', table_name: 'app_user', to_column: 'user_id' }], indexes: [] }
};

type Row = Record<string, any>;
type State = Map<string, Map<string, Row>>;
type Client = Firestore | Transaction;

let firestoreSingleton: Firestore | undefined;

function firestore() {
  if (!firestoreSingleton) {
    const apps = getApps();
    const app = apps.length ? apps[0] : initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID,
      credential: process.env.FIREBASE_SERVICE_ACCOUNT_JSON
        ? cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON))
        : applicationDefault()
    });
    firestoreSingleton = getFirestore(app);
  }
  return firestoreSingleton;
}

function today() { return new Date().toISOString().slice(0, 10); }
function now() { return new Date().toISOString(); }
function primaryKey(collection: string, row: Row) {
  if (collection === 'route_city' || collection === 'sales_list' || collection === 'trip_passenger') return `${row.route_id ?? row.agent_name ?? row.trip_id}__${row.city_id ?? row.sales_date ?? row.passenger_id}`;
  return String(row[FIRESTORE_SCHEMA[collection]?.columns.find((column) => column.pk)?.name ?? 'id']);
}

function cloneState(state: State): State {
  return new Map([...state].map(([collection, rows]) => [collection, new Map([...rows].map(([id, row]) => [id, { ...row }]))]));
}

async function loadState(client: Client = firestore()): Promise<State> {
  const state: State = new Map();
  for (const collection of FIRESTORE_COLLECTIONS) {
    const snapshot = typeof (client as Firestore).collection === 'function'
      ? await (client as Firestore).collection(collection).get()
      : await (client as Transaction).get(firestore().collection(collection));
    state.set(collection, new Map(snapshot.docs.map((doc: any) => [doc.id, { ...doc.data() }])));
  }
  const sales = state.get('sales_list') ?? new Map<string, Row>();
  const agents = state.get('agent') ?? new Map<string, Row>();
  state.set('sales_list_original_view', new Map([...sales].map(([id, row]) => [id, { ...row, emp_no: agents.get(String(row.agent_name))?.emp_no ?? null }])));
  return state;
}

function splitComma(text: string) {
  const parts: string[] = [];
  let start = 0; let depth = 0; let quote = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (char === "'" && text[index - 1] !== '\\') quote = !quote;
    if (!quote && char === '(') depth += 1;
    if (!quote && char === ')') depth -= 1;
    if (!quote && depth === 0 && char === ',') { parts.push(text.slice(start, index).trim()); start = index + 1; }
  }
  parts.push(text.slice(start).trim());
  return parts;
}

function paramsFromArgs(args: unknown[]) {
  const named = args.length === 1 && args[0] && typeof args[0] === 'object' && !Array.isArray(args[0]);
  return { named, source: named ? args[0] as Record<string, unknown> : undefined, values: named ? [] : (args.length === 1 && Array.isArray(args[0]) ? args[0] as unknown[] : args) };
}

function bindNamed(sql: string, args: unknown[]) {
  const params = paramsFromArgs(args); const values = [...params.values]; let index = 0;
  const bound = sql.replace(/@([A-Za-z_][A-Za-z0-9_]*)/g, (_, key: string) => { values.push(params.source?.[key]); return '?'; }).replace(/\?/g, () => {
    if (index < (params.named ? values.length - Object.keys(params.source ?? {}).length : values.length)) { const value = values[index]; index += 1; return '?'; }
    return '?';
  });
  return { sql: bound, values: params.named ? Object.values(params.source ?? {}) : values };
}

function tablesForQuery(sql: string, state: State) {
  const tables: Row[][] = [];
  const transformed = sql.replace(/\b(FROM|JOIN)\s+([A-Za-z_][A-Za-z0-9_]*)\b/gi, (full, keyword: string, name: string) => {
    if (!state.has(name)) throw new Error(`Unknown Firestore collection: ${name}`);
    tables.push([...state.get(name)!.values()]);
    return `${keyword} ?`;
  });
  return { sql: transformed, tables };
}

function normalizeReadSql(sql: string) {
  return sql.replace(/CURRENT_DATE::(?:text|date)|CURRENT_DATE/gi, `'${today()}'`)
    .replace(/CURRENT_TIMESTAMP/gi, `'${now()}'`)
    .replace(/::(?:text|date|integer|numeric|bigint)/gi, '')
    .replace(/COUNT\(([^)]+)\)\s+FILTER\s*\(WHERE\s+([^\)]+)\)/gi, 'COUNT(CASE WHEN $2 THEN $1 END)')
    .replace(/STRING_AGG\(([^,]+),\s*'([^']*)'\s+ORDER BY\s+[^)]+\)/gi, "GROUP_CONCAT($1, '$2')");
}

function executeRead(sql: string, args: unknown[], state: State) {
  const normalized = normalizeReadSql(sql);
  const bound = bindNamed(normalized, args);
  const tables = tablesForQuery(bound.sql, state);
  return alasql(tables.sql, [...tables.tables, ...bound.values]) as Row[];
}

function valueFromToken(token: string, values: unknown[], cursor: { index: number }) {
  const text = token.trim();
  if (text === '?') return values[cursor.index++];
  if (/^CURRENT_TIMESTAMP/i.test(text)) return now();
  if (/^CURRENT_DATE/i.test(text)) {
    const match = text.match(/\?::integer/);
    if (match) return new Date(Date.now() + Number(values[cursor.index++]) * 86_400_000).toISOString().slice(0, 10);
    return today();
  }
  if (/^NULL$/i.test(text)) return null;
  if (/^DEFAULT$/i.test(text)) return null;
  if (/^'.*'$/s.test(text)) return text.slice(1, -1).replace(/''/g, "'");
  if (/^-?\d+(\.\d+)?$/.test(text)) return Number(text);
  return text.replace(/::[A-Za-z]+/g, '').replace(/^\(|\)$/g, '').trim();
}

function checkUnique(collection: string, row: Row, rows: Map<string, Row>) {
  const uniqueFields: Record<string, string[]> = { app_user: ['email'], passenger: ['phone'], vehicle: ['reg_no'], fare_payment: ['transaction_reference'], passenger_booking: ['booking_reference'], booking_ticket: ['ticket_number'] };
  for (const field of uniqueFields[collection] ?? []) if (row[field] != null && [...rows.values()].some((existing) => existing[field] === row[field])) throw new Error(`duplicate key value violates unique constraint ${collection}.${field}`);
  const id = primaryKey(collection, row);
  if (rows.has(id)) throw new Error(`duplicate key value violates primary key ${collection}`);
  return id;
}

function whereMatches(row: Row, where: string, values: unknown[], cursor: { index: number }, state: State) {
  const inSelect = where.match(/(\w+)\s+IN\s*\(\s*SELECT\s+(\w+)\s+FROM\s+(\w+)\s+WHERE\s+(\w+)\s*=\s*\?\s*\)/i);
  if (inSelect) {
    const selected = [...(state.get(inSelect[3])?.values() ?? [])].filter((candidate) => candidate[inSelect[4]] === values[cursor.index++]).map((candidate) => candidate[inSelect[2]]);
    return selected.includes(row[inSelect[1]]);
  }
  return where.split(/\s+AND\s+/i).every((condition) => {
    const match = condition.trim().match(/^([\w.]+)\s*(=|<>|IS\s+NULL|IS\s+NOT\s+NULL|LIKE)\s*(.*)$/i);
    if (!match) return true;
    const field = match[1].split('.').pop()!; const operator = match[2].toUpperCase();
    if (operator === 'IS NULL') return row[field] == null;
    if (operator === 'IS NOT NULL') return row[field] != null;
    const expected = valueFromToken(match[3], values, cursor);
    if (operator === 'LIKE') return String(row[field] ?? '').includes(String(expected).replace(/%/g, ''));
    return operator === '<>' ? row[field] !== expected : row[field] === expected;
  });
}

function mutate(state: State, statement: string, args: unknown[]) {
  const sql = statement.trim().replace(/;$/, '');
  if (/^SET\s+TRANSACTION\s+READ\s+ONLY$/i.test(sql)) return { changes: 0, lastInsertRowid: null };
  const values = paramsFromArgs(args).values as unknown[]; const cursor = { index: 0 };
  const insert = sql.match(/^INSERT\s+INTO\s+(\w+)\s*\(([^)]+)\)\s*VALUES\s*\((.*)\)\s*(?:RETURNING\s+([\w, ]+))?$/is);
  if (insert) {
    const collection = insert[1]; const columns = splitComma(insert[2]).map((column) => column.trim()); const row: Row = {};
    splitComma(insert[3]).forEach((token, index) => { row[columns[index]] = valueFromToken(token, values, cursor); });
    if (['passenger_booking', 'booking_ticket', 'audit_log'].includes(collection)) row[collection === 'passenger_booking' ? 'booking_id' : collection === 'booking_ticket' ? 'ticket_id' : 'audit_id'] = Math.max(0, ...[...(state.get(collection)?.values() ?? [])].map((item) => Number(item[collection === 'passenger_booking' ? 'booking_id' : collection === 'booking_ticket' ? 'ticket_id' : 'audit_id']) || 0)) + 1;
    const rows = state.get(collection); if (!rows) throw new Error(`Unknown Firestore collection: ${collection}`); const id = checkUnique(collection, row, rows); rows.set(id, row);
    return { changes: 1, lastInsertRowid: row.booking_id ?? row.id ?? null };
  }
  const update = sql.match(/^UPDATE\s+(\w+)\s+SET\s+(.+?)\s+WHERE\s+(.+)$/is);
  if (update) {
    const rows = state.get(update[1]); if (!rows) throw new Error(`Unknown Firestore collection: ${update[1]}`); const assignments = splitComma(update[2]); const changed: Row[] = [];
    const whereStart = cursor.index;
    for (const row of rows.values()) { const local = { index: whereStart }; if (whereMatches(row, update[3], values, local, state)) { const assignmentCursor = { index: whereStart }; for (const assignment of assignments) { const [field, token] = assignment.split(/\s*=\s*/); row[field.trim()] = valueFromToken(token, values, assignmentCursor); } changed.push(row); } }
    return { changes: changed.length, lastInsertRowid: null };
  }
  const deletion = sql.match(/^DELETE\s+FROM\s+(\w+)\s+WHERE\s+(.+)$/is);
  if (deletion) {
    const rows = state.get(deletion[1]); if (!rows) throw new Error(`Unknown Firestore collection: ${deletion[1]}`); const deleted: string[] = [];
    const whereStart = cursor.index;
    for (const [id, row] of rows) { const local = { index: whereStart }; if (whereMatches(row, deletion[2], values, local, state)) deleted.push(id); }
    deleted.forEach((id) => rows.delete(id)); return { changes: deleted.length, lastInsertRowid: null };
  }
  throw new Error('Unsupported Firestore mutation. Use application services for writes.');
}

async function commitDiff(client: Transaction, before: State, after: State) {
  for (const collection of FIRESTORE_COLLECTIONS) {
    const previous = before.get(collection)!; const current = after.get(collection)!;
    for (const [id, row] of current) if (JSON.stringify(previous.get(id)) !== JSON.stringify(row)) client.set(firestore().collection(collection).doc(id), row);
    for (const id of previous.keys()) if (!current.has(id)) client.delete(firestore().collection(collection).doc(id));
  }
}

class PreparedStatement {
  constructor(private readonly database: FirebaseDatabase, private readonly statement: string) {}
  async all<T = Row>(...args: unknown[]) { const state = this.database.state ?? await loadState(); return executeRead(this.statement, args, state) as T[]; }
  async get<T = Row>(...args: unknown[]) { return (await this.all<T>(...args))[0] as T | undefined; }
  async run(...args: unknown[]): Promise<{ changes: number; lastInsertRowid: unknown }> { if (this.database.state) return mutate(this.database.state, this.statement, args); return this.database.mutate(this.statement, args); }
}

export class FirebaseDatabase {
  constructor(private readonly client: Firestore, private readonly transactionClient?: Transaction, readonly state?: State) {}
  prepare(statement: string) { return new PreparedStatement(this, statement); }
  async mutate(statement: string, args: unknown[]): Promise<{ changes: number; lastInsertRowid: unknown }> { return this.transaction(async (tx) => tx.prepare(statement).run(...args)); }
  async transaction<T>(callback: (transactionDb: FirebaseDatabase) => Promise<T>) {
    if (this.transactionClient) return callback(this);
    return this.client.runTransaction(async (transaction) => {
      const before = await loadState(transaction); const after = cloneState(before); const tx = new FirebaseDatabase(this.client, transaction, after); const result = await callback(tx); await commitDiff(transaction, before, after); return result;
    });
  }
}

export function getDb() { return new FirebaseDatabase(firestore()); }
export function getFirestoreAdmin() { return firestore(); }
export function getDatabasePath() { return `Firebase Firestore project ${process.env.FIREBASE_PROJECT_ID ?? '(configured by credentials)'}`; }
export async function closeDbForTests() { firestoreSingleton = undefined; }
