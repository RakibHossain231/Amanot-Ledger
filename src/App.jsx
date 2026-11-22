import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LedgerProvider } from './context/LedgerContext';
import { Header } from './components/layout/Header';
import { BottomNav } from './components/layout/BottomNav';
import { PinModal } from './components/common/PinModal';
import { AuthPage } from './pages/AuthPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { SetupPinPage } from './pages/SetupPinPage';
import { DashboardPage } from './pages/DashboardPage';
import { AccountDetailsPage } from './pages/AccountDetailsPage';
import { OwnerProfilePage } from './pages/OwnerProfilePage';
import { SettingsPage } from './pages/SettingsPage';

function AppContent() {
  const { isAuthenticated, loading, isPasswordRecovery, needsPinSetup } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F5FC] dark:bg-[#171321] flex flex-col items-center justify-center gap-3">
        <img src="/logo.svg" alt="Amanot" className="w-12 h-12 rounded-xl animate-pulse" />
        <div className="w-6 h-6 border-2 border-[#7542C8] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Active password recovery flow (after OTP entry or reset link)
  if (isPasswordRecovery) {
    return <ResetPasswordPage />;
  }

  if (!isAuthenticated) {
    return <AuthPage />;
  }

  // Mandatory PIN setup on this device for one-time linked account
  if (needsPinSetup) {
    return <SetupPinPage />;
  }

  return (
    <>
      <PinModal />
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
    </>
  );
}

function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <LedgerProvider>
            <BrowserRouter>
              <AppContent />
            </BrowserRouter>
          </LedgerProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;
