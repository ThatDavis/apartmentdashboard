import { db } from '../dist/server/db/index.js';
import { users } from '../dist/server/db/schema.js';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';

async function seedUsers() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log('Usage: node scripts/seed-user-prod.js <username> <pin>');
    console.log('Example: node scripts/seed-user-prod.js neighbor1 1234');
    process.exit(1);
  }

  const [username, pin] = args;

  if (pin.length < 4 || pin.length > 6) {
    console.error('PIN must be between 4 and 6 digits');
    process.exit(1);
  }

  const existingUser = await db.select().from(users).where(eq(users.username, username)).get();
  
  if (existingUser) {
    console.log(`User "${username}" already exists. Updating PIN...`);
    const pinHash = await bcrypt.hash(pin, 10);
    await db.update(users).set({ pinHash }).where(eq(users.username, username));
    console.log(`✓ Updated PIN for user "${username}"`);
  } else {
    const pinHash = await bcrypt.hash(pin, 10);
    await db.insert(users).values({
      username,
      pinHash,
    });
    console.log(`✓ Created user "${username}" with PIN`);
  }

  process.exit(0);
}

seedUsers().catch((err) => {
  console.error('Failed to seed user:', err);
  process.exit(1);
});
