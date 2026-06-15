import { db } from './lib/db';

async function main() {
  const apps = await db.application.findMany({
    select: { id: true, status: true, appliedAt: true, createdAt: true, updatedAt: true }
  });
  console.log(apps);
}
main().finally(() => db.$disconnect());
