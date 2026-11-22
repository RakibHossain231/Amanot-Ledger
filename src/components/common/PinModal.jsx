import React, { useState } from 'react';
import { Lock, Delete, KeyRound, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

export const PinModal = () => {
  const { isLocked, unlockWithPin, signOut } = useAuth();
  const { lang } = useLanguage();
  const [enteredPin, setEnteredPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isLocked) return null;

  const handleKeyPress = (num) => {
    if (enteredPin.length < 4) {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(25);
      }
      const nextPin = enteredPin + num;
      setEnteredPin(nextPin);
      setErrorMsg('');

      if (nextPin.length === 4) {
        setTimeout(() => {
          const success = unlockWithPin(nextPin);
          if (success) {
            if (typeof navigator !== 'undefined' && navigator.vibrate) {
              navigator.vibrate([30, 40, 30]);
            }
          } else {
            if (typeof navigator !== 'undefined' && navigator.vibrate) {
              navigator.vibrate([60, 40, 60]);
            }
            setErrorMsg(lang === 'bn' ? 'ভুল পিন কোড' : 'Incorrect PIN');
            setEnteredPin('');
          }
        }, 100);
      }
    }
  };

  const handleDelete = () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(35);
    }
    setEnteredPin((prev) => prev.slice(0, -1));
    setErrorMsg('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#171321]/95 backdrop-blur-md flex flex-col items-center justify-center p-4 select-none">
      <div className="w-full max-w-xs text-center space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-[#7542C8]/20 border border-purple-500/30 text-purple-300 flex items-center justify-center mx-auto shadow-inner">
          <Lock className="w-8 h-8 stroke-[2.2]" />
        </div>

        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            {lang === 'bn' ? 'নিরাপত্তা পিন দিন' : 'Enter Security PIN'}
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            {lang === 'bn' ? 'আপনার লেজার খাতা আনলক করতে ৪ সংখ্যার পিন দিন' : 'Enter 4-digit PIN to unlock your ledger'}
          </p>
        </div>

        {/* 4 Pin Dots */}
        <div className="flex justify-center gap-4 py-2">
          {[0, 1, 2, 3].map((idx) => (
            <div
              key={idx}
              className={`w-4 h-4 rounded-full transition-all duration-200 ${
                enteredPin.length > idx
                  ? 'bg-purple-400 scale-125 shadow-sm shadow-purple-500'
                  : 'bg-white/20'
              }`}
            />
          ))}
        </div>

        {errorMsg && (
          <p className="text-xs text-red-400 font-semibold">{errorMsg}</p>
        )}

        {/* Numeric Keypad */}
        <div className="grid grid-cols-3 gap-3 pt-2">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => handleKeyPress(num.toString())}
              className="h-14 rounded-2xl bg-white/10 hover:bg-white/20 active:bg-purple-600/40 text-xl font-bold text-white transition-all flex items-center justify-center shadow-sm"
            >
              {num}
            </button>
          ))}
          <div />
          <button
            type="button"
            onClick={() => handleKeyPress('0')}
            className="h-14 rounded-2xl bg-white/10 hover:bg-white/20 active:bg-purple-600/40 text-xl font-bold text-white transition-all flex items-center justify-center shadow-sm"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="h-14 rounded-2xl bg-white/10 hover:bg-white/20 active:bg-red-600/30 text-white transition-all flex items-center justify-center shadow-sm"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>

        {/* Forgot PIN / Sign In with Email Option */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => {
              if (
                window.confirm(
                  lang === 'bn'
                    ? 'পিন কোড ভুলে গেছেন? ইমেইল দিয়ে পুনরায় লগইন করতে চান?'
                    : 'Forgot PIN? Re-authenticate with your email?'
                )
              ) {
                signOut();
              }
            }}
            className="text-xs text-purple-300 hover:text-white underline cursor-pointer transition-colors"
          >
            {lang === 'bn' ? 'পিন ভুলে গেছেন? ইমেইল দিয়ে লগইন করুন' : 'Forgot PIN? Sign in with email'}
          </button>
        </div>
      </div>
    </div>
  );
};
