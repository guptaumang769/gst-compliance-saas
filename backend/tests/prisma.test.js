/**
 * Test Prisma Connection
 * This file tests if Prisma is connected to PostgreSQL correctly
 * Run: node src/test-prisma.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testPrisma() {
  console.log('🧪 Testing Prisma Connection...\n');
  
  try {
    // Test 1: Database connection
    console.log('📊 Test 1: Database Connection');
    await prisma.$connect();
    console.log('✅ Successfully connected to database\n');
    
    // Test 2: Count existing users
    console.log('📊 Test 2: Count Users');
    const userCount = await prisma.user.count();
    console.log(`✅ Users in database: ${userCount}\n`);
    
    // Test 3: Count existing businesses
    console.log('📊 Test 3: Count Businesses');
    const businessCount = await prisma.business.count();
    console.log(`✅ Businesses in database: ${businessCount}\n`);
    
    // Test 4: Create a test user
    console.log('📊 Test 4: Create Test User');
    const testEmail = `test_${Date.now()}@example.com`;
    const testUser = await prisma.user.create({
      data: {
        email: testEmail,
        passwordHash: 'temp_hash_for_testing_12345',
        emailVerified: false,
        role: 'owner',
        isActive: true
      }
    });
    console.log(`✅ Created test user: ${testUser.email}`);
    console.log(`   User ID: ${testUser.id}`);
    console.log(`   Created at: ${testUser.createdAt}\n`);
    
    // Test 5: Find the user
    console.log('📊 Test 5: Find User by Email');
    const foundUser = await prisma.user.findUnique({
      where: { email: testEmail }
    });
    console.log(`✅ Found user: ${foundUser.email}`);
    console.log(`   Email verified: ${foundUser.emailVerified}`);
    console.log(`   Is active: ${foundUser.isActive}\n`);
    
    // Test 6: Update the user
    console.log('📊 Test 6: Update User');
    const updatedUser = await prisma.user.update({
      where: { email: testEmail },
      data: { emailVerified: true }
    });
    console.log(`✅ Updated user email verification: ${updatedUser.emailVerified}\n`);
    
    // Test 7: Get all users
    console.log('📊 Test 7: Get All Users');
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    console.log(`✅ Total users: ${allUsers.length}`);
    allUsers.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.email} (${user.id.substring(0, 8)}...)`);
    });
    console.log('');
    
    // Test 8: Delete the test user
    console.log('📊 Test 8: Delete Test User');
    await prisma.user.delete({
      where: { email: testEmail }
    });
    console.log(`✅ Deleted test user: ${testEmail}\n`);
    
    // Test 9: Verify deletion
    console.log('📊 Test 9: Verify Deletion');
    const deletedUser = await prisma.user.findUnique({
      where: { email: testEmail }
    });
    if (deletedUser === null) {
      console.log('✅ User successfully deleted (not found)\n');
    } else {
      console.log('❌ User still exists (deletion failed)\n');
    }
    
    // Test 10: Database raw query
    console.log('📊 Test 10: Raw SQL Query');
    const result = await prisma.$queryRaw`SELECT COUNT(*) as count FROM users`;
    console.log(`✅ Raw query result: ${result[0].count} users\n`);
    
    console.log('═══════════════════════════════════════');
    console.log('🎉 All Prisma tests passed successfully!');
    console.log('═══════════════════════════════════════\n');
    
  } catch (error) {
    console.error('\n❌ Error during Prisma tests:');
    console.error('Message:', error.message);
    if (error.code) {
      console.error('Code:', error.code);
    }
    if (error.meta) {
      console.error('Details:', error.meta);
    }
    console.error('\nFull error:', error);
  } finally {
    await prisma.$disconnect();
    console.log('🔌 Disconnected from database\n');
  }
}

// Run tests
testPrisma();
