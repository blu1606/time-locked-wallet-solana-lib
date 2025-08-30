import React, { createContext, useContext, useMemo } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { Program, AnchorProvider, Idl, BN } from '@coral-xyz/anchor';
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from '@solana/spl-token';

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

  const program = useMemo(() => {
    if (!wallet.publicKey || !wallet.signTransaction) return null;
    
    const provider = new AnchorProvider(
      connection,
      wallet as any,
      { commitment: 'confirmed' }
    );
    
    return new Program(IDL as Idl, provider);
  }, [connection, wallet.publicKey, wallet.signTransaction]);

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

    const [timeLockAccount, bump] = getTimeLockPDA(wallet.publicKey, params.unlockTimestamp);

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

    const tx = await program.methods
      .withdrawSol()
      .accounts({
        timeLockAccount,
        owner: wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

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
      // Fetch all time lock accounts for this user
      const accounts = await (program.account as any).timeLockAccount.all([
        {
          memcmp: {
            offset: 8, // Skip discriminator
            bytes: userPublicKey.toBase58(),
          },
        },
      ]);

      const timeLockData: TimeLockData[] = [];

      for (const account of accounts) {
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
          console.warn('Failed to get wallet info for account:', account.publicKey.toBase58(), error);
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
      console.error('Error fetching user time locks:', error);
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
