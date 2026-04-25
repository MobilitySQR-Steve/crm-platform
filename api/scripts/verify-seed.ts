import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

async function main() {
  const userCount = await db.user.count();
  const accounts = await db.account.findMany({
    select: {
      name: true,
      domain: true,
      hqCountry: true,
      employeeBand: true,
      crossBorderMovesBand: true,
      pursuitStatus: true,
    },
    orderBy: { name: 'asc' },
  });
  console.log('users:', userCount);
  console.log('accounts:');
  console.table(accounts);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
