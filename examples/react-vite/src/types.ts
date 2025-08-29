// Window type extensions for Phantom wallet
declare global {
  interface Window {
    solana?: {
      isPhantom?: boolean;
      connect: (options?: { onlyIfTrusted?: boolean }) => Promise<{ publicKey: any }>;
      disconnect: () => Promise<void>;
      on: (event: string, callback: (...args: any[]) => void) => void;
      request: (options: any) => Promise<any>;
    };
  }
}

export interface WalletInfo {
  publicKey: any;
}

export interface LockData {
  owner: string;
  amount: number;
  unlockTime: number;
  created: number;
}

export interface CreateLockParams {
  amount: number;
  unlockTime: Date;
}

export {};
