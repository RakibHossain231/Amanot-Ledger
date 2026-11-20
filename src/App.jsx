import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import { LedgerProvider } from './context/LedgerContext';
import { Header } from './components/layout/Header';
import { BottomNav } from './components/layout/BottomNav';
import { DashboardPage } from './pages/DashboardPage';
import { AccountDetailsPage } from './pages/AccountDetailsPage';
import { OwnerProfilePage } from './pages/OwnerProfilePage';
import { SettingsPage } from './pages/SettingsPage';

function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <LedgerProvider>
          <BrowserRouter>
            <div className="min-h-screen bg-[#F7F5FC] dark:bg-[#171321] text-gray-900 dark:text-gray-100 flex flex-col font-sans transition-colors duration-150">
              {/* App Global Header */}
              <Header />

              {/* Main App Content Viewport */}
              <main className="flex-1 w-full">
                <Routes>
                  <Route path="/" element={<DashboardPage />} />
                  <Route path="/account/:id" element={<AccountDetailsPage />} />
                  <Route path="/profile" element={<OwnerProfilePage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                </Routes>
              </main>

              {/* Mobile Bottom Navigation */}
              <BottomNav />
            </div>
          </BrowserRouter>
        </LedgerProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;
