import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, User, Settings, Globe, ArrowLeft, Sun, Moon } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';

export const Header = ({
  title,
  showBack = false,
  onSearchClick,
  rightActions,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { lang, setLang, t } = useLanguage();
  const { theme, setTheme } = useTheme();

  const toggleLanguage = () => {
    setLang(lang === 'bn' ? 'en' : 'bn');
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <header className="sticky top-0 z-40 bg-[#7542C8] text-white shadow-md">
      <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
        {/* Left Side: Back button or App Brand */}
        <div className="flex items-center gap-2.5 min-w-0">
          {showBack ? (
            <button
              onClick={() => navigate(-1)}
              className="p-1.5 -ml-1 rounded-full hover:bg-white/10 active:bg-white/20 transition-colors"
              title={t('back')}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          ) : (
            <div 
              onClick={() => navigate('/')} 
              className="flex items-center gap-2 cursor-pointer select-none"
            >
              <img src="/logo.svg" alt="Logo" className="w-8 h-8 rounded-lg shadow-inner" />
              <div className="flex flex-col">
                <span className="font-bold text-base tracking-tight leading-tight">
                  Amanot Ledger
                </span>
                <span className="text-[10px] text-purple-200 leading-tight font-medium">
                  আমানত লেজার
                </span>
              </div>
            </div>
          )}

          {showBack && (
            <h1 className="font-semibold text-base truncate">
              {title || t('appName')}
            </h1>
          )}
        </div>

        {/* Right Side: Quick Action Icons */}
        <div className="flex items-center gap-1">
          {onSearchClick && (
            <button
              onClick={onSearchClick}
              className="p-2 rounded-xl hover:bg-white/10 active:bg-white/20 transition-colors"
              title={t('searchAccounts')}
            >
              <Search className="w-4 h-4" />
            </button>
          )}

          {/* Language Switcher */}
          <button
            onClick={toggleLanguage}
            className="px-2 py-1 rounded-lg text-xs font-semibold bg-white/15 hover:bg-white/25 active:bg-white/30 transition-colors"
            title="Switch Language"
          >
            {lang === 'bn' ? 'EN' : 'বাং'}
          </button>

          {/* Theme Quick Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl hover:bg-white/10 active:bg-white/20 transition-colors"
            title="Toggle Theme"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-300" />
            ) : (
              <Moon className="w-4 h-4 text-purple-100" />
            )}
          </button>

          {/* Profile Shortcut */}
          <button
            onClick={() => navigate('/profile')}
            className={`p-2 rounded-xl transition-colors ${
              location.pathname === '/profile'
                ? 'bg-white/25 text-white'
                : 'hover:bg-white/10 active:bg-white/20'
            }`}
            title={t('ownerProfile')}
          >
            <User className="w-4 h-4" />
          </button>

          {/* Settings Shortcut */}
          <button
            onClick={() => navigate('/settings')}
            className={`p-2 rounded-xl transition-colors ${
              location.pathname === '/settings'
                ? 'bg-white/25 text-white'
                : 'hover:bg-white/10 active:bg-white/20'
            }`}
            title={t('settings')}
          >
            <Settings className="w-4 h-4" />
          </button>

          {rightActions}
        </div>
      </div>
    </header>
  );
};
