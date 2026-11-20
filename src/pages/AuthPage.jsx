import React, { useState, useEffect } from 'react';
import { Mail, Lock, User, ArrowRight, ShieldCheck, KeyRound, AlertCircle, CheckCircle2, RefreshCw, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';

export const AuthPage = () => {
  const { lang, t } = useLanguage();
  const { signIn, signUp, verifyEmailOtp, resendOtp, resetPassword, enableGuestMode } = useAuth();

  const [mode, setMode] = useState('login'); // 'login' | 'signup' | 'verify'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [otpCode, setOtpCode] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Resend cooldown timer
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  // Forgot password modal
  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetMsg, setResetMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setIsLoading(true);

    try {
      if (mode === 'login') {
        await signIn(email, password);
      } else if (mode === 'signup') {
        const res = await signUp(email, password, fullName);
        setMode('verify');
        setResendCooldown(30);
        setSuccessMsg(lang === 'bn' 
          ? `আপনার ইমেইলে (${email}) একটি ভেরিফিকেশন কোড পাঠানো হয়েছে। কোডটি নিচে দিন:` 
          : `A verification code was sent to ${email}. Please enter it below:`);
      } else if (mode === 'verify') {
        await verifyEmailOtp({ email, token: otpCode });
      }
    } catch (err) {
      setErrorMsg(err.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setErrorMsg('');
    try {
      await resendOtp(email);
      setResendCooldown(30);
      setSuccessMsg(lang === 'bn' ? 'নতুন ভেরিফিকেশন কোড পাঠানো হয়েছে।' : 'New verification code sent.');
    } catch (err) {
      setErrorMsg(err.message || 'Failed to resend code');
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!resetEmail) return;
    try {
      await resetPassword(resetEmail);
      setResetMsg(lang === 'bn' ? 'পাসওয়ার্ড রিসেট লিঙ্ক আপনার ইমেইলে পাঠানো হয়েছে।' : 'Password reset link sent to your email.');
    } catch (err) {
      setResetMsg(err.message || 'Failed to send reset email');
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F5FC] dark:bg-[#171321] flex flex-col justify-center items-center px-4 py-8">
      <div className="w-full max-w-md bg-white dark:bg-[#211B30] rounded-3xl shadow-xl border border-purple-100 dark:border-purple-900/40 p-6 sm:p-8 space-y-6">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <img src="/logo.svg" alt="Amanot Ledger Logo" className="w-16 h-16 mx-auto rounded-2xl shadow-md" />
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
            Amanot Ledger - আমানত লেজার
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {lang === 'bn' ? 'স্মার্ট আমানত ও লেনদেন ব্যবস্থাপনা' : 'Smart Money & Personal Ledger Management'}
          </p>
        </div>

        {/* Mode Tabs (hidden during OTP verify) */}
        {mode !== 'verify' ? (
          <div className="grid grid-cols-2 p-1 bg-purple-50/60 dark:bg-purple-950/40 rounded-xl border border-purple-100 dark:border-purple-900/30">
            <button
              type="button"
              onClick={() => { setMode('login'); setErrorMsg(''); setSuccessMsg(''); }}
              className={`py-2 text-xs font-bold rounded-lg transition-all ${
                mode === 'login'
                  ? 'bg-white dark:bg-[#211B30] text-[#7542C8] dark:text-purple-300 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900'
              }`}
            >
              {lang === 'bn' ? 'লগইন' : 'Sign In'}
            </button>

            <button
              type="button"
              onClick={() => { setMode('signup'); setErrorMsg(''); setSuccessMsg(''); }}
              className={`py-2 text-xs font-bold rounded-lg transition-all ${
                mode === 'signup'
                  ? 'bg-white dark:bg-[#211B30] text-[#7542C8] dark:text-purple-300 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900'
              }`}
            >
              {lang === 'bn' ? 'নতুন অ্যাকাউন্ট' : 'Register'}
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between pb-1 border-b border-gray-100 dark:border-gray-800">
            <button
              type="button"
              onClick={() => { setMode('signup'); setOtpCode(''); setErrorMsg(''); }}
              className="text-xs text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 flex items-center gap-1 font-semibold"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? 'ইমেইল পরিবর্তন' : 'Change Email'}</span>
            </button>
            <span className="text-xs font-bold text-[#7542C8] dark:text-purple-300">
              {lang === 'bn' ? 'ইমেইল ভেরিফিকেশন' : 'Email Verification'}
            </span>
          </div>
        )}

        {/* Feedback Messages */}
        {errorMsg && (
          <div className="flex items-center gap-2 p-3 text-xs text-red-600 bg-red-50 dark:bg-red-950/40 rounded-xl border border-red-200 dark:border-red-900/30">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="flex items-center gap-2 p-3 text-xs text-green-700 bg-green-50 dark:bg-green-950/40 rounded-xl border border-green-200 dark:border-green-900/30">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'verify' ? (
            /* OTP Verification Screen */
            <div className="space-y-4">
              <div className="p-3 bg-purple-50/70 dark:bg-purple-950/30 rounded-2xl border border-purple-100 dark:border-purple-900/30 text-center space-y-1">
                <span className="text-[11px] text-gray-500 dark:text-gray-400 block">
                  {lang === 'bn' ? 'ভেরিফিকেশন কোড পাঠানো হয়েছে:' : 'Verification code sent to:'}
                </span>
                <span className="text-xs font-bold text-[#7542C8] dark:text-purple-300 break-all">
                  {email}
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 text-center">
                  {lang === 'bn' ? 'ইমেইলে পাঠানো ভেরিফিকেশন কোড দিন' : 'Enter Verification Code'} *
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={8}
                  required
                  autoFocus
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="12345678"
                  className="w-full text-center tracking-[0.35em] text-xl sm:text-2xl font-bold py-3 px-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1B1627] text-gray-900 dark:text-gray-100 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#7542C8]"
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={isLoading || otpCode.length < 6}
                className="w-full"
              >
                {isLoading 
                  ? (lang === 'bn' ? 'যাচাই করা হচ্ছে...' : 'Verifying...') 
                  : (lang === 'bn' ? 'কোড সাবমিট ও অ্যাকাউন্ট সক্রিয় করুন' : 'Verify & Activate Account')}
              </Button>

              <div className="text-center pt-1">
                <button
                  type="button"
                  disabled={resendCooldown > 0}
                  onClick={handleResend}
                  className="text-xs font-medium text-gray-500 hover:text-purple-600 disabled:opacity-50"
                >
                  {resendCooldown > 0 
                    ? (lang === 'bn' ? `আবার কোড পাঠানো যাবে ${resendCooldown} সেকেন্ড পর` : `Resend in ${resendCooldown}s`)
                    : (lang === 'bn' ? 'কোড পাননি? পুনরায় কোড পাঠান' : 'Didn\'t receive code? Resend')}
                </button>
              </div>
            </div>
          ) : (
            /* Login / Signup Fields */
            <>
              {mode === 'signup' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    {lang === 'bn' ? 'আপনার নাম' : 'Full Name'} *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="যেমন: মোঃ রাকিব হোসেন"
                      className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1B1627] text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7542C8]"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  {lang === 'bn' ? 'ইমেইল এড্রেস' : 'Email Address'} *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="owner@example.com"
                    className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1B1627] text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7542C8]"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                    {lang === 'bn' ? 'পাসওয়ার্ড' : 'Password'} *
                  </label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => setIsForgotOpen(true)}
                      className="text-[11px] text-[#7542C8] dark:text-purple-400 hover:underline"
                    >
                      {lang === 'bn' ? 'পাসওয়ার্ড ভুলে গেছেন?' : 'Forgot password?'}
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1B1627] text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7542C8]"
                  />
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={isLoading}
                className="w-full mt-2"
              >
                {isLoading 
                  ? (lang === 'bn' ? 'প্রক্রিয়াধীন...' : 'Processing...') 
                  : (mode === 'login' 
                      ? (lang === 'bn' ? 'লগইন করুন' : 'Sign In') 
                      : (lang === 'bn' ? 'ভেরিফিকেশন কোড পাঠান' : 'Send Verification Code'))}
              </Button>
            </>
          )}
        </form>

        {/* Offline / Local Guest Access */}
        <div className="pt-2 border-t border-gray-100 dark:border-gray-800 text-center">
          <p className="text-[11px] text-gray-400 mb-2">
            {lang === 'bn' ? 'অথবা ইন্টারনেট ছাড়া অফলাইনে ব্যবহার করতে চান?' : 'Or want to use offline without signing in?'}
          </p>
          <button
            type="button"
            onClick={enableGuestMode}
            className="text-xs font-semibold text-[#7542C8] dark:text-purple-300 hover:underline flex items-center justify-center gap-1.5 mx-auto"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{lang === 'bn' ? 'লোকাল অফলাইন মোডে প্রবেশ করুন' : 'Continue in Local Offline Mode'}</span>
          </button>
        </div>
      </div>

      {/* Forgot Password Modal */}
      <Modal
        isOpen={isForgotOpen}
        onClose={() => { setIsForgotOpen(false); setResetMsg(''); }}
        title={lang === 'bn' ? 'পাসওয়ার্ড পুনরুদ্ধার' : 'Reset Password'}
      >
        <form onSubmit={handleResetPassword} className="space-y-4">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {lang === 'bn' 
              ? 'আপনার ইমেইল এড্রেসটি দিন। আমরা পাসওয়ার্ড রিসেট করার লিঙ্ক পাঠিয়ে দেব।' 
              : 'Enter your email to receive password reset link.'}
          </p>
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              {lang === 'bn' ? 'ইমেইল' : 'Email'}
            </label>
            <input
              type="email"
              required
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              placeholder="owner@example.com"
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1B1627] text-gray-900 dark:text-gray-100"
            />
          </div>

          {resetMsg && (
            <p className="text-xs font-medium text-purple-600 dark:text-purple-300">{resetMsg}</p>
          )}

          <div className="flex items-center justify-end gap-2 pt-1">
            <Button variant="outline" size="sm" onClick={() => setIsForgotOpen(false)}>
              {t('cancel')}
            </Button>
            <Button type="submit" variant="primary" size="sm">
              {lang === 'bn' ? 'লিঙ্ক পাঠান' : 'Send Link'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
