#!/bin/bash

echo "🚀 Time-Locked Wallet Quick Start Script"
echo "========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
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

# Check if running from correct directory
if [ ! -f "Anchor.toml" ]; then
    print_error "Please run this script from the time-locked-wallet-solana-lib root directory"
    exit 1
fi

print_step "1. Checking prerequisites..."

# Check Solana CLI
if ! command -v solana &> /dev/null; then
    print_error "Solana CLI not found. Please install Solana CLI first."
    exit 1
fi

# Check Anchor CLI
if ! command -v anchor &> /dev/null; then
    print_error "Anchor CLI not found. Please install Anchor CLI first."
    exit 1
fi

# Check Node.js
if ! command -v node &> /dev/null; then
    print_error "Node.js not found. Please install Node.js v18+ first."
    exit 1
fi

print_success "Prerequisites check passed!"

print_step "2. Setting up Solana config for localhost..."
solana config set --url localhost
solana config set --keypair ~/.config/solana/id.json

print_step "3. Building smart contract..."
anchor build
if [ $? -ne 0 ]; then
    print_error "Failed to build smart contract"
    exit 1
fi
print_success "Smart contract built successfully!"

print_step "4. Building packages..."
cd packages/core
npm run build
if [ $? -ne 0 ]; then
    print_error "Failed to build core package"
    exit 1
fi

cd ../react  
npm run build
if [ $? -ne 0 ]; then
    print_error "Failed to build react package"
    exit 1
fi

cd ../..
print_success "All packages built successfully!"

print_step "5. Installing frontend dependencies..."
cd examples/react-vite
npm install
if [ $? -ne 0 ]; then
    print_error "Failed to install frontend dependencies"
    exit 1
fi
cd ../..
print_success "Frontend dependencies installed!"

echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "📋 Next steps:"
echo "==============="
echo ""
echo "1. Start Solana validator (Terminal 1):"
echo "   ${YELLOW}solana-test-validator${NC}"
echo ""
echo "2. Deploy smart contract (Terminal 2):"
echo "   ${YELLOW}anchor deploy${NC}"
echo "   ${YELLOW}solana airdrop 5${NC}"
echo ""
echo "3. Start frontend (Terminal 3):"
echo "   ${YELLOW}cd examples/react-vite${NC}"
echo "   ${YELLOW}npm run dev${NC}"
echo ""
echo "4. Open browser: ${BLUE}http://localhost:5173${NC}"
echo ""
echo "📖 For detailed instructions, see: SETUP_GUIDE.md"
echo ""
echo "Happy coding! 🚀"
