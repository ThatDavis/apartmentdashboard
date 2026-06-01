import { db } from '../dist/server/db/index.js';
import { devices } from '../dist/server/db/schema.js';
import { eq } from 'drizzle-orm';

async function addDevice() {
  const args = process.argv.slice(2);
  
  if (args.length < 3) {
    console.log('Usage: node scripts/add-device.mjs <entity_id> <name> <type> [battery_entity_id]');
    console.log('Example: node scripts/add-device.mjs switch.living_room "Living Room Light" switch');
    console.log('Example: node scripts/add-device.mjs sensor.soil_moisture "Plant Soil" sensor sensor.plant_battery');
    process.exit(1);
  }

  const [haEntityId, name, type, batteryEntityId] = args;

  // Validate type
  if (!['switch', 'sensor', 'binary_sensor'].includes(type)) {
    console.error('Type must be "switch", "sensor", or "binary_sensor"');
    process.exit(1);
  }

  // Validate domain
  const domain = haEntityId.split('.')[0];
  const allowedDomains = (process.env.ALLOWED_DOMAINS || 'switch,light,sensor,binary_sensor')
    .split(',')
    .map(d => d.trim());
  
  if (!allowedDomains.includes(domain)) {
    console.error(`Domain "${domain}" is not allowed. Allowed: ${allowedDomains.join(', ')}`);
    process.exit(1);
  }

  // Check if already exists
  const existing = await db.select().from(devices).where(eq(devices.haEntityId, haEntityId)).get();
  
  if (existing) {
    console.log(`Device ${haEntityId} already exists, updating...`);
    await db.update(devices)
      .set({ 
        name, 
        type, 
        batteryEntityId: batteryEntityId || null
      })
      .where(eq(devices.haEntityId, haEntityId));
    console.log(`✓ Updated device: ${name}`);
  } else {
    await db.insert(devices).values({
      haEntityId,
      name,
      type,
      batteryEntityId: batteryEntityId || null
    });
    console.log(`✓ Added device: ${name}`);
  }

  process.exit(0);
}

addDevice().catch(err => {
  console.error('Failed to add device:', err);
  process.exit(1);
});
