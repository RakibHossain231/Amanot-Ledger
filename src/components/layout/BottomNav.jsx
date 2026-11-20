import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Users, Wallet, Settings } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();

  const navItems = [
    { path: '/', label: t('dashboard'), icon: Home },
    { path: '/profile', label: t('ownerProfile'), icon: Wallet },
    { path: '/settings', label: t('settings'), icon: Settings },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#1B1627]/95 backdrop-blur-md border-t border-purple-100 dark:border-purple-950/50 py-1.5 px-6 shadow-lg sm:hidden">
      <div className="max-w-md mx-auto flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
                isActive
                  ? 'text-[#7542C8] dark:text-purple-400 font-semibold scale-105'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
              <span className="text-[11px] leading-none">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
