import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// drizzle-orm 1.0: the schema is consumed by the Better Auth adapter
// (see lib/auth.ts). Tables are imported directly from db/schema.ts for
// application queries.
export const db = drizzle({ client: pool });
