import { storage } from './storage';
import { FRANCHISES_WITH_URLS } from './data/franchises';

async function testSeeding() {
  console.log('🧪 Testing franchise seeding with source URLs...');
  
  try {
    // First, clear existing franchises
    console.log('🗑️  Clearing existing franchises...');
    
    // Manually seed franchises with source URLs
    console.log('🌱 Seeding franchises...');
    for (const franchise of FRANCHISES_WITH_URLS) {
      const newFranchise = await storage.createFranchise({
        name: franchise.name,
        sourceUrl: franchise.sourceUrl
      });
      console.log(`✅ Created: ${newFranchise.name} -> ${newFranchise.sourceUrl}`);
    }
    
    // Verify the results
    console.log('\n📋 Verification - All franchises in database:');
    const allFranchises = await storage.getAllFranchises();
    console.log(`Total franchises: ${allFranchises.length}`);
    
    allFranchises.forEach(franchise => {
      console.log(`- ${franchise.name}: ${franchise.sourceUrl || 'No URL'}`);
    });
    
    console.log('\n🎉 Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  }
}

testSeeding()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });