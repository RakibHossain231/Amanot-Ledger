import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Wallet, Plus, ArrowRightLeft, CreditCard, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useLedger } from '../context/LedgerContext';
import { useLanguage } from '../context/LanguageContext';
import { formatCurrency } from '../utils/currency';
import { Modal } from '../components/common/Modal';
import { Button } from '../components/common/Button';

export const OwnerProfilePage = () => {
  const navigate = useNavigate();
  const { lang, t } = useLanguage();
  const { methods, getMethodBalances, addMethod, addTransfer } = useLedger();

  const methodBalances = getMethodBalances();
  const totalBalance = methodBalances.reduce((sum, m) => sum + m.balance, 0);

  // Modals
  const [isAddMethodOpen, setIsAddMethodOpen] = useState(false);
  const [newMethodName, setNewMethodName] = useState('');

  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [sourceMethodId, setSourceMethodId] = useState(methods[0]?.id || '');
  const [destMethodId, setDestMethodId] = useState(methods[1]?.id || '');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferNote, setTransferNote] = useState('');
  const [transferError, setTransferError] = useState('');

  const handleSaveMethod = (e) => {
    e.preventDefault();
    if (!newMethodName.trim()) return;
    addMethod(newMethodName.trim());
    setNewMethodName('');
    setIsAddMethodOpen(false);
  };

  const handleSaveTransfer = (e) => {
    e.preventDefault();
    const amount = parseFloat(transferAmount);
    if (isNaN(amount) || amount <= 0) {
      setTransferError(lang === 'bn' ? 'সঠিক টাকার পরিমাণ দিন' : 'Enter a valid amount');
      return;
    }
    if (sourceMethodId === destMethodId) {
      setTransferError(lang === 'bn' ? 'উৎস ও গন্তব্য মাধ্যম একই হতে পারে না' : 'Source and destination cannot be the same');
      return;
    }

    addTransfer({
      sourceMethodId,
      destinationMethodId: destMethodId,
      amount,
      note: transferNote,
    });

    setIsTransferOpen(false);
    setTransferAmount('');
    setTransferNote('');
    setTransferError('');
  };

  return (
    <div className="pb-24 pt-3 px-4 max-w-3xl mx-auto space-y-4">
      {/* 1. Profile Header Card */}
      <div className="bg-gradient-to-br from-[#7542C8] to-[#582CA1] text-white rounded-3xl p-5 shadow-lg relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-inner">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight">
                {lang === 'bn' ? 'ওনার অ্যাকাউন্ট' : 'Owner Account'}
              </h1>
              <p className="text-xs text-purple-200">amanot.owner@example.com</p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[11px] text-purple-200 block">
              {lang === 'bn' ? 'সর্বমোট স্থিতি' : 'Total Net Worth'}
            </span>
            <span className="text-xl font-extrabold tracking-tight">
              {formatCurrency(totalBalance, lang)}
            </span>
          </div>
        </div>

        {/* Quick Action Buttons inside Card */}
        <div className="flex items-center gap-2 mt-5 pt-3 border-t border-white/15">
          <button
            onClick={() => setIsTransferOpen(true)}
            className="flex-1 py-2 px-3 rounded-xl bg-white/15 hover:bg-white/25 active:bg-white/30 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            {t('internalTransfer')}
          </button>
          <button
            onClick={() => setIsAddMethodOpen(true)}
            className="flex-1 py-2 px-3 rounded-xl bg-white/15 hover:bg-white/25 active:bg-white/30 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            {lang === 'bn' ? 'নতুন মাধ্যম' : 'New Method'}
          </button>
        </div>
      </div>

      {/* 2. Method-wise Overview Section */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-2">
          <Wallet className="w-4 h-4 text-[#7542C8] dark:text-purple-400" />
          <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">
            {t('methodOverview')}
          </h2>
        </div>
      </div>

      {/* 3. Method Balances Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {methodBalances.map((m) => {
          const isPositive = m.balance > 0;
          const isNegative = m.balance < 0;

          return (
            <div
              key={m.id}
              className="bg-white dark:bg-[#211B30] rounded-2xl p-4 border border-purple-50 dark:border-purple-950/40 shadow-sm flex flex-col justify-between gap-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-[#7542C8] dark:text-purple-300 flex items-center justify-center">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <span className="font-bold text-sm text-gray-900 dark:text-gray-100">
                    {m.name}
                  </span>
                </div>
                <div className="text-right">
                  <span
                    className={`font-bold text-base ${
                      isPositive
                        ? 'text-green-600 dark:text-green-400'
                        : isNegative
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    {formatCurrency(m.balance, lang)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-gray-100 dark:border-gray-800">
                <div>
                  <span className="text-[10px] text-gray-400 block">{t('creditShort')}</span>
                  <span className="font-semibold text-green-600 dark:text-green-400">
                    {formatCurrency(m.credit, lang)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-gray-400 block">{t('debitShort')}</span>
                  <span className="font-semibold text-red-600 dark:text-red-400">
                    {formatCurrency(m.debit, lang)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 4. Add Method Modal */}
      <Modal
        isOpen={isAddMethodOpen}
        onClose={() => setIsAddMethodOpen(false)}
        title={lang === 'bn' ? 'নতুন লেনদেনের মাধ্যম যোগ' : 'Add New Transaction Method'}
      >
        <form onSubmit={handleSaveMethod} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              {lang === 'bn' ? 'মাধ্যমের নাম' : 'Method Name'} *
            </label>
            <input
              type="text"
              required
              autoFocus
              value={newMethodName}
              onChange={(e) => setNewMethodName(e.target.value)}
              placeholder="e.g. City Bank, Islami Bank, Rocket"
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1B1627] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#7542C8]"
            />
          </div>
          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" onClick={() => setIsAddMethodOpen(false)}>
              {t('cancel')}
            </Button>
            <Button type="submit" variant="primary">
              {t('save')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* 5. Internal Transfer Modal */}
      <Modal
        isOpen={isTransferOpen}
        onClose={() => setIsTransferOpen(false)}
        title={t('internalTransfer')}
      >
        <form onSubmit={handleSaveTransfer} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                {lang === 'bn' ? 'উৎস মাধ্যম' : 'From Method'}
              </label>
              <select
                value={sourceMethodId}
                onChange={(e) => setSourceMethodId(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1B1627] text-gray-900 dark:text-gray-100"
              >
                {methods.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                {lang === 'bn' ? 'গন্তব্য মাধ্যম' : 'To Method'}
              </label>
              <select
                value={destMethodId}
                onChange={(e) => setDestMethodId(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1B1627] text-gray-900 dark:text-gray-100"
              >
                {methods.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              {t('amount')} *
            </label>
            <input
              type="number"
              step="any"
              min="1"
              required
              value={transferAmount}
              onChange={(e) => setTransferAmount(e.target.value)}
              placeholder="0.00"
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1B1627] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#7542C8]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              {t('note')}
            </label>
            <input
              type="text"
              value={transferNote}
              onChange={(e) => setTransferNote(e.target.value)}
              placeholder={lang === 'bn' ? 'যেমন: এটিএম থেকে ক্যাশ উত্তোলন' : 'e.g. ATM cash withdrawal'}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1B1627] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#7542C8]"
            />
          </div>

          {transferError && (
            <p className="text-xs text-red-500 font-medium">{transferError}</p>
          )}

          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" onClick={() => setIsTransferOpen(false)}>
              {t('cancel')}
            </Button>
            <Button type="submit" variant="primary">
              {t('confirm')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
