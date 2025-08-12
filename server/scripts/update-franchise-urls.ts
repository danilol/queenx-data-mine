import { storage } from '../storage';
import { FRANCHISES_WITH_URLS } from '../data/franchises';

async function updateFranchiseSourceUrls() {
  console.log('Starting franchise source URL update...');
  
  try {
    // First seed the franchises if they don't exist
    for (const franchiseData of FRANCHISES_WITH_URLS) {
      let franchise = await storage.getFranchiseByName(franchiseData.name);
      
      if (!franchise) {
        console.log(`Creating franchise: ${franchiseData.name}`);
        franchise = await storage.createFranchise(franchiseData.name);
      }
      
      // Update the source URL in the database
      console.log(`Updating source URL for franchise: ${franchiseData.name}`);
      
      // Since we don't have an updateFranchise method, we'll use direct SQL
      const { drizzle } = await import('drizzle-orm/postgres-js');
      const { eq } = await import('drizzle-orm');
      const postgres = (await import('postgres')).default;
      const { franchises } = await import('@shared/schema');
      
      const connectionString = process.env.DATABASE_URL;
      if (!connectionString) {
        throw new Error('DATABASE_URL environment variable is not set');
      }
      
      const client = postgres(connectionString);
      const db = drizzle(client);
      
      await db
        .update(franchises)
        .set({ sourceUrl: franchiseData.sourceUrl })
        .where(eq(franchises.name, franchiseData.name));
        
      console.log(`✓ Updated ${franchiseData.name} with source URL: ${franchiseData.sourceUrl}`);
    }
    
    console.log('✅ All franchise source URLs updated successfully!');
    
    // Verify the updates
    console.log('\n📋 Verification - Current franchise source URLs:');
    const allFranchises = await storage.getAllFranchises();
    allFranchises.forEach(franchise => {
      console.log(`- ${franchise.name}: ${franchise.sourceUrl || 'No URL set'}`);
    });
    
  } catch (error) {
    console.error('❌ Error updating franchise source URLs:', error);
    throw error;
  }
}

// Run the update if this file is executed directly
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  updateFranchiseSourceUrls()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Script failed:', error);
      process.exit(1);
    });
}

export { updateFranchiseSourceUrls };