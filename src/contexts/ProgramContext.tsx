import React, { createContext, useContext, useMemo, useEffect } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, SystemProgram } from '@solana/web3.js';
import { Program, AnchorProvider, Idl, BN } from '@coral-xyz/anchor';
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from '@solana/spl-token';

import IDL from '../time_locked_wallet.json';
import { 
  ProgramContextType, 
  InitializeParams, 
  DepositParams, 
  WalletInfo, 
  TimeLockData, 
  AssetType 
} from '../types';

const PROGRAM_ID = new PublicKey("899SKikn1WiRBSurKhMZyNCNvYmWXVE6hZFYbFim293g");

const ProgramContext = createContext<ProgramContextType | null>(null);

export const useProgramContext = () => {
  const context = useContext(ProgramContext);
  if (!context) {
    throw new Error('useProgramContext must be used within ProgramProvider');
  }
  return context;
};

interface ProgramProviderProps {
  children: React.ReactNode;
}

export const ProgramProvider: React.FC<ProgramProviderProps> = ({ children }) => {
  const { connection } = useConnection();
  const wallet = useWallet();

  // Track 403 errors
  useEffect(() => {
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args);
        if (response.status === 403) {
          console.warn('🚫 403 Forbidden detected:', {
            url: args[0],
            status: response.status,
            statusText: response.statusText
          });
        }
        return response;
      } catch (error) {
        console.error('🔥 Fetch error:', error);
        throw error;
      }
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  const program = useMemo(() => {
    if (!wallet.publicKey || !wallet.signTransaction) return null;
    
    const provider = new AnchorProvider(
      connection,
      wallet as any,
      { commitment: 'confirmed' }
    );
    
    return new Program(IDL as Idl, provider);
  }, [connection, wallet]);

  // Get time lock PDA
  const getTimeLockPDA = (owner: PublicKey, unlockTimestamp: number): [PublicKey, number] => {
    const seeds = [
      Buffer.from("time_lock"),
      owner.toBuffer(),
      Buffer.from(new BN(unlockTimestamp).toArray("le", 8))
    ];
    
    return PublicKey.findProgramAddressSync(seeds, PROGRAM_ID);
  };

  // Initialize a new time lock
  const initialize = async (params: InitializeParams): Promise<{ publicKey: PublicKey; signature: string }> => {
    if (!program || !wallet.publicKey) {
      throw new Error('Wallet not connected or program not initialized');
    }

    const [timeLockAccount] = getTimeLockPDA(wallet.publicKey, params.unlockTimestamp);

    const tx = await program.methods
      .initialize(new BN(params.unlockTimestamp), { [params.assetType.toLowerCase()]: {} })
      .accounts({
        timeLockAccount,
        initializer: wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    return { publicKey: timeLockAccount, signature: tx };
  };

  // Deposit SOL
  const depositSol = async (params: DepositParams): Promise<string> => {
    if (!program || !wallet.publicKey) {
      throw new Error('Wallet not connected or program not initialized');
    }

    const tx = await program.methods
      .depositSol(new BN(params.amount))
      .accounts({
        timeLockAccount: params.timeLockAccount,
        initializer: wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    return tx;
  };

  // Deposit Token
  const depositToken = async (params: DepositParams & { tokenMint: PublicKey }): Promise<string> => {
    if (!program || !wallet.publicKey) {
      throw new Error('Wallet not connected or program not initialized');
    }

    const tokenFromAta = await getAssociatedTokenAddress(
      params.tokenMint,
      wallet.publicKey
    );

    const tokenVault = await getAssociatedTokenAddress(
      params.tokenMint,
      params.timeLockAccount,
      true // allowOwnerOffCurve
    );

    const tx = await program.methods
      .depositToken(new BN(params.amount))
      .accounts({
        timeLockAccount: params.timeLockAccount,
        initializer: wallet.publicKey,
        tokenFromAta,
        tokenVault,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();

    return tx;
  };

  // Withdraw SOL
  const withdrawSol = async (timeLockAccount: PublicKey): Promise<string> => {
    if (!program || !wallet.publicKey) {
      throw new Error('Wallet not connected or program not initialized');
    }

    console.log('=== WITHDRAWAL DEBUG ===');
    console.log('TimeLock Account:', timeLockAccount.toBase58());
    console.log('Owner:', wallet.publicKey.toBase58());
    
    // Check if account exists and get its data
    let accountInfo;
    try {
      accountInfo = await (program.account as any).timeLockAccount.fetch(timeLockAccount);
      console.log('Account exists:', !!accountInfo);
      console.log('Account data:', {
        owner: accountInfo.owner.toBase58(),
        unlockTimestamp: accountInfo.unlockTimestamp.toNumber(),
        assetType: accountInfo.assetType,
        amount: accountInfo.amount.toNumber(),
        isUnlocked: Date.now() / 1000 > accountInfo.unlockTimestamp.toNumber()
      });
    } catch (error) {
      console.error('Failed to fetch account:', error);
      throw new Error('Account not found or invalid');
    }

    // Verify PDA derivation
    const [expectedPDA] = getTimeLockPDA(accountInfo.owner, accountInfo.unlockTimestamp.toNumber());
    console.log('Expected PDA:', expectedPDA.toBase58());
    console.log('PDA matches:', expectedPDA.equals(timeLockAccount));
    
    if (!expectedPDA.equals(timeLockAccount)) {
      throw new Error('PDA derivation mismatch - account may be corrupted');
    }

    console.log('🚀 Attempting withdrawal with enhanced logging...');
    
    const tx = await program.methods
      .withdrawSol()
      .accounts({
        timeLockAccount,
        owner: wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc({
        commitment: 'confirmed',
        preflightCommitment: 'confirmed'
      });

    return tx;
  };

  // Withdraw Token
  const withdrawToken = async (timeLockAccount: PublicKey, tokenMint: PublicKey): Promise<string> => {
    if (!program || !wallet.publicKey) {
      throw new Error('Wallet not connected or program not initialized');
    }

    const tokenFromVault = await getAssociatedTokenAddress(
      tokenMint,
      timeLockAccount,
      true // allowOwnerOffCurve
    );

    const tokenToAta = await getAssociatedTokenAddress(
      tokenMint,
      wallet.publicKey
    );

    const tx = await program.methods
      .withdrawToken()
      .accounts({
        timeLockAccount,
        owner: wallet.publicKey,
        tokenFromVault,
        tokenToAta,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();

    return tx;
  };

  // Get wallet info
  const getWalletInfo = async (timeLockAccount: PublicKey): Promise<WalletInfo> => {
    if (!program || !wallet.publicKey) {
      throw new Error('Wallet not connected or program not initialized');
    }

    const result = await program.methods
      .getWalletInfo()
      .accounts({
        timeLockAccount,
        owner: wallet.publicKey,
      })
      .view();

    return {
      owner: result.owner,
      unlockTimestamp: result.unlockTimestamp,
      assetType: result.assetType.sol ? AssetType.Sol : AssetType.Token,
      amount: result.amount,
      tokenVault: result.tokenVault,
      isUnlocked: result.isUnlocked,
      timeRemaining: result.timeRemaining,
    };
  };

  // Get user's time locks
  const getUserTimeLocks = async (userPublicKey: PublicKey): Promise<TimeLockData[]> => {
    if (!program) {
      throw new Error('Program not initialized');
    }

    try {
      // Get all time-lock accounts and filter by owner
      const allAccounts = await (program.account as any).timeLockAccount.all();
      
      // Filter accounts where the user is the owner
      const userAccounts = allAccounts.filter((account: any) => {
        const owner = account.account.owner;
        return owner.equals(userPublicKey);
      });

      const timeLockData: TimeLockData[] = [];

      for (const account of userAccounts) {
        try {
          // Get wallet info for each account
          const walletInfo = await getWalletInfo(account.publicKey);
          
          timeLockData.push({
            publicKey: account.publicKey,
            account: {
              owner: account.account.owner,
              unlockTimestamp: account.account.unlockTimestamp,
              assetType: account.account.assetType.sol ? AssetType.Sol : AssetType.Token,
              bump: account.account.bump,
              amount: account.account.amount,
              tokenVault: account.account.tokenVault,
            },
            walletInfo,
          });
        } catch (error) {
          // Still include the account even if wallet info fails
          timeLockData.push({
            publicKey: account.publicKey,
            account: {
              owner: account.account.owner,
              unlockTimestamp: account.account.unlockTimestamp,
              assetType: account.account.assetType.sol ? AssetType.Sol : AssetType.Token,
              bump: account.account.bump,
              amount: account.account.amount,
              tokenVault: account.account.tokenVault,
            },
          });
        }
      }

      return timeLockData;
    } catch (error) {
      return [];
    }
  };

  const value: ProgramContextType = {
    program,
    connection,
    programId: PROGRAM_ID,
    initialize,
    depositSol,
    depositToken,
    withdrawSol,
    withdrawToken,
    getWalletInfo,
    getUserTimeLocks,
    getTimeLockPDA,
  };

  return (
    <ProgramContext.Provider value={value}>
      {children}
    </ProgramContext.Provider>
  );
};

export default ProgramProvider;
