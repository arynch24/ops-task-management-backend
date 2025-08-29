// prisma/seed.ts
import { prisma } from '../src/config/db';

async function main() {
  await prisma.users.createMany({
    data: [
      {
        email: 'aryan.chauhan@pw.live',
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
      },
      {
        email: 'aryan.sot010025@pwioi.com',
        firstName: 'Member',
        lastName: 'User',
        role: 'member',
      },
    ],
  });
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());