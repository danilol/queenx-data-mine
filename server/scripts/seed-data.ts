#!/usr/bin/env tsx

/**
 * Database seeding script - populates initial franchise data
 * Run with: npm run seed-data (or directly: tsx server/scripts/seed-data.ts)
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { franchises } from '@shared/schema';
import { FRANCHISES_WITH_URLS } from "../data/franchises";
import 'dotenv/config';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const client = postgres(connectionString);
const db = drizzle(client);

async function seedDatabase() {
  console.log("🌱 Starting database seeding...");

  try {
    // Check if franchises already exist
    const existingFranchises = await db.select().from(franchises);
    
    if (existingFranchises.length > 0) {
      console.log(`✅ Database already has ${existingFranchises.length} franchises. Skipping seed.`);
      return;
    }

    // Create franchises from predefined data
    console.log("📝 Creating franchises...");
    let createdCount = 0;

    for (const franchiseData of FRANCHISES_WITH_URLS.slice(0, 10)) { // Limit to first 10 for initial seed
      try {
        await db.insert(franchises)
          .values({
            name: franchiseData.name,
            metadataSourceUrl: franchiseData.metadataSourceUrl,
          })
          .onConflictDoUpdate({ 
            target: franchises.name, 
            set: { 
              name: franchiseData.name,
              metadataSourceUrl: franchiseData.metadataSourceUrl 
            } 
          });
        createdCount++;
        console.log(`   ✓ Created: ${franchiseData.name}`);
      } catch (error) {
        console.log(`   ⚠️  Failed to create: ${franchiseData.name}`, error);
      }
    }

    console.log(`\n🎉 Database seeding completed!`);
    console.log(`   - Created ${createdCount} franchises`);
    console.log(`\nTip: Use the scraper to populate seasons and contestants from these franchises.`);

  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Run the seeding if called directly
if (require.main === module) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("Seeding error:", error);
      process.exit(1);
    });
}

export { seedDatabase };