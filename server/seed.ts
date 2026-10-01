import { connectDB, getInitialSeedData, db } from './db';

async function runSeed() {
  console.log('Seeding College Event Portal database...');
  await connectDB();
  const seedData = getInitialSeedData();
  console.log(`Seed completed: ${seedData.initialUsers.length} users, ${seedData.initialEvents.length} events, ${seedData.initialRegistrations.length} registrations.`);
  process.exit(0);
}

runSeed().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});
