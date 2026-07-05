import { db } from './lib/db';

async function main() {
  const letters = await db.application.findMany({
    where: {
      coverLetter: {
        not: null
      }
    },
    select: {
      id: true,
      company: true,
      jobTitle: true,
      coverLetter: true
    }
  });
  console.log("=== Cover Letters in DB ===");
  console.log(letters);
}
main().finally(() => db.$disconnect());
