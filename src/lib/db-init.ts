// ============================================================================
// Database Initialization Script
// Run: npx tsx src/lib/db-init.ts
// ============================================================================

import { getDb } from './db';

console.log('Initializing ShipLog database...');

try {
  const db = getDb();

  // Verify tables exist
  const tables = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
    .all() as Array<{ name: string }>;

  console.log('✅ Database initialized successfully');
  console.log(`📋 Tables: ${tables.map((t) => t.name).join(', ')}`);

  // Show row counts
  for (const table of tables) {
    if (table.name.startsWith('sqlite_')) continue;
    const count = db.prepare(`SELECT COUNT(*) as count FROM "${table.name}"`).get() as { count: number };
    console.log(`   ${table.name}: ${count.count} rows`);
  }
} catch (error) {
  console.error('❌ Database initialization failed:', error);
  process.exit(1);
}
