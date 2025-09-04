#!/bin/bash

echo "🎯 Merging ESSENTIAL FILES ONLY (No node_modules)"
echo "==============================================="

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Essential files ONLY (excluding node_modules and build artifacts)
ESSENTIAL_FILES=(
    # Core Solana Program (Required)
    "programs/time-locked-wallet/src/"
    "programs/time-locked-wallet/Cargo.toml"
    "programs/time-locked-wallet/Xargo.toml"
    
    # Configuration (Required)
    "Anchor.toml"
    "Cargo.toml" 
    "Cargo.lock"
    "package.json"
    "tsconfig.json"
    
    # Core Library Source (Required for clients)
    "packages/core/src/"
    "packages/core/package.json"
    "packages/core/tsconfig.json"
    
    # Documentation & Setup
    "README.md"
    "SETUP_GUIDE.md"
    "QUICKSTART.md"
    "quick-start.sh"
    
    # Essential scripts
    "migrations/deploy.ts"
    "scripts/setup-test.sh"
    
    # IDL and Types (Generated but needed)
    "target/idl/"
    "target/types/"
)

print_step "Checking current branch..."
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ]; then
    print_warning "Switching to main branch..."
    git checkout main
fi

print_step "Creating temporary branch for selective merge..."
git checkout -b temp-essential-merge-$(date +%s)

print_step "Merging ONLY essential files from develop (no node_modules)..."

# Merge specific files from develop
for file in "${ESSENTIAL_FILES[@]}"; do
    if git show develop:"$file" >/dev/null 2>&1; then
        print_step "✓ Merging: $file"
        git checkout develop -- "$file" 2>/dev/null || print_warning "Could not merge $file"
    else
        print_warning "File not found in develop: $file"
    fi
done

print_step "Staging essential files..."
git add .

print_step "Committing essential changes..."
git commit -m "feat: merge essential files from develop (no node_modules)

✅ Added:
- Core Solana program (time-locked-wallet)
- Configuration files (Anchor.toml, Cargo.toml, package.json)
- Core library source code (packages/core/src)
- Documentation and setup scripts
- IDL and TypeScript types

❌ Excluded:
- node_modules (now properly gitignored)
- Build artifacts
- Development dependencies"

print_step "Switching back to main and merging..."
git checkout main
git merge temp-essential-merge-* --no-ff -m "Merge essential files from develop (clean merge)"

print_step "Cleaning up temporary branch..."
TEMP_BRANCH=$(git branch | grep temp-essential-merge)
git branch -d ${TEMP_BRANCH// /}

print_success "✅ Essential files merged successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Run: yarn install (to install dependencies)"
echo "2. Run: anchor build (to compile the program)"
echo "3. Test the program works correctly"
echo "4. Push to repository: git push origin main"
