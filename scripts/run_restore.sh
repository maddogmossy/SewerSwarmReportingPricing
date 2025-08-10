#!/bin/bash
# Script to restore authentic data to new Neon database
# Run this after updating the DATABASE_URL secret

echo "🔄 Restoring authentic data to Neon database..."

# Use the environment DATABASE_URL
psql "$DATABASE_URL" -f scripts/restore_neon_data.sql

if [ $? -eq 0 ]; then
    echo "✅ Data restoration completed successfully"
    echo "🔄 Testing API connection..."
    curl -s "http://localhost:5173/api/pr2-clean?sector=utilities" | head -5
else
    echo "❌ Data restoration failed"
    exit 1
fi