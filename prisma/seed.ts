// prisma/seed.ts
import { prisma } from '../src/config/db';

async function main() {
  await prisma.user.createMany({
    data: [
      {
        email: 'aryan.chauhan@pw.live',
        firstName: 'Admin',
        lastName: 'User',
        role: 'ADMIN',
      },
      {
        email: 'aryan.sot010025@pwioi.com',
        firstName: 'Member',
        lastName: 'User',
        role: 'MEMBER',
      },
    ],
  });
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());