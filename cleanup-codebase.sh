#!/bin/bash

echo "🧹 Cleaning up unnecessary files from codebase"
echo "=============================================="

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_step() {
    echo -e "${BLUE}[CLEAN]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_size() {
    echo -e "${YELLOW}[SIZE]${NC} $1"
}

# Show current sizes
echo "📊 Current folder sizes:"
du -sh node_modules/ target/ .anchor/ test-ledger/ 2>/dev/null | while read size folder; do
    print_size "$size - $folder"
done

echo ""
print_step "Removing unnecessary files and folders..."

# 1. Remove build artifacts (can be regenerated)
if [ -d "target/" ]; then
    print_step "Removing target/ directory (1.9G - build artifacts)"
    rm -rf target/
    print_success "target/ removed"
fi

# 2. Remove test ledger data (can be regenerated)
if [ -d "test-ledger/" ]; then
    print_step "Removing test-ledger/ directory (local test data)"
    rm -rf test-ledger/
    print_success "test-ledger/ removed"
fi

# 3. Remove anchor cache (can be regenerated)
if [ -d ".anchor/" ]; then
    print_step "Removing .anchor/ directory (cache)"
    rm -rf .anchor/
    print_success ".anchor/ removed"
fi

# 4. Remove node_modules (will be reinstalled)
if [ -d "node_modules/" ]; then
    print_step "Removing node_modules/ directory (9.0M - will reinstall clean)"
    rm -rf node_modules/
    print_success "node_modules/ removed"
fi

# 5. Remove any nested node_modules
print_step "Checking for nested node_modules..."
find . -name "node_modules" -type d -exec rm -rf {} + 2>/dev/null || true
print_success "Nested node_modules cleaned"

# 6. Remove common temp/cache files
print_step "Removing temp and cache files..."
find . -name "*.log" -delete 2>/dev/null || true
find . -name "*.tmp" -delete 2>/dev/null || true
find . -name ".DS_Store" -delete 2>/dev/null || true
find . -name "Thumbs.db" -delete 2>/dev/null || true
find . -name "*.swp" -delete 2>/dev/null || true
find . -name "*.swo" -delete 2>/dev/null || true
find . -name "*~" -delete 2>/dev/null || true
print_success "Temp files cleaned"

# 7. Remove any lock files (will be regenerated)
print_step "Removing lock files..."
find . -name "package-lock.json" -delete 2>/dev/null || true
find . -name "yarn.lock" -delete 2>/dev/null || true
print_success "Lock files removed"

echo ""
print_success "🎉 Cleanup completed!"
echo ""
echo "📁 Remaining essential files:"
find . -maxdepth 2 -type f -name "*.toml" -o -name "*.json" -o -name "*.md" -o -name "*.rs" -o -name "*.ts" | grep -v node_modules | sort

echo ""
echo "📋 Next steps:"
echo "1. yarn install              # Reinstall dependencies"
echo "2. anchor build              # Rebuild program"
echo "3. git add . && git commit   # Commit clean state"
echo "4. git push origin main      # Push to repository"

echo ""
print_success "Codebase is now clean and ready for deployment! 🚀"
