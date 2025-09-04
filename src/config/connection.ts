import { Connection, ConnectionConfig } from '@solana/web3.js';
import { ENV_CONFIG } from './environment';

// Rate limiting configuration
const CONNECTION_CONFIG: ConnectionConfig = {
  commitment: 'confirmed',
  confirmTransactionInitialTimeout: 60000,
  wsEndpoint: undefined,
  httpHeaders: {
    'User-Agent': 'Time-Locked-Wallet/1.0.0',
  },
  fetch: async (url: string, options?: RequestInit) => {
    // Add delay between requests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...options?.headers,
          'User-Agent': 'Time-Locked-Wallet/1.0.0',
        },
      });
      
      if (response.status === 429) {
        console.warn('Rate limited, waiting 2s before retry...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        throw new Error('Rate limited - will retry');
      }
      
      return response;
    } catch (error) {
      console.error('Connection error:', error);
      throw error;
    }
  },
};

// Create connection with rate limiting
export const createOptimizedConnection = (): Connection => {
  return new Connection(ENV_CONFIG.SOLANA_RPC_URL, CONNECTION_CONFIG);
};

// Alternative RPC endpoints for fallback
const RPC_ENDPOINTS = [
  'https://api.devnet.solana.com',
  'https://solana-devnet.g.alchemy.com/v2/demo', // Free tier
  'https://devnet.helius-rpc.com/?api-key=demo', // Free tier
  'https://rpc.ankr.com/solana_devnet', // Free tier
];

let currentEndpointIndex = 0;

// Connection with automatic fallback
export const createFallbackConnection = (): Connection => {
  const endpoint = RPC_ENDPOINTS[currentEndpointIndex];
  console.log(`Using RPC endpoint: ${endpoint}`);
  
  return new Connection(endpoint, {
    commitment: 'confirmed',
    confirmTransactionInitialTimeout: 60000,
  });
};

// Switch to next endpoint if current one fails
export const switchToNextEndpoint = (): Connection => {
  currentEndpointIndex = (currentEndpointIndex + 1) % RPC_ENDPOINTS.length;
  console.log(`Switching to endpoint ${currentEndpointIndex + 1}/${RPC_ENDPOINTS.length}`);
  return createFallbackConnection();
};

// Connection with retry logic
export class ResilientConnection {
  private connection: Connection;
  private retryCount = 0;
  private maxRetries = 3;

  constructor() {
    this.connection = createOptimizedConnection();
  }

  async getConnection(): Promise<Connection> {
    return this.connection;
  }

  async retryWithFallback<T>(operation: (conn: Connection) => Promise<T>): Promise<T> {
    for (let i = 0; i < this.maxRetries; i++) {
      try {
        return await operation(this.connection);
      } catch (error: any) {
        if (error.message?.includes('429') || error.message?.includes('Rate limited')) {
          console.warn(`Rate limited, attempt ${i + 1}/${this.maxRetries}`);
          if (i < this.maxRetries - 1) {
            this.connection = switchToNextEndpoint();
            await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
            continue;
          }
        }
        throw error;
      }
    }
    throw new Error('Max retries exceeded');
  }
}

export const resilientConnection = new ResilientConnection();
