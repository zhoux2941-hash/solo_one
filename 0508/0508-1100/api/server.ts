import app from './app.js';
import { getDatabase, saveDatabase } from './database.js';
import { seedDatabase } from './seed.js';

const PORT = process.env.PORT || 3001;

async function start() {
  const db = await getDatabase();
  seedDatabase(db);
  saveDatabase(db);
  console.log('Database seeded');

  const server = app.listen(PORT, () => {
    console.log(`Server ready on port ${PORT}`);
  });

  process.on('SIGTERM', () => {
    console.log('SIGTERM signal received');
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    console.log('SIGINT signal received');
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  });
}

start();

export default app;
