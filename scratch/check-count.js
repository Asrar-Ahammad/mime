const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");

let databaseUrl = "";
for (const envFile of [".env.local", ".env"]) {
  const envPath = path.join(__dirname, "..", envFile);
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, "utf-8");
    const match = content.match(/^DATABASE_URL=["']?([^"'\r\n]+)["']?/m);
    if (match) {
      databaseUrl = match[1];
      break;
    }
  }
}

const pool = new Pool({ connectionString: databaseUrl });

async function main() {
  const res = await pool.query("SELECT COUNT(*) FROM \"EmailThread\"");
  console.log("Count in EmailThread:", res.rows[0]);
}

main()
  .catch(e => console.error(e))
  .finally(() => pool.end());
