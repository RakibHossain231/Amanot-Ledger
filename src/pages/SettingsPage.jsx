import React from 'react';
import { Moon, Sun, Monitor, Globe, Shield, RefreshCw, Smartphone, Info } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

export const SettingsPage = () => {
  const { theme, setTheme } = useTheme();
  const { lang, setLang, t } = useLanguage();

  return (
    <div className="pb-24 pt-3 px-4 max-w-3xl mx-auto space-y-4">
      {/* 1. Language Settings */}
      <div className="bg-white dark:bg-[#211B30] rounded-2xl p-4 border border-purple-50 dark:border-purple-950/40 shadow-sm space-y-3">
        <div className="flex items-center gap-2 text-gray-900 dark:text-gray-100 font-bold text-sm">
          <Globe className="w-4 h-4 text-[#7542C8] dark:text-purple-400" />
          <span>{t('language')}</span>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <button
            onClick={() => setLang('bn')}
            className={`py-2.5 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
              lang === 'bn'
                ? 'border-[#7542C8] bg-purple-50 dark:bg-purple-950/40 text-[#7542C8] dark:text-purple-300 ring-2 ring-[#7542C8]/20'
                : 'border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          >
            <span>বাংলা (Bengali)</span>
          </button>

          <button
            onClick={() => setLang('en')}
            className={`py-2.5 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
              lang === 'en'
                ? 'border-[#7542C8] bg-purple-50 dark:bg-purple-950/40 text-[#7542C8] dark:text-purple-300 ring-2 ring-[#7542C8]/20'
                : 'border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          >
            <span>English</span>
          </button>
        </div>
      </div>

      {/* 2. Theme Settings */}
      <div className="bg-white dark:bg-[#211B30] rounded-2xl p-4 border border-purple-50 dark:border-purple-950/40 shadow-sm space-y-3">
        <div className="flex items-center gap-2 text-gray-900 dark:text-gray-100 font-bold text-sm">
          <Sun className="w-4 h-4 text-[#7542C8] dark:text-purple-400" />
          <span>{t('theme')}</span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => setTheme('light')}
            className={`py-2.5 px-2 rounded-xl border text-xs font-medium flex flex-col items-center gap-1.5 transition-all ${
              theme === 'light'
                ? 'border-[#7542C8] bg-purple-50 dark:bg-purple-950/40 text-[#7542C8] dark:text-purple-300 ring-2 ring-[#7542C8]/20'
                : 'border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          >
            <Sun className="w-4 h-4 text-amber-500" />
            <span>{t('light')}</span>
          </button>

          <button
            onClick={() => setTheme('dark')}
            className={`py-2.5 px-2 rounded-xl border text-xs font-medium flex flex-col items-center gap-1.5 transition-all ${
              theme === 'dark'
                ? 'border-[#7542C8] bg-purple-50 dark:bg-purple-950/40 text-[#7542C8] dark:text-purple-300 ring-2 ring-[#7542C8]/20'
                : 'border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          >
            <Moon className="w-4 h-4 text-indigo-400" />
            <span>{t('dark')}</span>
          </button>

          <button
            onClick={() => setTheme('system')}
            className={`py-2.5 px-2 rounded-xl border text-xs font-medium flex flex-col items-center gap-1.5 transition-all ${
              theme === 'system'
                ? 'border-[#7542C8] bg-purple-50 dark:bg-purple-950/40 text-[#7542C8] dark:text-purple-300 ring-2 ring-[#7542C8]/20'
                : 'border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          >
            <Monitor className="w-4 h-4 text-gray-500" />
            <span>{t('system')}</span>
          </button>
        </div>
      </div>

      {/* 3. Sync & Security Status */}
      <div className="bg-white dark:bg-[#211B30] rounded-2xl p-4 border border-purple-50 dark:border-purple-950/40 shadow-sm space-y-3">
        <div className="flex items-center gap-2 text-gray-900 dark:text-gray-100 font-bold text-sm">
          <RefreshCw className="w-4 h-4 text-[#7542C8] dark:text-purple-400" />
          <span>{lang === 'bn' ? 'সিঙ্ক এবং অফলাইন স্ট্যাটাস' : 'Sync & Offline Status'}</span>
        </div>

        <div className="flex items-center justify-between text-xs py-2 px-3 rounded-xl bg-purple-50/50 dark:bg-purple-950/20">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span>
            <span className="text-gray-700 dark:text-gray-300 font-medium">
              {lang === 'bn' ? 'অফলাইন ডাটাবেজ প্রস্তুত' : 'Offline Database Ready'}
            </span>
          </div>
          <span className="text-[10px] text-gray-400">IndexedDB Local</span>
        </div>
      </div>

      {/* 4. App Info */}
      <div className="bg-white dark:bg-[#211B30] rounded-2xl p-4 border border-purple-50 dark:border-purple-950/40 shadow-sm space-y-2 text-xs text-gray-500 dark:text-gray-400">
        <div className="flex items-center gap-2 text-gray-900 dark:text-gray-100 font-bold text-sm mb-1">
          <Info className="w-4 h-4 text-[#7542C8] dark:text-purple-400" />
          <span>{lang === 'bn' ? 'অ্যাপ পরিচিতি' : 'About Application'}</span>
        </div>
        <p><strong className="text-gray-800 dark:text-gray-200">Amanot Ledger (আমানত লেজার)</strong> v1.0.0</p>
        <p>{lang === 'bn' ? 'স্মার্ট আমানত ও লেনদেন ব্যবস্থাপনা' : 'Smart Money & Person-based Ledger Management'}</p>
        <p className="text-[11px] pt-1 border-t border-gray-100 dark:border-gray-800">
          Currency: Bangladeshi Taka (৳) • Offline-First PWA
        </p>
      </div>
    </div>
  );
};
