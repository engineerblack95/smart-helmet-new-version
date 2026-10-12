// ==================================================
// Smart Helmet System — Database Seed
// ==================================================
// Creates:
//   - 3 users (admin, owner, rider)
//   - 1 helmet (H001)
//   - 1 bike (B001)
//   - Device API keys for H001 & B001
// ==================================================

import pkg from '@prisma/client';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

const { PrismaClient } = pkg;
const prisma = new PrismaClient();

const generateApiKey = () => crypto.randomBytes(32).toString('hex');

async function main() {
  console.log('\n==================================================');
  console.log('  Smart Helmet System — Seeding Database');
  console.log('==================================================\n');

  // ---------- USERS ----------
  const adminPassword = await bcrypt.hash('admin123', 10);
  const ownerPassword = await bcrypt.hash('owner123', 10);
  const riderPassword = await bcrypt.hash('rider123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@smarthelmet.com' },
    update: {},
    create: {
      email: 'admin@smarthelmet.com',
      passwordHash: adminPassword,
      fullName: 'System Administrator',
      phone: '+250788000001',
      role: 'ADMIN',
    },
  });

  const owner = await prisma.user.upsert({
    where: { email: 'owner@smarthelmet.com' },
    update: {},
    create: {
      email: 'owner@smarthelmet.com',
      passwordHash: ownerPassword,
      fullName: 'Bike Owner',
      phone: '+250788000002',
      role: 'OWNER',
    },
  });

  const rider = await prisma.user.upsert({
    where: { email: 'rider@smarthelmet.com' },
    update: {},
    create: {
      email: 'rider@smarthelmet.com',
      passwordHash: riderPassword,
      fullName: 'Test Rider',
      phone: '+250788000003',
      role: 'RIDER',
    },
  });

  console.log('✅ Users created:');
  console.log(`   - ${admin.email}  (ADMIN)`);
  console.log(`   - ${owner.email}  (OWNER)`);
  console.log(`   - ${rider.email}  (RIDER)\n`);

  // ---------- HELMET ----------
  const helmet = await prisma.helmet.upsert({
    where: { helmetCode: 'H001' },
    update: {},
    create: {
      helmetCode: 'H001',
      ownerId: rider.id,
      batteryLevel: 100,
      status: 'OFFLINE',
      firmwareVer: '1.0.0',
    },
  });

  console.log(`✅ Helmet created: ${helmet.helmetCode} (owner: ${rider.email})\n`);

  // ---------- BIKE ----------
  const bike = await prisma.bike.upsert({
    where: { bikeCode: 'B001' },
    update: {},
    create: {
      bikeCode: 'B001',
      plateNumber: 'RAB 123 A',
      ownerId: owner.id,
      helmetId: helmet.id,
      status: 'OFFLINE',
      firmwareVer: '1.0.0',
    },
  });

  console.log(`✅ Bike created: ${bike.bikeCode} (plate: ${bike.plateNumber}, paired to ${helmet.helmetCode})\n`);

  // ---------- DEVICE KEYS ----------
  const helmetApiKey = generateApiKey();
  const bikeApiKey = generateApiKey();

  await prisma.deviceKey.upsert({
    where: { deviceCode: 'H001' },
    update: { apiKey: helmetApiKey, isActive: true },
    create: {
      deviceCode: 'H001',
      apiKey: helmetApiKey,
      deviceType: 'HELMET',
      isActive: true,
    },
  });

  await prisma.deviceKey.upsert({
    where: { deviceCode: 'B001' },
    update: { apiKey: bikeApiKey, isActive: true },
    create: {
      deviceCode: 'B001',
      apiKey: bikeApiKey,
      deviceType: 'BIKE',
      isActive: true,
    },
  });

  console.log('==================================================');
  console.log('  DEVICE API KEYS (copy these into firmware!)');
  console.log('==================================================');
  console.log(`  H001 (Helmet):  ${helmetApiKey}`);
  console.log(`  B001 (Bike):    ${bikeApiKey}`);
  console.log('==================================================\n');

  console.log('==================================================');
  console.log('  LOGIN CREDENTIALS');
  console.log('==================================================');
  console.log('  ADMIN:  admin@smarthelmet.com  / admin123');
  console.log('  OWNER:  owner@smarthelmet.com  / owner123');
  console.log('  RIDER:  rider@smarthelmet.com  / rider123');
  console.log('==================================================\n');

  console.log('✅ Seeding complete.\n');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });