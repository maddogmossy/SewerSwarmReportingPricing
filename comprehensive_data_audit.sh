#!/bin/bash

echo "🔍 COMPREHENSIVE DATA CONTAMINATION AUDIT"
echo "========================================"
echo ""

# Define old data patterns to search for
OLD_PROJECT_NUMBERS=("3588" "7118" "7188" "3878")
OLD_PROJECT_NAMES=("JRL" "Nine Elms" "Newark" "Birmingham")
OLD_MANHOLE_REFS=("SW02" "SW03" "RE2" "RE26" "F01-10A" "F01-10" "FW07" "SVP")
OLD_DEFECT_DATA=("13.27m" "16.63m" "17.73m" "21.60m" "DER.*13")
OLD_POSTCODES=("B1 1AA")

echo "1️⃣  SEARCHING SOURCE CODE FILES"
echo "--------------------------------"

# Search all TypeScript, JavaScript, and JSON files
for pattern in "${OLD_PROJECT_NUMBERS[@]}"; do
    echo "🔎 Searching for project number: $pattern"
    grep -r --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" --include="*.json" "$pattern" . 2>/dev/null | head -5
done

for pattern in "${OLD_PROJECT_NAMES[@]}"; do
    echo "🔎 Searching for project name: $pattern"
    grep -r --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" --include="*.json" "$pattern" . 2>/dev/null | head -5
done

for pattern in "${OLD_MANHOLE_REFS[@]}"; do
    echo "🔎 Searching for manhole reference: $pattern"
    grep -r --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" --include="*.json" "$pattern" . 2>/dev/null | head -3
done

echo ""
echo "2️⃣  SEARCHING DOCUMENTATION AND CONFIG"
echo "-------------------------------------"

# Search markdown and config files
grep -r --include="*.md" --include="*.txt" --include="*.config.*" "3588\|JRL\|Nine Elms\|Newark\|Birmingham" . 2>/dev/null | head -10

echo ""
echo "3️⃣  SEARCHING UPLOAD DIRECTORIES"
echo "-------------------------------"

# Check uploads directory
find uploads/ -type f 2>/dev/null | head -10
find attached_assets/ -type f -name "*3588*" -o -name "*JRL*" -o -name "*Nine*" -o -name "*Newark*" 2>/dev/null | head -10

echo ""
echo "4️⃣  SEARCHING DATABASE SCHEMA AND MIGRATIONS"
echo "-------------------------------------------"

grep -r --include="*.sql" --include="*.ts" "3588\|JRL\|Nine Elms\|Newark\|Birmingham\|SW02\|SW03\|RE2\|F01-10" . 2>/dev/null | head -10

echo ""
echo "5️⃣  SEARCHING FOR HARDCODED DEFECT DATA"
echo "--------------------------------------"

for pattern in "${OLD_DEFECT_DATA[@]}"; do
    echo "🔎 Searching for defect data: $pattern"
    grep -r --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" "$pattern" . 2>/dev/null | head -3
done

echo ""
echo "6️⃣  SEARCHING FOR HARDCODED POSTCODES"
echo "------------------------------------"

for pattern in "${OLD_POSTCODES[@]}"; do
    echo "🔎 Searching for postcode: $pattern"
    grep -r --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" --include="*.json" "$pattern" . 2>/dev/null | head -3
done

echo ""
echo "7️⃣  SEARCHING CACHE AND TEMP FILES"
echo "---------------------------------"

# Search for any cache files
find . -name "*.cache" -o -name "*.tmp" -o -name ".cache" -type f 2>/dev/null | head -10
find node_modules/ -name "*3588*" -o -name "*JRL*" 2>/dev/null | head -5

echo ""
echo "8️⃣  SEARCHING ENVIRONMENT AND LOG FILES"
echo "--------------------------------------"

# Check for any log or env files
find . -name "*.log" -o -name "*.env*" -type f 2>/dev/null | head -10

echo ""
echo "9️⃣  COMPREHENSIVE GREP SCAN"
echo "-------------------------"

echo "Final comprehensive scan for any remaining old data patterns..."
grep -r -i "3588\|JRL\|Nine.*Elms\|Newark\|Birmingham\|SW02.*SW03\|F01-10A.*F01-10\|RE2.*Main" . --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" --include="*.json" --include="*.md" 2>/dev/null | grep -v node_modules | grep -v ".git" | head -20

echo ""
echo "✅ AUDIT COMPLETE"
echo "================"
echo "Review results above for any old data contamination."
echo "All findings should be investigated and cleaned."