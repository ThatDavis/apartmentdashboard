import 'dotenv/config';
import { db } from './src/server/db/index.js';
import { users } from './src/server/db/schema.js';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';

async function seedUsers() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log('Usage: npm run db:seed <username> <pin> [--admin]');
    console.log('Example: npm run db:seed neighbor1 1234');
    console.log('Example: npm run db:seed admin 1234 --admin');
    process.exit(1);
  }

  const [username, pin] = args;
  const isAdmin = args.includes('--admin');

  if (pin.length < 4 || pin.length > 6) {
    console.error('PIN must be between 4 and 6 digits');
    process.exit(1);
  }

  // Check if user already exists
  const existingUser = await db.select().from(users).where(eq(users.username, username)).get();
  
  if (existingUser) {
    console.log(`User "${username}" already exists. Updating PIN...`);
    const pinHash = await bcrypt.hash(pin, 10);
    await db.update(users).set({ pinHash, isAdmin }).where(eq(users.username, username));
    console.log(`✓ Updated user "${username}"${isAdmin ? ' (admin)' : ''}`);
  } else {
    const pinHash = await bcrypt.hash(pin, 10);
    await db.insert(users).values({
      username,
      pinHash,
      isAdmin,
    });
    console.log(`✓ Created user "${username}"${isAdmin ? ' (admin)' : ''}`);
  }

  process.exit(0);
}

seedUsers().catch((err) => {
  console.error('Failed to seed user:', err);
  process.exit(1);
});
