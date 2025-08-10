#!/usr/bin/env node

/**
 * Environment Variable Checker
 * Validates required environment variables for the application
 */

const requiredEnvVars = [
  'DATABASE_URL',
  'APP_BASE_URL'
];

const optionalEnvVars = [
  'STRIPE_SECRET_KEY',
  'SESSION_SECRET',
  'REPLIT_DOMAINS',
  'VITE_STRIPE_PUBLIC_KEY'
];

function checkEnvironmentVariables() {
  console.log('🔍 Checking environment variables...\n');
  
  let hasErrors = false;
  
  // Check required variables
  console.log('📋 Required Environment Variables:');
  requiredEnvVars.forEach(varName => {
    const value = process.env[varName];
    if (value) {
      console.log(`✅ ${varName}: Set (${value.length} characters)`);
    } else {
      console.log(`❌ ${varName}: Missing`);
      hasErrors = true;
    }
  });
  
  console.log('\n📋 Optional Environment Variables:');
  optionalEnvVars.forEach(varName => {
    const value = process.env[varName];
    if (value) {
      console.log(`✅ ${varName}: Set (${value.length} characters)`);
    } else {
      console.log(`⚠️  ${varName}: Not set (optional)`);
    }
  });
  
  console.log('\n' + '='.repeat(50));
  
  if (hasErrors) {
    console.log('❌ Missing required environment variables!');
    console.log('Please add them using the Replit Secrets (padlock icon).');
    process.exit(1);
  } else {
    console.log('✅ All required environment variables are configured!');
  }
  
  // Database connectivity test
  if (process.env.DATABASE_URL) {
    console.log('\n🔌 Testing database connectivity...');
    testDatabaseConnection();
  }
}

async function testDatabaseConnection() {
  try {
    // Simple connection test without importing heavy dependencies
    const dbUrl = process.env.DATABASE_URL;
    
    if (dbUrl.includes('neon')) {
      console.log('🌐 Neon PostgreSQL detected');
    } else if (dbUrl.includes('localhost') || dbUrl.includes('127.0.0.1')) {
      console.log('🏠 Local PostgreSQL detected');
    } else {
      console.log('🗄️  PostgreSQL database detected');
    }
    
    console.log('💡 Run the application to test actual connectivity');
    
  } catch (error) {
    console.log('⚠️  Could not test database connection:', error.message);
  }
}

// Run the check
checkEnvironmentVariables();