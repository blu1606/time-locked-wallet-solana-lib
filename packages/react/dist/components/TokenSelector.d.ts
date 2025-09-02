import React from 'react';
export interface Token {
    symbol: string;
    name: string;
    mint?: string;
    decimals: number;
    logoUrl?: string;
}
interface TokenSelectorProps {
    tokens: Token[];
    selectedToken: Token;
    onTokenSelect: (token: Token) => void;
    className?: string;
}
declare const TokenSelector: React.FC<TokenSelectorProps>;
export default TokenSelector;
//# sourceMappingURL=TokenSelector.d.ts.map