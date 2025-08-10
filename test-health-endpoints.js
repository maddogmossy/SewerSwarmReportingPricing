// Test script for health endpoint verification
// Run this in browser console as: fetch('/api/health/db').then(r=>r.json()).then(console.log)

console.log("🧪 Health Check Verification Test\n");

// Test basic health endpoint
fetch('/api/health')
  .then(r => r.json())
  .then(result => {
    console.log("✅ /api/health:", result);
    return fetch('/api/health/db');
  })
  .then(r => r.json())
  .then(result => {
    console.log("🔍 /api/health/db:", result);
    
    if (result.ok && result.persisted === false) {
      console.log("✅ Expected result: Neon disabled, using authentic WinCan fallback");
      console.log(`📊 Fallback status: ${result.status}`);
      console.log(`📊 Sections available: ${result.sections}`);
      console.log(`📊 Defects available: ${result.defects}`);
    } else if (result.ok && result.persisted === true) {
      console.log("✅ PostgreSQL is operational:", result.status);
    } else {
      console.log("❌ Unexpected health check result:", result);
    }
  })
  .catch(error => {
    console.error("❌ Health check test failed:", error);
  });