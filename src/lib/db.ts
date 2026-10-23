import postgres from 'postgres';

type SqlClient = ReturnType<typeof postgres>;

const connectionString = process.env.SUPABASE_DB_URL;
let singleton: SqlClient | undefined;

function requireConnectionString() {
  if (!connectionString) {
    throw new Error('SUPABASE_DB_URL is not configured. Copy .env.example to .env and paste the Supabase Connect connection string.');
  }
  return connectionString;
}

function normalize(statement: string, args: unknown[]) {
  const named = args.length === 1 && args[0] !== null && typeof args[0] === 'object' && !Array.isArray(args[0]);
  const values: unknown[] = [];
  let text = statement;
  if (named) {
    const params = args[0] as Record<string, unknown>;
    text = text.replace(/@([A-Za-z_][A-Za-z0-9_]*)/g, (_, key: string) => {
      values.push(params[key]);
      return `$${values.length}`;
    });
  } else {
    const positional = args.length === 1 && Array.isArray(args[0]) ? args[0] as unknown[] : args;
    let index = 0;
    text = text.replace(/\?/g, () => {
      values.push(positional[index]);
      index += 1;
      return `$${values.length}`;
    });
  }
  return { text, values };
}

class PreparedStatement {
  constructor(private readonly client: SqlClient, private readonly statement: string) {}

  async all<T = Record<string, unknown>>(...args: unknown[]) {
    const { text, values } = normalize(this.statement, args);
    return await this.client.unsafe(text, values as never[]) as unknown as T[];
  }

  async get<T = Record<string, unknown>>(...args: unknown[]) {
    const rows = await this.all<T>(...args);
    return rows[0] as T | undefined;
  }

  async run(...args: unknown[]) {
    const { text, values } = normalize(this.statement, args);
    const result = await this.client.unsafe(text, values as never[]) as unknown as Array<Record<string, unknown>> & { count?: number };
    const first = result[0];
    return {
      changes: result.count ?? result.length,
      lastInsertRowid: first?.booking_id ?? first?.id ?? null
    };
  }
}

export class SupabaseDatabase {
  constructor(private readonly client: SqlClient) {}

  prepare(statement: string) {
    return new PreparedStatement(this.client, statement);
  }

  async transaction<T>(callback: (transactionDb: SupabaseDatabase) => Promise<T>) {
    return await this.client.begin(async (transactionClient) => callback(new SupabaseDatabase(transactionClient as unknown as SqlClient)));
  }
}

export function getDb() {
  if (!singleton) {
    singleton = postgres(requireConnectionString(), {
      prepare: false,
      max: Number(process.env.SUPABASE_DB_POOL_SIZE || 5),
      idle_timeout: 20,
      connect_timeout: 10,
      ssl: 'require'
    });
  }
  return new SupabaseDatabase(singleton);
}

export function getDatabasePath() {
  return 'Supabase Postgres via SUPABASE_DB_URL';
}

export async function closeDbForTests() {
  if (singleton) await singleton.end({ timeout: 2 });
  singleton = undefined;
}
