import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Search, ArrowLeft, MoreVertical, Edit2, Trash2, ArrowDownLeft, ArrowUpRight, Calendar, Tag, CreditCard } from 'lucide-react';
import { useLedger } from '../context/LedgerContext';
import { useLanguage } from '../context/LanguageContext';
import { SummaryCards } from '../components/common/SummaryCards';
import { formatCurrency } from '../utils/currency';
import { Modal } from '../components/common/Modal';
import { Button } from '../components/common/Button';

export const AccountDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { lang, t } = useLanguage();
  const {
    accounts,
    transactions,
    methods,
    getAccountSummary,
    addTransaction,
    editTransaction,
    deleteTransaction,
  } = useLedger();

  const account = accounts.find((a) => a.id === id);

  const [searchTerm, setSearchTerm] = useState('');
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState(null);

  // Form states
  const [txType, setTxType] = useState('credit'); // 'credit' | 'debit'
  const [txAmount, setTxAmount] = useState('');
  const [txParticular, setTxParticular] = useState('');
  const [txMethodId, setTxMethodId] = useState(methods[0]?.id || 'm-cash');
  const [txDate, setTxDate] = useState(new Date().toISOString().split('T')[0]);
  const [txNote, setTxNote] = useState('');
  const [formError, setFormError] = useState('');

  if (!account) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">{t('noAccountsFound')}</p>
        <Button onClick={() => navigate('/')} className="mt-4">
          {t('back')}
        </Button>
      </div>
    );
  }

  const summary = getAccountSummary(account.id);
  const accountTxs = transactions
    .filter((tx) => tx.accountId === account.id)
    .filter((tx) => {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return (
        tx.particular?.toLowerCase().includes(term) ||
        tx.amount?.toString().includes(term) ||
        tx.methodNameSnapshot?.toLowerCase().includes(term)
      );
    });

  const handleOpenAddTx = () => {
    setEditingTx(null);
    setTxType('credit');
    setTxAmount('');
    setTxParticular('');
    setTxMethodId(methods[0]?.id || 'm-cash');
    setTxDate(new Date().toISOString().split('T')[0]);
    setTxNote('');
    setFormError('');
    setIsTxModalOpen(true);
  };

  const handleOpenEditTx = (tx) => {
    setEditingTx(tx);
    setTxType(tx.type);
    setTxAmount(tx.amount.toString());
    setTxParticular(tx.particular);
    setTxMethodId(tx.methodId || methods[0]?.id || 'm-cash');
    setTxDate(tx.date || new Date().toISOString().split('T')[0]);
    setTxNote(tx.note || '');
    setFormError('');
    setIsTxModalOpen(true);
  };

  const handleSaveTx = (e) => {
    e.preventDefault();
    const numAmount = parseFloat(txAmount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setFormError(lang === 'bn' ? 'সঠিক টাকার পরিমাণ দিন (০ এর বেশি)' : 'Enter a valid amount greater than 0');
      return;
    }

    if (!txParticular.trim()) {
      setFormError(lang === 'bn' ? 'বিবরণ বা শিরোনাম আবশ্যক' : 'Particular/title is required');
      return;
    }

    if (editingTx) {
      editTransaction(editingTx.id, {
        type: txType,
        amount: numAmount,
        particular: txParticular.trim(),
        methodId: txMethodId,
        date: txDate,
        note: txNote.trim(),
      });
    } else {
      addTransaction({
        accountId: account.id,
        type: txType,
        amount: numAmount,
        particular: txParticular.trim(),
        methodId: txMethodId,
        date: txDate,
        note: txNote.trim(),
      });
    }

    setIsTxModalOpen(false);
  };

  const handleDeleteTx = (txId) => {
    if (window.confirm(t('deleteConfirmMsg'))) {
      deleteTransaction(txId);
    }
  };

  return (
    <div className="min-h-screen pb-24">
      {/* 1. Account Details Header with Sticky Summary */}
      <div className="sticky top-0 z-30 bg-[#7542C8] text-white shadow-md">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="p-1.5 rounded-full hover:bg-white/10 active:bg-white/20 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="font-bold text-base leading-tight">{account.name}</h1>
              <p className="text-[11px] text-purple-200">
                {lang === 'bn' ? 'ব্যক্তিগত লেজার খাতা' : 'Personal Ledger'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleOpenAddTx}
              icon={Plus}
              className="bg-white text-[#7542C8] hover:bg-white/90"
            >
              {t('newTransaction')}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 space-y-4 pt-3">
        {/* 2. Sticky Account Summary Section */}
        <SummaryCards
          totalCredit={summary.credit}
          totalDebit={summary.debit}
          netBalance={summary.balance}
          sticky={true}
        />

        {/* 3. Search & Transaction Controls */}
        <div className="flex items-center justify-between gap-3 pt-1">
          <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <span>{t('history')}</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/60 text-[#7542C8] dark:text-purple-300 font-semibold">
              {accountTxs.length}
            </span>
          </h2>

          <div className="relative max-w-xs flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('searchTransactions')}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-white dark:bg-[#211B30] border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7542C8]/30 transition-all"
            />
          </div>
        </div>

        {/* 4. Transactions List */}
        <div className="space-y-2.5">
          {accountTxs.length === 0 ? (
            <div className="text-center py-12 px-4 rounded-2xl bg-white dark:bg-[#211B30] border border-dashed border-gray-200 dark:border-gray-800">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t('noTransactionsFound')}
              </p>
              <Button
                variant="primary"
                size="sm"
                className="mt-3"
                onClick={handleOpenAddTx}
                icon={Plus}
              >
                {t('newTransaction')}
              </Button>
            </div>
          ) : (
            accountTxs.map((tx) => {
              const isCredit = tx.type === 'credit';
              return (
                <div
                  key={tx.id}
                  className="bg-white dark:bg-[#211B30] rounded-2xl p-3.5 border border-purple-50 dark:border-purple-950/30 shadow-sm flex items-center justify-between gap-3"
                >
                  {/* Left: Icon & Details */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        isCredit
                          ? 'bg-green-100 dark:bg-green-950/60 text-green-600 dark:text-green-400'
                          : 'bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400'
                      }`}
                    >
                      {isCredit ? (
                        <ArrowDownLeft className="w-5 h-5 stroke-[2.5]" />
                      ) : (
                        <ArrowUpRight className="w-5 h-5 stroke-[2.5]" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">
                        {tx.particular}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-gray-400" />
                          {tx.date}
                        </span>
                        <span>•</span>
                        <span className="px-1.5 py-0.2 rounded bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-medium">
                          {tx.methodNameSnapshot || 'Cash'}
                        </span>
                        {tx.note && (
                          <>
                            <span>•</span>
                            <span className="truncate italic text-gray-400">{tx.note}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Amount & Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-right">
                      <div
                        className={`font-bold text-base ${
                          isCredit
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-red-600 dark:text-red-400'
                        }`}
                      >
                        {formatCurrency(tx.amount, lang, true)}
                      </div>
                      <span className="text-[10px] text-gray-400">
                        {isCredit ? t('creditShort') : t('debitShort')}
                      </span>
                    </div>

                    <div className="flex items-center pl-1 border-l border-gray-100 dark:border-gray-800">
                      <button
                        onClick={() => handleOpenEditTx(tx)}
                        className="p-1.5 text-gray-400 hover:text-purple-600 dark:hover:text-purple-300 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-950/30 transition-colors"
                        title={t('edit')}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteTx(tx.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                        title={t('delete')}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 5. Add / Edit Transaction Modal */}
      <Modal
        isOpen={isTxModalOpen}
        onClose={() => setIsTxModalOpen(false)}
        title={editingTx ? t('editTransaction') : t('newTransaction')}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSaveTx} className="space-y-4">
          {/* Type Selector: Credit (+) vs Debit (−) */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              {t('transactionType')} *
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setTxType('credit')}
                className={`py-3 px-3 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                  txType === 'credit'
                    ? 'border-green-500 bg-green-50/70 dark:bg-green-950/40 text-green-700 dark:text-green-300 shadow-sm ring-2 ring-green-500/20'
                    : 'border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 text-gray-600 dark:text-gray-400'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-sm text-green-600 dark:text-green-400">
                  <ArrowDownLeft className="w-4 h-4 stroke-[3]" />
                  {t('creditShort')}
                </div>
                <span className="text-[10px] text-gray-500 dark:text-gray-400 text-center">
                  {t('creditDescription')}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setTxType('debit')}
                className={`py-3 px-3 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                  txType === 'debit'
                    ? 'border-red-500 bg-red-50/70 dark:bg-red-950/40 text-red-700 dark:text-red-300 shadow-sm ring-2 ring-red-500/20'
                    : 'border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 text-gray-600 dark:text-gray-400'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-sm text-red-600 dark:text-red-400">
                  <ArrowUpRight className="w-4 h-4 stroke-[3]" />
                  {t('debitShort')}
                </div>
                <span className="text-[10px] text-gray-500 dark:text-gray-400 text-center">
                  {t('debitDescription')}
                </span>
              </button>
            </div>
          </div>

          {/* Amount Field */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              {t('amount')} *
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-base">
                ৳
              </span>
              <input
                type="number"
                step="any"
                min="0.01"
                required
                value={txAmount}
                onChange={(e) => setTxAmount(e.target.value)}
                placeholder={t('amountPlaceholder')}
                className="w-full pl-8 pr-4 py-2.5 text-base font-bold rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1B1627] text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7542C8]"
              />
            </div>
          </div>

          {/* Particular / Title */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              {t('particular')} *
            </label>
            <input
              type="text"
              required
              value={txParticular}
              onChange={(e) => setTxParticular(e.target.value)}
              placeholder={t('particularPlaceholder')}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1B1627] text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7542C8]"
            />
          </div>

          {/* Grid: Method & Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                {t('method')} *
              </label>
              <select
                value={txMethodId}
                onChange={(e) => setTxMethodId(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1B1627] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#7542C8]"
              >
                {methods.filter((m) => m.isActive).map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                {t('date')} *
              </label>
              <input
                type="date"
                required
                value={txDate}
                onChange={(e) => setTxDate(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1B1627] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#7542C8]"
              />
            </div>
          </div>

          {/* Optional Note */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              {t('note')}
            </label>
            <input
              type="text"
              value={txNote}
              onChange={(e) => setTxNote(e.target.value)}
              placeholder={t('notePlaceholder')}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1B1627] text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7542C8]"
            />
          </div>

          {formError && (
            <p className="text-xs text-red-500 font-medium">{formError}</p>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <Button
              variant="outline"
              size="md"
              onClick={() => setIsTxModalOpen(false)}
            >
              {t('cancel')}
            </Button>
            <Button
              type="submit"
              variant={txType === 'credit' ? 'success' : 'danger'}
              size="md"
            >
              {t('save')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
