import React, { useState } from 'react';
import { Lock, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { syncService } from '../services/sync';
import { Button } from '../components/common/Button';

export const SetupPinPage = () => {
  const { setPin, user } = useAuth();
  const { lang } = useLanguage();

  const [pin, setPinValue] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (pin.length !== 4 || isNaN(Number(pin))) {
      setErrorMsg(
        lang === 'bn'
          ? 'পিন কোড অবশ্যই ৪ সংখ্যার হতে হবে।'
          : 'PIN must be exactly 4 numeric digits.'
      );
      return;
    }

    if (pin !== confirmPin) {
      setErrorMsg(
        lang === 'bn'
          ? 'উভয় পিন কোড একই হতে হবে।'
          : 'PIN codes do not match.'
      );
      return;
    }

    setIsLoading(true);
    try {
      setPin(pin);
      // Background sync to pull remote data immediately
      syncService.syncNow().catch(() => {});
    } catch (err) {
      setErrorMsg(err.message || 'Failed to save PIN');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F5FC] dark:bg-[#120E1C] flex flex-col items-center justify-center p-4 select-none">
      <div className="w-full max-w-sm bg-white dark:bg-[#1E192B] rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800 p-6 sm:p-8">
        
        {/* App Logo & Icon */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#7542C8] to-[#9A6EE8] shadow-lg shadow-purple-500/25 mb-3 text-white">
            <Lock className="w-7 h-7" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
            {lang === 'bn' ? '৪ সংখ্যার গোপন পিন সেট করুন' : 'Set 4-Digit Security PIN'}
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 leading-relaxed">
            {lang === 'bn'
              ? 'এই ডিভাইসে প্রতিদিন দ্রুত ও অফলাইনে হিসাব খোলার জন্য একটি ৪ সংখ্যার পিন দিন'
              : 'Set a 4-digit PIN for fast, offline daily access on this device'}
          </p>
          {user?.email && (
            <div className="inline-block mt-2.5 px-3 py-1 bg-purple-50 dark:bg-purple-950/40 text-[#7542C8] dark:text-purple-300 rounded-full text-xs font-medium">
              {user.email}
            </div>
          )}
        </div>

        {/* Alert Error */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 flex items-start gap-2.5 text-red-600 dark:text-red-400 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* PIN Setup Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 text-center">
              {lang === 'bn' ? 'নতুন পিন কোড (৪ ডিজিট)' : 'New PIN (4 Digits)'} *
            </label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              required
              autoFocus
              value={pin}
              onChange={(e) => setPinValue(e.target.value.replace(/\D/g, ''))}
              placeholder="••••"
              className="w-full text-center tracking-[0.8em] text-2xl font-bold py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#141021] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#7542C8] transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 text-center">
              {lang === 'bn' ? 'পিন কোডটি পুনরায় নিশ্চিত করুন' : 'Confirm New PIN'} *
            </label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              required
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
              placeholder="••••"
              className="w-full text-center tracking-[0.8em] text-2xl font-bold py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#141021] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#7542C8] transition-all"
            />
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full justify-center shadow-lg shadow-purple-500/20"
              disabled={isLoading || pin.length !== 4 || confirmPin.length !== 4}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  {lang === 'bn' ? 'সংরক্ষণ হচ্ছে...' : 'Saving...'}
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" />
                  {lang === 'bn' ? 'পিন সেট করুন ও অ্যাপে প্রবেশ করুন' : 'Save PIN & Continue'}
                </span>
              )}
            </Button>
          </div>
        </form>

        <p className="text-[11px] text-gray-400 text-center mt-4">
          {lang === 'bn'
            ? 'পরবর্তীতে সেটিংস থেকে যেকোনো সময় পিন পরিবর্তন করতে পারবেন'
            : 'You can change or reset this PIN anytime from settings'}
        </p>
      </div>
    </div>
  );
};
