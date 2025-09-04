import React, { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';

import WalletContextProvider from './contexts/WalletContext';
import ProgramProvider from './contexts/ProgramContext';
import { Navigation, ErrorBoundary } from './components';
import CreateLock from './pages/CreateLock';
import Dashboard from './pages/Dashboard';
import Airdrop from './pages/Airdrop';

function App() {
  const [currentPage, setCurrentPage] = useState<'create' | 'dashboard' | 'airdrop'>('dashboard');
  const [darkMode, setDarkMode] = useState(true);

  // Initialize dark mode from localStorage
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode) {
      setDarkMode(JSON.parse(savedDarkMode));
    } else {
      // Default to dark mode
      setDarkMode(true);
    }
  }, []);

  // Apply dark mode class to document
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'create':
        return <CreateLock onNavigateToDashboard={() => setCurrentPage('dashboard')} />;
      case 'dashboard':
        return <Dashboard onNavigateToCreate={() => setCurrentPage('create')} />;
      case 'airdrop':
        return <Airdrop />;
      default:
        return <CreateLock onNavigateToDashboard={() => setCurrentPage('dashboard')} />;
    }
  };

  return (
    <ErrorBoundary>
      <WalletContextProvider>
        <ProgramProvider>
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <Navigation
              currentPage={currentPage}
              onPageChange={setCurrentPage}
              darkMode={darkMode}
              onToggleDarkMode={toggleDarkMode}
            />
            
            <main>
              {renderPage()}
            </main>

            {/* Toast notifications */}
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: darkMode ? '#374151' : '#ffffff',
                  color: darkMode ? '#ffffff' : '#000000',
                  border: darkMode ? '1px solid #4b5563' : '1px solid #e5e7eb',
                },
                success: {
                  iconTheme: {
                    primary: '#10b981',
                    secondary: '#ffffff',
                  },
                },
                error: {
                  iconTheme: {
                    primary: '#ef4444',
                    secondary: '#ffffff',
                  },
                },
              }}
            />
          </div>
        </ProgramProvider>
      </WalletContextProvider>
    </ErrorBoundary>
  );
}

export default App;
