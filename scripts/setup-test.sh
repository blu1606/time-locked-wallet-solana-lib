#!/bin/bash

# Setup script for running manual tests

echo "🚀 Setting up Time-Locked Wallet Manual Test Environment..."

# Set Anchor provider URL to local cluster
export ANCHOR_PROVIDER_URL="http://127.0.0.1:8899"
export ANCHOR_WALLET="~/.config/solana/id.json"

echo "✅ Environment variables set:"
echo "   ANCHOR_PROVIDER_URL: $ANCHOR_PROVIDER_URL"
echo "   ANCHOR_WALLET: $ANCHOR_WALLET"

# Check if solana-test-validator is running
if ! nc -z localhost 8899 2>/dev/null; then
    echo "❌ Local validator is not running!"
    echo "📋 To start local validator, run in another terminal:"
    echo "   solana-test-validator"
    exit 1
fi

echo "✅ Local validator is running"

# Check if program is deployed
echo "🔍 Checking if program is deployed..."

# Get program ID from Anchor.toml
PROGRAM_ID=$(grep "time_locked_wallet =" Anchor.toml | cut -d'"' -f2)
echo "📍 Program ID: $PROGRAM_ID"

# Check if program exists
if solana account $PROGRAM_ID > /dev/null 2>&1; then
    echo "✅ Program is deployed"
else
    echo "❌ Program is not deployed!"
    echo "📋 To deploy program, run:"
    echo "   anchor build"
    echo "   anchor deploy"
    exit 1
fi

# Check wallet balance
BALANCE=$(solana balance | cut -d' ' -f1)
echo "💰 Wallet balance: $BALANCE SOL"

if (( $(echo "$BALANCE < 1.0" | bc -l) )); then
    echo "⚠️  Low balance! Consider airdropping more SOL:"
    echo "   solana airdrop 10"
fi

echo ""
echo "🎉 Environment is ready for testing!"
echo "📋 Run the test with:"
echo "   npm run test:manual"
