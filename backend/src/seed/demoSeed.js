const { connectDatabase } = require('../config/database');
const { mongoUri } = require('../config/env');
const { seedDemoData } = require('../services/seedService');

async function run() {
  await connectDatabase(mongoUri);
  const result = await seedDemoData();
  // eslint-disable-next-line no-console
  console.log('Demo seed completed', result);
  process.exit(0);
}

run().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('Seed failed', error);
  process.exit(1);
});
