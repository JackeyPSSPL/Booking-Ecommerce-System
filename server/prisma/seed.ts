import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const adminHash = await bcrypt.hash('Admin@123', 12);
  await prisma.user.upsert({
    where: { email: 'admin@app.com' },
    update: {},
    create: {
      email: 'admin@app.com',
      passwordHash: adminHash,
      role: 'ADMIN',
      emailVerified: true,
      firstName: 'Admin',
      lastName: 'User',
    },
  });

  const partnerHash = await bcrypt.hash('Partner@123', 12);
  await prisma.user.upsert({
    where: { email: 'partner@app.com' },
    update: {},
    create: {
      email: 'partner@app.com',
      passwordHash: partnerHash,
      role: 'PARTNER',
      emailVerified: true,
      firstName: 'Partner',
      lastName: 'User',
    },
  });

  const customerHash = await bcrypt.hash('Customer@123', 12);
  await prisma.user.upsert({
    where: { email: 'customer@app.com' },
    update: {},
    create: {
      email: 'customer@app.com',
      passwordHash: customerHash,
      role: 'CUSTOMER',
      emailVerified: true,
      firstName: 'Test',
      lastName: 'Customer',
    },
  });

  console.log('Seed complete');
  console.log('  admin@app.com    / Admin@123');
  console.log('  partner@app.com  / Partner@123');
  console.log('  customer@app.com / Customer@123');
}

main()
  .catch((error) => { console.error(error); process.exit(1); })
  .finally(() => prisma.$disconnect());
