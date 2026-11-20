import React, { useState } from 'react';
import { Lock, Eye, EyeOff, ShieldCheck, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Button } from '../components/common/Button';

export const ResetPasswordPage = () => {
  const { lang } = useLanguage();
  const { updatePassword, cancelPasswordRecovery, signOut, user } = useAuth();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (newPassword.length < 6) {
      setErrorMsg(
        lang === 'bn'
          ? 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।'
          : 'Password must be at least 6 characters.'
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg(
        lang === 'bn'
          ? 'উভয় পাসওয়ার্ড একই হতে হবে।'
          : 'Passwords do not match.'
      );
      return;
    }

    setIsLoading(true);
    try {
      await updatePassword(newPassword);
      setSuccessMsg(
        lang === 'bn'
          ? 'আপনার পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে!'
          : 'Your password has been successfully updated!'
      );
      // Clean up URL route to home
      window.history.replaceState(null, '', '/');
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = async () => {
    cancelPasswordRecovery();
    window.history.replaceState(null, '', '/');
  };

  return (
    <div className="min-h-screen bg-[#F7F5FC] dark:bg-[#120E1C] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-[#1E192B] rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 p-6 sm:p-8">
        {/* App Logo & Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#7542C8] to-[#9A6EE8] shadow-lg shadow-purple-500/25 mb-3">
            <Lock className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
            {lang === 'bn' ? 'নতুন পাসওয়ার্ড সেট করুন' : 'Set New Password'}
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
            {lang === 'bn'
              ? 'আপনার অ্যাকাউন্টের জন্য একটি নতুন পাসওয়ার্ড প্রদান করুন'
              : 'Choose a new secure password for your account'}
          </p>
          {user?.email && (
            <div className="inline-block mt-2 px-3 py-1 bg-purple-50 dark:bg-purple-950/40 text-[#7542C8] dark:text-purple-300 rounded-full text-xs font-medium">
              {user.email}
            </div>
          )}
        </div>

        {/* Status Alerts */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 flex items-start gap-2.5 text-red-600 dark:text-red-400 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900/50 flex items-start gap-2.5 text-green-600 dark:text-green-400 text-xs">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Password Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              {lang === 'bn' ? 'নতুন পাসওয়ার্ড' : 'New Password'} *
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                autoFocus
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-2.5 text-sm rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#141021] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#7542C8] transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1"
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-gray-400 mt-1">
              {lang === 'bn' ? 'কমপক্ষে ৬টি অক্ষর হতে হবে' : 'Must be at least 6 characters'}
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              {lang === 'bn' ? 'নতুন পাসওয়ার্ড পুনরায় লিখুন' : 'Confirm New Password'} *
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-2.5 text-sm rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#141021] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#7542C8] transition-all"
              />
            </div>
          </div>

          <div className="pt-2 space-y-2">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full justify-center shadow-lg shadow-purple-500/20"
              disabled={isLoading || newPassword.length < 6 || confirmPassword.length < 6}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  {lang === 'bn' ? 'সংরক্ষণ হচ্ছে...' : 'Saving...'}
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" />
                  {lang === 'bn' ? 'পাসওয়ার্ড নিশ্চিত ও পরিবর্তন করুন' : 'Confirm & Change Password'}
                </span>
              )}
            </Button>

            <button
              type="button"
              onClick={handleCancel}
              className="w-full text-center py-2 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              {lang === 'bn' ? 'পরে পরিবর্তন করব (অ্যাপে প্রবেশ করুন)' : 'Skip for now (Continue to App)'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
