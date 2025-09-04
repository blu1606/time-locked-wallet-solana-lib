// Environment configuration
export const ENV_CONFIG = {
  // Solana Network
  SOLANA_NETWORK: process.env.REACT_APP_SOLANA_NETWORK || 'devnet',
  SOLANA_RPC_URL: process.env.REACT_APP_SOLANA_RPC_URL || 'https://api.devnet.solana.com',
  
  // Program
  PROGRAM_ID: process.env.REACT_APP_PROGRAM_ID || '899SKikn1WiRBSurKhMZyNCNvYmWXVE6hZFYbFim293g',
  
  // Application
  APP_NAME: process.env.REACT_APP_APP_NAME || 'Time-Locked Wallet',
  APP_VERSION: process.env.REACT_APP_APP_VERSION || '1.0.0',
  
  // Feature Flags
  ENABLE_ANALYTICS: process.env.REACT_APP_ENABLE_ANALYTICS === 'true',
  ENABLE_DEBUG: process.env.REACT_APP_ENABLE_DEBUG === 'true',
  
  // Development
  IS_DEVELOPMENT: process.env.NODE_ENV === 'development',
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
} as const;

// Validate required environment variables
export const validateEnvironment = () => {
  const required = [
    'REACT_APP_PROGRAM_ID',
  ];
  
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.warn('Missing environment variables:', missing);
  }
  
  return missing.length === 0;
};
