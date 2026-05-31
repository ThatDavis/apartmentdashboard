import { db } from '../dist/server/db/index.js';
import { devices } from '../dist/server/db/schema.js';

const HA_URL = process.env.HA_URL;
const HA_TOKEN = process.env.HA_TOKEN;

if (!HA_URL || !HA_TOKEN) {
  console.error('HA_URL and HA_TOKEN must be set');
  process.exit(1);
}

async function fetchHAEntities() {
  const response = await fetch(`${HA_URL}/api/states`, {
    headers: {
      'Authorization': `Bearer ${HA_TOKEN}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch: ${response.status}`);
  }

  return response.json();
}

function categorizeEntity(entityId) {
  const [domain] = entityId.split('.');
  
  const typeMap = {
    switch: 'switch',
    light: 'switch',
    sensor: 'sensor',
    binary_sensor: 'sensor',
  };

  return typeMap[domain] || 'unknown';
}

async function syncDevices() {
  console.log('Fetching entities from Home Assistant...');
  const entities = await fetchHAEntities();
  
  console.log(`Found ${entities.length} entities\n`);
  
  // Filter to relevant domains
  const relevantDomains = ['switch', 'light', 'sensor', 'binary_sensor'];
  const relevant = entities.filter(e => {
    const domain = e.entity_id.split('.')[0];
    return relevantDomains.includes(domain);
  });

  console.log(`Found ${relevant.length} relevant entities:\n`);
  
  relevant.forEach((entity, i) => {
    const type = categorizeEntity(entity.entity_id);
    console.log(`${i + 1}. [${type}] ${entity.entity_id}`);
    if (entity.attributes.friendly_name) {
      console.log(`   Name: ${entity.attributes.friendly_name}`);
    }
    console.log(`   State: ${entity.state}`);
    console.log('');
  });

  console.log('To add devices, use the web UI or run:');
  console.log('  node scripts/add-device.mjs <entity_id> <name> <type>');
  console.log('\nExample:');
  console.log('  node scripts/add-device.mjs switch.living_room "Living Room Light" switch');
}

syncDevices().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
