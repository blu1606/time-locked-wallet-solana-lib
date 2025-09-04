import React, { useState, useEffect, useCallback } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { getAssociatedTokenAddress, getAccount } from '@solana/spl-token';
import toast from 'react-hot-toast';

import { Button, Card } from '../components';
import { TokenService } from '../services/tokenService';

// USDC mint address on devnet (correct devnet address)
const USDC_MINT = new PublicKey(TokenService.USDC_DEVNET_MINT);

const Airdrop: React.FC = () => {
  const { connected, publicKey } = useWallet();
  const { connection } = useConnection();
  
  const [isLoading, setIsLoading] = useState(false);
  const [balance, setBalance] = useState<{ sol: number; usdc: number }>({ sol: 0, usdc: 0 });
  const [solAmount, setSolAmount] = useState('1');
  const [usdcAmount, setUsdcAmount] = useState('10');

  // Load wallet balance
  const loadBalance = useCallback(async () => {
    if (!publicKey) return;

    try {
      // Get SOL balance
      const solBalance = await connection.getBalance(publicKey);
      const solAmount = solBalance / LAMPORTS_PER_SOL;

      // Get USDC balance with detailed debugging
      let usdcAmount = 0;
      try {
        const usdcAta = await getAssociatedTokenAddress(USDC_MINT, publicKey);
        
              console.log('🔍 Airdrop USDC Debug:', {
        usdcMint: USDC_MINT.toBase58(),
        usdcMintConstant: TokenService.USDC_DEVNET_MINT,
        expectedATA: usdcAta.toBase58(),
        wallet: publicKey.toBase58()
      });

        // Check if ATA exists
        const accountInfo = await connection.getAccountInfo(usdcAta);
        if (!accountInfo) {
          console.log('❌ USDC ATA does not exist, searching for existing accounts...');
          
          // Try to find any USDC token accounts for this wallet
          const tokenAccounts = await connection.getTokenAccountsByOwner(publicKey, {
            mint: USDC_MINT
          });
          
          console.log('🔍 Found USDC token accounts:', tokenAccounts.value.length);
          
          if (tokenAccounts.value.length > 0) {
            // Use the first USDC token account found
            const tokenAccountPubkey = tokenAccounts.value[0].pubkey;
            console.log('✅ Using existing USDC account:', tokenAccountPubkey.toBase58());
            
            const balance = await connection.getTokenAccountBalance(tokenAccountPubkey);
            usdcAmount = parseFloat(balance.value.uiAmountString || '0');
            console.log('💰 USDC Balance (existing):', usdcAmount);
          } else {
            console.log('❌ No USDC token accounts found');
            usdcAmount = 0;
          }
        } else {
          // ATA exists, get balance
          const usdcAccount = await getAccount(connection, usdcAta);
          usdcAmount = Number(usdcAccount.amount) / Math.pow(10, 6); // USDC has 6 decimals
          console.log('💰 USDC Balance (ATA):', usdcAmount);
        }
      } catch (error) {
        console.error('❌ USDC balance loading error:', error);
        usdcAmount = 0;
      }

      setBalance({ sol: solAmount, usdc: usdcAmount });
    } catch (error) {
      console.error('Error loading balance:', error);
    }
  }, [connection, publicKey]);

  useEffect(() => {
    if (connected && publicKey) {
      loadBalance();
    }
  }, [connected, publicKey, loadBalance]);

  // Request SOL airdrop
  const requestSolAirdrop = async () => {
    if (!publicKey) {
      toast.error('Please connect your wallet');
      return;
    }

    const amount = parseFloat(solAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Invalid SOL amount');
      return;
    }

    if (amount > 2) {
      toast.error('Maximum 2 SOL per airdrop');
      return;
    }

    setIsLoading(true);
    try {
      toast.loading(`Requesting ${amount} SOL airdrop...`, { id: 'sol-airdrop' });
      
      const signature = await connection.requestAirdrop(publicKey, amount * LAMPORTS_PER_SOL);
      await connection.confirmTransaction(signature);
      
      toast.success(`Received ${amount} SOL from airdrop!`, { id: 'sol-airdrop' });
      loadBalance();
    } catch (error: any) {
      console.error('Airdrop error:', error);
      
      // Handle specific error cases
      if (error.message?.includes('429') || error.message?.includes('limit')) {
        toast.error('Airdrop limit reached today. Please try again later or use another faucet.', { 
          id: 'sol-airdrop',
          duration: 8000 
        });
      } else if (error.message?.includes('faucet has run dry')) {
        toast.error('Faucet has run dry. Please try again later or use another faucet.', { 
          id: 'sol-airdrop',
          duration: 8000 
        });
      } else {
        toast.error(`SOL airdrop error: ${error.message}`, { id: 'sol-airdrop' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Visit Circle faucet for USDC
  const visitUsdcFaucet = () => {
    console.log('🌐 Opening Circle USDC faucet...');
    window.open('https://faucet.circle.com/', '_blank');
    
    toast.success('Circle USDC faucet opened in new tab! Use your wallet address to request USDC.', {
      duration: 5000
    });

    // Refresh balance after user likely got USDC
    setTimeout(() => {
      loadBalance();
    }, 10000); // Give user time to complete airdrop
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Devnet Airdrop
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Request SOL and USDC from devnet faucet
          </p>
        </div>

        {!connected ? (
          <Card className="text-center" padding="lg">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Connect wallet to request airdrop
            </h3>
            <WalletMultiButton />
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Balance Display */}
            <Card padding="lg">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Current Balance
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                  <div className="flex items-center">
                    <img
                      src="https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png"
                      alt="SOL"
                      className="h-8 w-8 rounded-full mr-3"
                    />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">SOL Balance</p>
                      <p className="text-xl font-semibold text-gray-900 dark:text-white">
                        {balance.sol.toFixed(4)} SOL
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                  <div className="flex items-center">
                    <img
                      src="https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png"
                      alt="USDC"
                      className="h-8 w-8 rounded-full mr-3"
                    />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">USDC Balance</p>
                      <p className="text-xl font-semibold text-gray-900 dark:text-white">
                        {balance.usdc.toFixed(2)} USDC
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* SOL Airdrop */}
            <Card padding="lg">
              <div className="space-y-4">
                <div className="flex items-center">
                  <img
                    src="https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png"
                    alt="SOL"
                    className="h-10 w-10 rounded-full mr-4"
                  />
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      Request SOL Airdrop
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Receive SOL from devnet faucet (max 2 SOL)
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      SOL Amount
                    </label>
                    <input
                      type="number"
                      value={solAmount}
                      onChange={(e) => setSolAmount(e.target.value)}
                      min="0.1"
                      max="2"
                      step="0.1"
                      className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm transition-colors duration-200 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 dark:focus:border-primary-400 dark:focus:ring-primary-400 sm:text-sm py-3 px-4"
                    />
                  </div>
                  <Button
                    onClick={requestSolAirdrop}
                    loading={isLoading}
                    variant="primary"
                    className="self-end"
                  >
                    Request {solAmount} SOL
                  </Button>
                </div>
              </div>
            </Card>

            {/* USDC Airdrop */}
            <Card padding="lg">
              <div className="space-y-4">
                <div className="flex items-center">
                  <img
                    src="https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png"
                    alt="USDC"
                    className="h-10 w-10 rounded-full mr-4"
                  />
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      Get USDC from Faucet
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Visit Circle's faucet to get test USDC (Mint: Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr)
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      USDC Amount
                    </label>
                    <input
                      type="number"
                      placeholder="Amount (max 10)"
                      value={usdcAmount}
                      onChange={(e) => setUsdcAmount(e.target.value)}
                      min="0.01"
                      max="10"
                      step="0.01"
                      className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 sm:text-sm py-3 px-4"
                    />
                  </div>
                  <Button
                    onClick={visitUsdcFaucet}
                    variant="secondary"
                    disabled={!connected}
                    className="self-end"
                  >
                    Visit Faucet
                  </Button>
                </div>
              </div>
            </Card>

            {/* Info */}
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <h4 className="font-medium text-yellow-900 dark:text-yellow-100 mb-2">
                ⚠️ Important Notes
              </h4>
              <ul className="text-sm text-yellow-800 dark:text-yellow-200 space-y-1">
                <li>• Airdrop only works on Solana devnet</li>
                <li>• SOL airdrop may have rate limits</li>
                <li>• USDC airdrop requires separate program (not available yet)</li>
                <li>• Airdrop tokens only have value on devnet</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Airdrop;
