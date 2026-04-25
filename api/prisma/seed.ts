import {
  PrismaClient,
  UserRole,
  EmployeeBand,
  CrossBorderMovesBand,
  TriggerEvent,
  AccountSource,
  PursuitStatus,
} from '@prisma/client';

const db = new PrismaClient();

async function main() {
  // ── Owner (real password set in Step 2 / auth) ─────────────────
  const owner = await db.user.upsert({
    where: { email: 'steve@mobilitysqr.com' },
    update: {},
    create: {
      email: 'steve@mobilitysqr.com',
      passwordHash: '__set_in_auth_step__',
      firstName: 'Steve',
      lastName: 'W.',
      role: UserRole.ADMIN,
    },
  });

  // ── Sample accounts (representative ICP) ───────────────────────
  const seeds = [
    {
      name: 'Notion Labs',
      domain: 'notion.so',
      website: 'https://www.notion.so',
      hqCountry: 'US',
      hqCity: 'San Francisco',
      industry: 'Software',
      employeeBand: EmployeeBand.B_700_1000,
      crossBorderMovesBand: CrossBorderMovesBand.B_50_250,
      countriesWithEmployees: ['US', 'IE', 'JP', 'KR', 'GB'],
      currentToolingTags: ['Spreadsheets', 'Deel'],
      triggerEvent: TriggerEvent.INTL_HIRING,
      pursuitStatus: PursuitStatus.RESEARCHING,
    },
    {
      name: 'Vercel',
      domain: 'vercel.com',
      website: 'https://vercel.com',
      hqCountry: 'US',
      hqCity: 'San Francisco',
      industry: 'Cloud Infrastructure',
      employeeBand: EmployeeBand.B_250_700,
      crossBorderMovesBand: CrossBorderMovesBand.B_10_50,
      countriesWithEmployees: ['US', 'GB', 'DE', 'NL'],
      currentToolingTags: ['Spreadsheets'],
      triggerEvent: TriggerEvent.NEW_MARKET,
      pursuitStatus: PursuitStatus.NEW,
    },
    {
      name: 'Personio',
      domain: 'personio.com',
      website: 'https://www.personio.com',
      hqCountry: 'DE',
      hqCity: 'Munich',
      industry: 'HR Tech',
      employeeBand: EmployeeBand.B_700_1000,
      crossBorderMovesBand: CrossBorderMovesBand.B_50_250,
      countriesWithEmployees: ['DE', 'GB', 'ES', 'NL', 'IE'],
      currentToolingTags: ['Topia'],
      triggerEvent: TriggerEvent.OUTGREW_TOOL,
      pursuitStatus: PursuitStatus.CONTACTING,
    },
  ];

  for (const seed of seeds) {
    const existing = await db.account.findFirst({ where: { domain: seed.domain } });
    if (existing) {
      await db.account.update({ where: { id: existing.id }, data: seed });
    } else {
      await db.account.create({
        data: { ...seed, source: AccountSource.MANUAL, ownerId: owner.id },
      });
    }
  }

  console.log(`Seeded ${seeds.length} accounts and 1 user.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
