import React from 'react';
interface NavigationProps {
    currentPage: 'create' | 'dashboard';
    onPageChange: (page: 'create' | 'dashboard') => void;
    darkMode: boolean;
    onToggleDarkMode: () => void;
    walletButton?: React.ReactNode;
}
declare const Navigation: React.FC<NavigationProps>;
export default Navigation;
//# sourceMappingURL=Navigation.d.ts.map