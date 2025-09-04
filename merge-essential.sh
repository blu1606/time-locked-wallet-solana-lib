#!/bin/bash

echo "🎯 Merging Essential Files Only from develop to main"
echo "=================================================="

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
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

# Essential files to merge
ESSENTIAL_FILES=(
    # Core Program
    "programs/time-locked-wallet/"
    
    # Configuration
    "Anchor.toml"
    "Cargo.toml" 
    "Cargo.lock"
    "package.json"
    "tsconfig.json"
    
    # Core Library
    "packages/core/"
    
    # Documentation & Setup
    "README.md"
    "SETUP_GUIDE.md"
    "QUICKSTART.md"
    "quick-start.sh"
    
    # Essential scripts
    "migrations/deploy.ts"
    "scripts/setup-test.sh"
)

print_step "Checking current branch..."
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ]; then
    print_warning "Not on main branch. Switching to main..."
    git checkout main
fi

print_step "Merging essential files from develop..."

# Create temporary branch for selective merge
git checkout -b temp-essential-merge

# Merge specific files from develop
for file in "${ESSENTIAL_FILES[@]}"; do
    print_step "Merging: $file"
    git checkout develop -- "$file" 2>/dev/null || print_warning "File $file not found in develop"
done

print_step "Committing changes..."
git add .
git commit -m "feat: merge essential files from develop

- Core Solana program
- Configuration files  
- Core library package
- Documentation and setup scripts"

print_step "Switching back to main and merging..."
git checkout main
git merge temp-essential-merge --no-ff -m "Merge essential files from develop"

print_step "Cleaning up temporary branch..."
git branch -d temp-essential-merge

print_success "Essential files merged successfully!"
print_success "Run 'anchor build' to compile the program"
