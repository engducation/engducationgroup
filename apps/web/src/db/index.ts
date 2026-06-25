import { env } from "@/env";
import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";

import * as schema from "./schema";

// Configure Neon to use WebSocket for persistent connections (session mode)
// Required for transactions and better performance
if (typeof window === "undefined") {
  neonConfig.webSocketConstructor = ws;
}

const pool = new Pool({ connectionString: env.DATABASE_URL });
export const db = drizzle(pool, { schema });

// Type alias for transaction client (required for webhook settlement)
export type TransactionClient = Awaited<ReturnType<typeof pool.connect>>;
