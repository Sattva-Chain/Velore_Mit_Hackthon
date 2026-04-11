const app = require('./app');
const { connectDatabase } = require('./config/database');
const { mongoUri, port, seedOnStart } = require('./config/env');
const { seedDemoData } = require('./services/seedService');

async function startServer() {
  await connectDatabase(mongoUri);

  if (seedOnStart) {
    await seedDemoData();
  }

  app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`NavMate backend running on ports ${port}`);
  });
}

startServer().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('Failed to start server', error);
  process.exit(1);
});
