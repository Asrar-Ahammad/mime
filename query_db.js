const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const apps = await prisma.application.findMany({
    select: { id: true, status: true, appliedAt: true, createdAt: true }
  });
  console.log(apps);
}
main().finally(() => prisma.$disconnect());
