const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const connectionString = "postgres://postgres:postgres@localhost:51214/template1?sslmode=disable";
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const db = new PrismaClient({ adapter });

async function main() {
  const configs = await db.agentConfig.findMany({
    include: {
      user: {
        select: {
          email: true,
        }
      }
    }
  });
  console.log("AGENT_CONFIGS:", JSON.stringify(configs, null, 2));

  const now = new Date();
  console.log("Server current Date & Time:", now.toString());
  console.log("Server current hours/minutes (local):", now.getHours(), ":", now.getMinutes());
  console.log("Server current hours/minutes (UTC):", now.getUTCHours(), ":", now.getUTCMinutes());
}
main().catch(console.error).finally(() => db.$disconnect());
