const { applicationDefault, cert, getApps, initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const collections = [
  'employee', 'bus', 'route', 'agent', 'vehicle_type', 'vehicle', 'vehicle_bus', 'mini_bus', 'metro_train',
  'bus_vehicle', 'schedule', 'cities_town', 'route_city', 'ticket', 'sales_list', 'fare_rule', 'passenger',
  'transit_pass', 'pass_purchase', 'trip', 'trip_passenger', 'passenger_booking', 'booking_ticket', 'fare_payment',
  'app_user', 'session', 'service_alert', 'notification', 'audit_log'
];

function getFirebaseDb() {
  const app = getApps().length ? getApps()[0] : initializeApp({
    projectId: process.env.FIREBASE_PROJECT_ID,
    credential: process.env.FIREBASE_SERVICE_ACCOUNT_JSON
      ? cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON))
      : applicationDefault()
  });
  return getFirestore(app);
}

function splitComma(text) {
  const parts = [];
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

function tuples(text) {
  const rows = []; let start = -1; let depth = 0; let quote = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (char === "'" && text[index - 1] !== '\\') quote = !quote;
    if (!quote && char === '(') { if (depth === 0) start = index + 1; depth += 1; }
    if (!quote && char === ')') { depth -= 1; if (depth === 0) { rows.push(text.slice(start, index)); start = -1; } }
  }
  return rows;
}

function literal(token) {
  const text = token.trim();
  if (/^NULL$/i.test(text)) return null;
  const relativeDate = text.match(/CURRENT_DATE\s*\+\s*INTERVAL\s+'(\d+)\s+days?'?/i);
  if (relativeDate) return new Date(Date.now() + Number(relativeDate[1]) * 86_400_000).toISOString().slice(0, 10);
  if (/^CURRENT_DATE/i.test(text)) return new Date().toISOString().slice(0, 10);
  if (/^CURRENT_TIMESTAMP/i.test(text)) return new Date().toISOString();
  if (/^'.*'$/s.test(text)) return text.slice(1, -1).replace(/''/g, "'");
  if (/^-?\d+(\.\d+)?$/.test(text)) return Number(text);
  return text.replace(/::[A-Za-z]+/g, '').replace(/^\(|\)$/g, '').trim();
}

function primaryKey(collection, row) {
  if (collection === 'route_city' || collection === 'sales_list' || collection === 'trip_passenger') return `${row.route_id ?? row.agent_name ?? row.trip_id}__${row.city_id ?? row.sales_date ?? row.passenger_id}`;
  const keys = { passenger_booking: 'booking_id', booking_ticket: 'ticket_id', audit_log: 'audit_id' };
  return String(row[keys[collection] || Object.keys(row)[0]]);
}

function parseSeed(sql) {
  const rows = [];
  const pattern = /INSERT INTO\s+(\w+)\s*\(([^)]+)\)\s*VALUES\s*([\s\S]*?)(?:\nON CONFLICT DO NOTHING)?;/gi;
  for (const match of sql.matchAll(pattern)) {
    const columns = splitComma(match[2]).map((column) => column.trim());
    for (const tuple of tuples(match[3])) {
      const values = splitComma(tuple).map(literal);
      rows.push({ collection: match[1], row: Object.fromEntries(columns.map((column, index) => [column, values[index]])) });
    }
  }
  return rows;
}

async function writeRows(db, rows) {
  let batch = db.batch(); let count = 0;
  for (const { collection, row } of rows) {
    const id = primaryKey(collection, row);
    batch.set(db.collection(collection).doc(id), row);
    count += 1;
    if (count % 400 === 0) { await batch.commit(); batch = db.batch(); }
  }
  if (count % 400 !== 0) await batch.commit();
}

module.exports = { collections, getFirebaseDb, parseSeed, writeRows, primaryKey };
