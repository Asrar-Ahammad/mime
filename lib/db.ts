import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};


const createPrismaClient = () => {
  const connectionString = process.env.DATABASE_URL;
  // Limit connection pool size to 1 in serverless/lambda environments
  // to avoid hitting the Supabase Pooler session client limit (max 15 clients).
  const pool = new Pool({ 
    connectionString,
    max: 1,
    idleTimeoutMillis: 15000,
    connectionTimeoutMillis: 2000,
  });
  const adapter = new PrismaPg(pool);
  
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["query"] : [],
  });
};

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
