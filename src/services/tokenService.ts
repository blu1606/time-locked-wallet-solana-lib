import { Token } from '../components/TokenSelector';

// Token service to manage available tokens
export class TokenService {
  // Devnet USDC mint address (correct devnet address)
  public static readonly USDC_DEVNET_MINT = 'Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr';

  private static readonly SOL_TOKEN: Token = {
    symbol: 'SOL',
    name: 'Solana',
    decimals: 9,
    logoUrl: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png'
  };

  private static readonly DEFAULT_TOKENS: Token[] = [
    TokenService.SOL_TOKEN,
    {
      symbol: 'USDC',
      name: 'USD Coin',
      mint: TokenService.USDC_DEVNET_MINT, // Use devnet mint
      decimals: 6,
      logoUrl: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png'
    }
  ];

  // Get default tokens (in production, this would fetch from an API)
  static getDefaultTokens(): Token[] {
    return [...TokenService.DEFAULT_TOKENS];
  }

  // Get SOL token specifically
  static getSolToken(): Token {
    return TokenService.SOL_TOKEN;
  }

  // Find token by symbol
  static findTokenBySymbol(symbol: string): Token | undefined {
    return TokenService.DEFAULT_TOKENS.find(token => token.symbol === symbol);
  }

  // Find token by mint address
  static findTokenByMint(mint: string): Token | undefined {
    return TokenService.DEFAULT_TOKENS.find(token => token.mint === mint);
  }

  // Validate token
  static isValidToken(token: Token): boolean {
    return !!(token.symbol && token.name && token.decimals >= 0);
  }

  // Format token amount
  static formatTokenAmount(amount: number, token: Token): string {
    const formattedAmount = (amount / Math.pow(10, token.decimals)).toFixed(token.decimals);
    return `${formattedAmount} ${token.symbol}`;
  }
}
