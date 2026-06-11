import { env } from "@/env";
import { neon, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import ws from "ws";

import * as schema from "./schema";

// Configure Neon to use WebSocket for persistent connections (session mode)
if (typeof window === "undefined") {
  neonConfig.webSocketConstructor = ws;
}

export const sql = neon(env.DATABASE_URL);
export const db = drizzle(env.DATABASE_URL, { schema });

// Type alias for transaction support
export type TransactionClient = typeof db;
