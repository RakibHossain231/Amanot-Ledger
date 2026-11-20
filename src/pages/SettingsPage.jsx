import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Moon, Sun, Monitor, Globe, Shield, RefreshCw, Smartphone, Info, Download, Upload, CheckCircle2, AlertCircle, Lock, LogOut, KeyRound } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { syncService } from '../services/sync';
import { db } from '../services/db';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';

export const SettingsPage = () => {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { lang, setLang, t } = useLanguage();
  const { user, guestMode, signOut, savedPin, setPin, removePin } = useAuth();

  const [syncInfo, setSyncInfo] = useState({
    isOnline: true,
    status: 'idle',
    lastSync: null,
  });
  const [syncMsg, setSyncMsg] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);

  // PIN settings state
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');

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

  const handleSavePin = (e) => {
    e.preventDefault();
    if (pinInput.length !== 4 || isNaN(Number(pinInput))) {
      setPinError(lang === 'bn' ? 'পিন অবশ্যই ৪ সংখ্যার হতে হবে' : 'PIN must be exactly 4 digits');
      return;
    }
    setPin(pinInput);
    setIsPinModalOpen(false);
    setPinInput('');
    setPinError('');
  };

  return (
    <div className="pb-24 pt-3 px-4 max-w-3xl mx-auto space-y-4">
      {/* 1. User Profile & Account Banner (Top) */}
      <div className="bg-gradient-to-r from-purple-50/80 to-indigo-50/60 dark:from-[#251E38] dark:to-[#1C162B] rounded-2xl p-4 border border-purple-100 dark:border-purple-900/40 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 shrink-0 rounded-full bg-gradient-to-tr from-[#7542C8] to-[#9A6EE8] text-white flex items-center justify-center font-bold text-base shadow-md shadow-purple-500/20">
            {user?.user_metadata?.full_name 
              ? user.user_metadata.full_name[0].toUpperCase() 
              : (user?.email ? user.email[0].toUpperCase() : 'A')}
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">
              {user?.user_metadata?.full_name || (user ? 'Owner' : (guestMode ? (lang === 'bn' ? 'অফলাইন মোড' : 'Offline Mode') : 'Owner'))}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {user?.email || (guestMode ? (lang === 'bn' ? 'লোকাল অফলাইন মোডে চলছে' : 'Running locally') : 'amanot-owner')}
            </p>
          </div>
        </div>
        <div className="shrink-0 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-white/80 dark:bg-purple-950/60 text-[#7542C8] dark:text-purple-300 border border-purple-200 dark:border-purple-800">
          {user ? (lang === 'bn' ? 'সুপাবেস কানেক্টেড' : 'Supabase Active') : (lang === 'bn' ? 'অফলাইন' : 'Offline')}
        </div>
      </div>

      {/* 2. Language Settings */}
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

      {/* 3. Security & PIN Lock */}
      <div className="bg-white dark:bg-[#211B30] rounded-2xl p-4 border border-purple-50 dark:border-purple-950/40 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-gray-900 dark:text-gray-100 font-bold text-sm">
            <Lock className="w-4 h-4 text-[#7542C8] dark:text-purple-400" />
            <span>{lang === 'bn' ? 'অ্যাপ নিরাপত্তা ও পিন লক' : 'Security & PIN Lock'}</span>
          </div>

          {savedPin ? (
            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                if (window.confirm(lang === 'bn' ? 'পিন লক বন্ধ করতে চান?' : 'Remove PIN lock?')) {
                  removePin();
                }
              }}
            >
              {lang === 'bn' ? 'পিন বন্ধ করুন' : 'Remove PIN'}
            </Button>
          ) : (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => { setPinInput(''); setPinError(''); setIsPinModalOpen(true); }}
            >
              {lang === 'bn' ? 'পিন সেট করুন' : 'Set PIN'}
            </Button>
          )}
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-400">
          {savedPin 
            ? (lang === 'bn' ? 'পিন লক সক্রিয় রয়েছে। অ্যাপ খোলার সময় ৪ সংখ্যার পিন লাগবে।' : 'PIN Lock is active. 4-digit PIN required on app launch.')
            : (lang === 'bn' ? 'আপনার লেজার খাতা সুরক্ষিত রাখতে একটি ৪ সংখ্যার গোপন পিন সেট করুন।' : 'Set a 4-digit secret PIN to secure your ledger.')}
        </p>
      </div>

      {/* 4. Sync & Cloud Status */}
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

      {/* 5. App Info */}
      <div className="bg-white dark:bg-[#211B30] rounded-2xl p-4 border border-purple-50 dark:border-purple-950/40 shadow-sm space-y-2 text-xs text-gray-500 dark:text-gray-400">
        <div className="flex items-center gap-2 text-gray-900 dark:text-gray-100 font-bold text-sm mb-1">
          <Info className="w-4 h-4 text-[#7542C8] dark:text-purple-400" />
          <span>{lang === 'bn' ? 'অ্যাপ পরিচিতি' : 'About Application'}</span>
        </div>
        <p><strong className="text-gray-800 dark:text-gray-200">Amanot Ledger - আমানত লেজার</strong> v1.0.0</p>
        <p>{lang === 'bn' ? 'স্মার্ট আমানত ও লেনদেন ব্যবস্থাপনা' : 'Smart Money & Person-based Ledger Management'}</p>
        <p className="text-[11px] pt-1 border-t border-gray-100 dark:border-gray-800">
          Currency: Bangladeshi Taka (৳) • Offline-First PWA • Cloudflare & Supabase Ready
        </p>
      </div>

      {/* 6. Dedicated Bottom Logout Button */}
      <div className="pt-2">
        <button
          type="button"
          onClick={() => {
            if (window.confirm(lang === 'bn' ? 'আপনি কি নিশ্চিত যে আপনি লগআউট করতে চান?' : 'Are you sure you want to log out?')) {
              signOut();
              navigate('/', { replace: true });
            }
          }}
          className="w-full py-3.5 px-4 rounded-2xl border border-red-200 dark:border-red-900/40 bg-red-50/50 hover:bg-red-100/70 dark:bg-red-950/20 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-sm active:scale-[0.99] cursor-pointer"
        >
          <LogOut className="w-4 h-4 text-red-500" />
          <span>{lang === 'bn' ? 'লগআউট করুন' : 'Log Out of Account'}</span>
        </button>
      </div>

      {/* Set PIN Modal */}
      <Modal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        title={lang === 'bn' ? '৪ সংখ্যার নতুন পিন দিন' : 'Set 4-Digit Security PIN'}
      >
        <form onSubmit={handleSavePin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              {lang === 'bn' ? 'গোপন পিন কোড (৪ ডিজিট)' : 'Secret PIN (4 digits)'}
            </label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              required
              autoFocus
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
              placeholder="••••"
              className="w-full text-center tracking-[1em] text-2xl font-bold py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1B1627] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#7542C8]"
            />
            {pinError && (
              <p className="text-xs text-red-500 mt-1 font-medium">{pinError}</p>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setIsPinModalOpen(false)}>
              {t('cancel')}
            </Button>
            <Button type="submit" variant="primary" size="sm">
              {t('save')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
