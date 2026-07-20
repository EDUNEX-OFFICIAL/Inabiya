import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/** Baseline roles from Rules.md §9.5 / Phases Phase 0 */
const ROLES: Array<{ code: string; name: string; description: string }> = [
  { code: 'CUSTOMER', name: 'Customer', description: 'Gift commerce customer' },
  { code: 'COMMERCE_ADMIN', name: 'Commerce Admin', description: 'Commerce operations admin' },
  { code: 'CONTENT_ADMIN', name: 'Content Admin', description: 'Editorial operations admin' },
  { code: 'WRITER', name: 'Writer', description: 'Editorial writer' },
  { code: 'SEO_EDITOR', name: 'SEO Editor', description: 'SEO review gate' },
  { code: 'MEDICAL_REVIEWER', name: 'Medical Reviewer', description: 'Medical review gate' },
  { code: 'CREATOR', name: 'Creator', description: 'Creator Collective creator' },
  { code: 'BRAND', name: 'Brand', description: 'Creator Collective brand' },
  { code: 'FINANCE', name: 'Finance', description: 'Finance / payouts' },
  { code: 'SUPPORT', name: 'Support', description: 'Customer support' },
  { code: 'SUPER_ADMIN', name: 'Super Admin', description: 'Platform super administrator' },
];

async function main() {
  for (const role of ROLES) {
    await prisma.role.upsert({
      where: { code: role.code },
      update: { name: role.name, description: role.description },
      create: role,
    });
  }
  console.log(`Seeded ${ROLES.length} baseline roles`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
