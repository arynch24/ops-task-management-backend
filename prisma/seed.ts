// prisma/seed.ts
import { prisma } from '../src/config/db';

async function main() {
  await prisma.user.createMany({
    data: [
      {
        email: 'ankit.raj4@pw.live',
        firstName: 'Ankit',
        lastName: 'Admin',
        role: 'ADMIN',
      },
      {
        email: 'ankit.sot010020@pwioi.com',
        firstName: 'Ankit',
        lastName: 'Member',
        role: 'MEMBER',
      },
    ],
  });
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());