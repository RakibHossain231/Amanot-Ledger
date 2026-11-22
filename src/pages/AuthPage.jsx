import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User, ArrowRight, ShieldCheck, KeyRound, AlertCircle, CheckCircle2, RefreshCw, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';

export const AuthPage = () => {
  const navigate = useNavigate();
  const { lang, t } = useLanguage();
  const {
    signIn,
    signUp,
    verifyEmailOtp,
    resendOtp,
    sendPasswordResetOtp,
    verifyPasswordResetOtp,
    updatePassword,
    enableGuestMode,
  } = useAuth();

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

  // Forgot password states
  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [forgotStep, setForgotStep] = useState('email'); // 'email' | 'otp' | 'new_password'
  const [resetEmail, setResetEmail] = useState('');
  const [resetOtp, setResetOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');
  const [isForgotLoading, setIsForgotLoading] = useState(false);

  const handleOpenForgot = () => {
    setForgotStep('email');
    setResetEmail(email || '');
    setResetOtp('');
    setNewPassword('');
    setConfirmPassword('');
    setResetError('');
    setResetSuccess('');
    setIsForgotOpen(true);
  };

  const handleSendResetCode = async (e) => {
    e.preventDefault();
    if (!resetEmail.trim()) return;
    setResetError('');
    setResetSuccess('');
    setIsForgotLoading(true);

    try {
      await sendPasswordResetOtp(resetEmail.trim());
      setForgotStep('otp');
      setResetSuccess(lang === 'bn' 
        ? `${resetEmail} এ পাসওয়ার্ড রিসেট কোড পাঠানো হয়েছে।` 
        : `Reset code sent to ${resetEmail}.`);
    } catch (err) {
      setResetError(err.message || 'Failed to send reset code');
    } finally {
      setIsForgotLoading(false);
    }
  };

  const handleVerifyResetOtp = async (e) => {
    e.preventDefault();
    if (!resetOtp.trim()) return;
    setResetError('');
    setResetSuccess('');
    setIsForgotLoading(true);

    try {
      await verifyPasswordResetOtp({ email: resetEmail, token: resetOtp.trim() });
      setIsForgotOpen(false);
    } catch (err) {
      setResetError(err.message || 'Invalid verification code');
      setIsForgotLoading(false);
    }
  };

  const handleSetNewPassword = async (e) => {
    e.preventDefault();
    setResetError('');
    if (newPassword.length < 6) {
      setResetError(lang === 'bn' ? 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে' : 'Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setResetError(lang === 'bn' ? 'উভয় পাসওয়ার্ড একই হতে হবে' : 'Passwords do not match');
      return;
    }

    setIsForgotLoading(true);
    try {
      await updatePassword(newPassword);
      setResetSuccess(lang === 'bn' ? 'পাসওয়ার্ড সফলভাবে পরিবর্তন হয়েছে!' : 'Password changed successfully!');
      setTimeout(() => {
        setIsForgotOpen(false);
      }, 1200);
    } catch (err) {
      setResetError(err.message || 'Failed to update password');
    } finally {
      setIsForgotLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setIsLoading(true);

    try {
      if (mode === 'login') {
        await signIn(email, password);
        navigate('/', { replace: true });
      } else if (mode === 'signup') {
        const res = await signUp(email, password, fullName);
        setMode('verify');
        setResendCooldown(30);
        setSuccessMsg(lang === 'bn' 
          ? `আপনার ইমেইলে (${email}) একটি ভেরিফিকেশন কোড পাঠানো হয়েছে। কোডটি নিচে দিন:` 
          : `A verification code was sent to ${email}. Please enter it below:`);
      } else if (mode === 'verify') {
        await verifyEmailOtp({ email, token: otpCode });
        navigate('/', { replace: true });
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
                      onClick={handleOpenForgot}
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

        {/* Offline PIN Feature Reassurance */}
        <div className="pt-2 border-t border-gray-100 dark:border-gray-800 text-center">
          <p className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center justify-center gap-1.5 font-medium">
            <ShieldCheck className="w-4 h-4 text-[#7542C8] dark:text-purple-400 shrink-0" />
            <span>
              {lang === 'bn'
                ? '১ বার লগইন করুন • এরপর সম্পূর্ণ অফলাইনে পিন দিয়ে প্রবেশ করতে পারবেন'
                : 'One-time login • Then enjoy fast offline PIN access'}
            </span>
          </p>
        </div>
      </div>

      {/* 3-Step Forgot Password & Reset Modal */}
      <Modal
        isOpen={isForgotOpen}
        onClose={() => setIsForgotOpen(false)}
        title={lang === 'bn' ? 'পাসওয়ার্ড পুনরুদ্ধার ও পরিবর্তন' : 'Reset & Update Password'}
      >
        <div className="space-y-4">
          {resetError && (
            <div className="flex items-center gap-2 p-2.5 text-xs text-red-600 bg-red-50 dark:bg-red-950/40 rounded-xl border border-red-200 dark:border-red-900/30">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{resetError}</span>
            </div>
          )}

          {resetSuccess && (
            <div className="flex items-center gap-2 p-2.5 text-xs text-green-700 bg-green-50 dark:bg-green-950/40 rounded-xl border border-green-200 dark:border-green-900/30">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{resetSuccess}</span>
            </div>
          )}

          {forgotStep === 'email' && (
            /* Step 1: Request OTP by Email */
            <form onSubmit={handleSendResetCode} className="space-y-4">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {lang === 'bn' 
                  ? 'আপনার অ্যাকাউন্টের রেজিস্টার্ড ইমেইল এড্রেসটি দিন। আমরা সেখানে একটি গোপন রিসেট কোড পাঠাব।' 
                  : 'Enter your registered email address to receive a password reset code.'}
              </p>
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  {lang === 'bn' ? 'ইমেইল এড্রেস' : 'Email Address'} *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    required
                    autoFocus
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="owner@example.com"
                    className="w-full pl-10 pr-3.5 py-2 text-sm rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1B1627] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#7542C8]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <Button variant="outline" size="sm" onClick={() => setIsForgotOpen(false)}>
                  {t('cancel')}
                </Button>
                <Button type="submit" variant="primary" size="sm" disabled={isForgotLoading}>
                  {isForgotLoading ? (lang === 'bn' ? 'পাঠানো হচ্ছে...' : 'Sending...') : (lang === 'bn' ? 'রিসেট কোড পাঠান' : 'Send Reset Code')}
                </Button>
              </div>
            </form>
          )}

          {forgotStep === 'otp' && (
            /* Step 2: Verify Recovery OTP */
            <form onSubmit={handleVerifyResetOtp} className="space-y-4">
              <div className="p-2.5 bg-purple-50 dark:bg-purple-950/30 rounded-xl text-center text-xs">
                <span className="text-gray-500 block">{lang === 'bn' ? 'কোড পাঠানো হয়েছে:' : 'Code sent to:'}</span>
                <span className="font-bold text-[#7542C8] dark:text-purple-300">{resetEmail}</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 text-center">
                  {lang === 'bn' ? 'ইমেইলে আসা ভেরিফিকেশন কোড দিন' : 'Enter Verification Code'} *
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={8}
                  required
                  autoFocus
                  value={resetOtp}
                  onChange={(e) => setResetOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="12345678"
                  className="w-full text-center tracking-[0.35em] text-xl font-bold py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1B1627] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#7542C8]"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => setForgotStep('email')}
                  className="text-xs text-gray-500 hover:text-gray-800"
                >
                  {lang === 'bn' ? 'ইমেইল পরিবর্তন' : 'Change Email'}
                </button>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setIsForgotOpen(false)}>
                    {t('cancel')}
                  </Button>
                  <Button type="submit" variant="primary" size="sm" disabled={isForgotLoading || resetOtp.length < 6}>
                    {isForgotLoading ? (lang === 'bn' ? 'যাচাই হচ্ছে...' : 'Verifying...') : (lang === 'bn' ? 'কোড যাচাই করুন' : 'Verify Code')}
                  </Button>
                </div>
              </div>
            </form>
          )}

          {forgotStep === 'new_password' && (
            /* Step 3: Set New Password */
            <form onSubmit={handleSetNewPassword} className="space-y-4">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {lang === 'bn' ? 'আপনার অ্যাকাউন্টের জন্য একটি নতুন পাসওয়ার্ড সেট করুন:' : 'Set a new password for your account:'}
              </p>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  {lang === 'bn' ? 'নতুন পাসওয়ার্ড' : 'New Password'} *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    autoFocus
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3.5 py-2 text-sm rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1B1627] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#7542C8]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  {lang === 'bn' ? 'নতুন পাসওয়ার্ড পুনরায় লিখুন' : 'Confirm New Password'} *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3.5 py-2 text-sm rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1B1627] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#7542C8]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <Button type="submit" variant="primary" size="md" className="w-full" disabled={isForgotLoading}>
                  {isForgotLoading 
                    ? (lang === 'bn' ? 'আপডেট হচ্ছে...' : 'Updating...') 
                    : (lang === 'bn' ? 'পাসওয়ার্ড নিশ্চিত ও পরিবর্তন করুন' : 'Update Password & Sign In')}
                </Button>
              </div>
            </form>
          )}
        </div>
      </Modal>
    </div>
  );
};
