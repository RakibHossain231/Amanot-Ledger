import React, { useState, useEffect } from 'react';
import { Moon, Sun, Monitor, Globe, Shield, RefreshCw, Smartphone, Info, Download, Upload, CheckCircle2, AlertCircle } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { syncService } from '../services/sync';
import { db } from '../services/db';
import { Button } from '../components/common/Button';

export const SettingsPage = () => {
  const { theme, setTheme } = useTheme();
  const { lang, setLang, t } = useLanguage();

  const [syncInfo, setSyncInfo] = useState({
    isOnline: true,
    status: 'idle',
    lastSync: null,
  });
  const [syncMsg, setSyncMsg] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const unsubscribe = syncService.subscribe((info) => {
      setSyncInfo(info);
    });
    return unsubscribe;
  }, []);

  const handleManualSync = async () => {
    setIsSyncing(true);
    setSyncMsg('');
    const res = await syncService.syncNow();
    setIsSyncing(false);
    if (res.success) {
      setSyncMsg(lang === 'bn' ? 'সফলভাবে সিঙ্ক সম্পন্ন হয়েছে' : 'Synced successfully');
    } else {
      setSyncMsg(res.message || res.error || (lang === 'bn' ? 'সিঙ্ক করা যায়নি' : 'Sync failed'));
    }
  };

  // Backup Database to JSON
  const handleBackupData = async () => {
    const backup = {
      version: 1,
      appName: 'Amanot Ledger',
      exportedAt: new Date().toISOString(),
      accounts: await db.accounts.toArray(),
      transactions: await db.transactions.toArray(),
      methods: await db.methods.toArray(),
      transfers: await db.transfers.toArray(),
    };

    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Amanot_Ledger_Backup_${Date.now()}.json`;
    link.click();
  };

  // Restore Database from JSON
  const handleRestoreFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (data.accounts && data.transactions) {
          if (window.confirm(lang === 'bn' ? 'বর্তমান তথ্যের সাথে ব্যাকআপ তথ্য রিস্টোর করতে চান?' : 'Restore backup and overwrite local records?')) {
            await db.accounts.clear();
            await db.transactions.clear();
            await db.methods.clear();
            await db.transfers.clear();

            await db.accounts.bulkAdd(data.accounts);
            await db.transactions.bulkAdd(data.transactions);
            if (data.methods) await db.methods.bulkAdd(data.methods);
            if (data.transfers) await db.transfers.bulkAdd(data.transfers);

            alert(lang === 'bn' ? 'ডাটা রিস্টোর সম্পন্ন হয়েছে!' : 'Data restored successfully!');
            window.location.reload();
          }
        } else {
          alert('Invalid backup file.');
        }
      } catch (err) {
        alert('Failed to parse backup file: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

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

      {/* 3. Sync & Cloud Status */}
      <div className="bg-white dark:bg-[#211B30] rounded-2xl p-4 border border-purple-50 dark:border-purple-950/40 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-gray-900 dark:text-gray-100 font-bold text-sm">
            <RefreshCw className={`w-4 h-4 text-[#7542C8] dark:text-purple-400 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{lang === 'bn' ? 'ক্লাউড সিঙ্ক এবং ব্যাকআপ' : 'Cloud Sync & Backup'}</span>
          </div>

          <Button
            size="sm"
            variant="secondary"
            onClick={handleManualSync}
            disabled={isSyncing}
          >
            {isSyncing ? (lang === 'bn' ? 'সিঙ্ক হচ্ছে...' : 'Syncing...') : (lang === 'bn' ? 'এখনই সিঙ্ক' : 'Sync Now')}
          </Button>
        </div>

        <div className="p-3 rounded-xl bg-purple-50/50 dark:bg-purple-950/20 space-y-1.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-gray-500 dark:text-gray-400">
              {lang === 'bn' ? 'নেটওয়ার্ক সংযোগ:' : 'Connection:'}
            </span>
            <span className="font-semibold flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${syncInfo.isOnline ? 'bg-green-500' : 'bg-red-500'}`}></span>
              {syncInfo.isOnline ? (lang === 'bn' ? 'অনলাইন' : 'Online') : (lang === 'bn' ? 'অফলাইন' : 'Offline')}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-gray-500 dark:text-gray-400">
              {lang === 'bn' ? 'সিঙ্ক স্ট্যাটাস:' : 'Sync Status:'}
            </span>
            <span className="font-semibold text-purple-700 dark:text-purple-300">
              {syncInfo.status === 'synced' ? 'Synced (IndexedDB Active)' : syncInfo.status}
            </span>
          </div>

          {syncInfo.lastSync && (
            <div className="flex items-center justify-between text-[11px] text-gray-400 pt-1">
              <span>{lang === 'bn' ? 'সর্বশেষ সিঙ্ক:' : 'Last Synced:'}</span>
              <span>{new Date(syncInfo.lastSync).toLocaleTimeString()}</span>
            </div>
          )}

          {syncMsg && (
            <p className="text-[11px] text-[#7542C8] dark:text-purple-300 pt-1 font-medium">{syncMsg}</p>
          )}
        </div>

        {/* Local JSON Backup / Restore */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <Button
            variant="outline"
            size="sm"
            onClick={handleBackupData}
            icon={Download}
            className="text-xs"
          >
            {lang === 'bn' ? 'ব্যাকআপ ফাইল (.json)' : 'Backup (.json)'}
          </Button>

          <label className="inline-flex items-center justify-center font-medium rounded-xl transition-all border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 text-xs px-3 py-1.5 gap-1.5 cursor-pointer select-none">
            <Upload className="w-3.5 h-3.5" />
            <span>{lang === 'bn' ? 'রিস্টোর করুন' : 'Restore'}</span>
            <input
              type="file"
              accept=".json"
              onChange={handleRestoreFile}
              className="hidden"
            />
          </label>
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
          Currency: Bangladeshi Taka (৳) • Offline-First PWA • Cloudflare & Supabase Ready
        </p>
      </div>
    </div>
  );
};
