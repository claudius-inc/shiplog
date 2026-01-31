// ============================================================================
// Database Initialization Script
// Run: npx tsx src/lib/db-init.ts
// ============================================================================

import { createClient } from '@libsql/client';

async function main() {
  console.log('Initializing ShipLog database...');

  const url = process.env.TURSO_DATABASE_URL || 'file:data/shiplog.db';
  console.log(`Database URL: ${url.startsWith('libsql:') ? url.split('@')[1] || url : url}`);

  const client = createClient({
    url,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  try {
    // Import db module to trigger schema creation
    const { getClient } = await import('./db');
    
    // Use the getClient to ensure schema is initialized
    // We'll just run a simple query to trigger ensureSchema via the module
    const { getEntriesByProject } = await import('./db');
    
    // Alternative: directly verify tables
    const result = await client.execute(
      "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
    );
    
    const tables = result.rows.map(r => (r as Record<string, unknown>).name as string);
    console.log('✅ Database initialized successfully');
    console.log(`📋 Tables: ${tables.join(', ')}`);

    // Show row counts
    for (const table of tables) {
      if (table.startsWith('sqlite_')) continue;
      const countResult = await client.execute(`SELECT COUNT(*) as count FROM "${table}"`);
      const count = Number((countResult.rows[0] as Record<string, unknown>).count);
      console.log(`   ${table}: ${count} rows`);
    }
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
}

main();
