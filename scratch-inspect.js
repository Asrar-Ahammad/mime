const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const connectionString = "postgres://postgres:postgres@localhost:51214/template1?sslmode=disable";
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const db = new PrismaClient({ adapter });

async function main() {
  const accounts = await db.account.findMany();
  console.log("ACCOUNTS:", accounts.map(a => ({
    userId: a.userId,
    provider: a.provider,
    has_access_token: !!a.access_token,
    has_refresh_token: !!a.refresh_token,
    scope: a.scope,
  })));
}
main().catch(console.error).finally(() => db.$disconnect());
