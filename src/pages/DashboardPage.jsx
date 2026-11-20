import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, UserPlus, ArrowRightLeft, Edit2, Trash2, ChevronRight, Search, FileDown, FileSpreadsheet, Download } from 'lucide-react';
import { useLedger } from '../context/LedgerContext';
import { useLanguage } from '../context/LanguageContext';
import { SummaryCards } from '../components/common/SummaryCards';
import { formatCurrency } from '../utils/currency';
import { Modal } from '../components/common/Modal';
import { Button } from '../components/common/Button';
import { exportDashboardPDF, exportDashboardExcel } from '../utils/exporter';

export const DashboardPage = () => {
  const navigate = useNavigate();
  const { lang, t } = useLanguage();
  const {
    accounts,
    methods,
    getOverallSummary,
    getAccountSummary,
    addAccount,
    editAccount,
    deleteAccount,
    addTransaction,
  } = useLedger();

  const [searchTerm, setSearchTerm] = useState('');
  
  // Floating Action Menu state
  const [isFabOpen, setIsFabOpen] = useState(false);

  // Account Modal states
  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [accountNameInput, setAccountNameInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Quick Transaction Modal states (from FAB)
  const [isQuickTxOpen, setIsQuickTxOpen] = useState(false);
  const [quickAccountId, setQuickAccountId] = useState('');
  const [quickTxType, setQuickTxType] = useState('credit');
  const [quickAmount, setQuickAmount] = useState('');
  const [quickParticular, setQuickParticular] = useState('');
  const [quickMethodId, setQuickMethodId] = useState('');
  const [quickDate, setQuickDate] = useState(new Date().toISOString().split('T')[0]);
  const [quickTxError, setQuickTxError] = useState('');

  // Export Modal state
  const [isExportOpen, setIsExportOpen] = useState(false);

  const overall = getOverallSummary();

  const filteredAccounts = accounts.filter((acc) =>
    acc.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenAddAccount = () => {
    setEditingAccount(null);
    setAccountNameInput('');
    setErrorMsg('');
    setIsFabOpen(false);
    setIsAddAccountOpen(true);
  };

  const handleOpenQuickTx = () => {
    if (accounts.length === 0) {
      alert(lang === 'bn' ? 'প্রথমে একটি অ্যাকাউন্ট তৈরি করুন' : 'Please create an account first');
      return;
    }
    setQuickAccountId(accounts[0]?.id || '');
    setQuickTxType('credit');
    setQuickAmount('');
    setQuickParticular('');
    setQuickMethodId(methods[0]?.id || '');
    setQuickDate(new Date().toISOString().split('T')[0]);
    setQuickTxError('');
    setIsFabOpen(false);
    setIsQuickTxOpen(true);
  };

  const handleSaveAccount = async (e) => {
    e.preventDefault();
    if (!accountNameInput.trim()) {
      setErrorMsg(lang === 'bn' ? 'অ্যাকাউন্টের নাম আবশ্যক' : 'Account name is required');
      return;
    }

    if (editingAccount) {
      await editAccount(editingAccount.id, accountNameInput);
      setEditingAccount(null);
    } else {
      await addAccount(accountNameInput);
    }

    setIsAddAccountOpen(false);
    setAccountNameInput('');
  };

  const handleSaveQuickTx = async (e) => {
    e.preventDefault();
    const num = parseFloat(quickAmount);
    if (isNaN(num) || num <= 0) {
      setQuickTxError(lang === 'bn' ? 'সঠিক টাকার পরিমাণ দিন' : 'Enter a valid amount');
      return;
    }
    if (!quickParticular.trim()) {
      setQuickTxError(lang === 'bn' ? 'বিবরণ আবশ্যক' : 'Particular is required');
      return;
    }
    if (!quickAccountId) {
      setQuickTxError(lang === 'bn' ? 'অ্যাকাউন্ট নির্বাচন করুন' : 'Select an account');
      return;
    }

    await addTransaction({
      accountId: quickAccountId,
      type: quickTxType,
      amount: num,
      particular: quickParticular.trim(),
      methodId: quickMethodId || methods[0]?.id || 'm-cash',
      date: quickDate,
    });

    setIsQuickTxOpen(false);
  };

  const handleEdit = (e, acc) => {
    e.stopPropagation();
    setEditingAccount(acc);
    setAccountNameInput(acc.name);
    setErrorMsg('');
    setIsAddAccountOpen(true);
  };

  const handleDelete = async (e, acc) => {
    e.stopPropagation();
    const summary = getAccountSummary(acc.id);
    if (summary.balance !== 0) {
      alert(t('deleteWarningZeroBalance'));
      return;
    }
    if (window.confirm(lang === 'bn' ? `"${acc.name}" অ্যাকাউন্টটি মুছে ফেলতে চান?` : `Delete account "${acc.name}"?`)) {
      try {
        await deleteAccount(acc.id);
      } catch (err) {
        alert(err.message);
      }
    }
  };

  const handleExportPDF = () => {
    const accountsWithSummary = accounts.map((acc) => ({
      ...acc,
      ...getAccountSummary(acc.id),
    }));
    exportDashboardPDF(accountsWithSummary, overall, lang);
    setIsExportOpen(false);
  };

  const handleExportExcel = () => {
    const accountsWithSummary = accounts.map((acc) => ({
      ...acc,
      ...getAccountSummary(acc.id),
    }));
    exportDashboardExcel(accountsWithSummary, overall);
    setIsExportOpen(false);
  };

  return (
    <div className="pb-24 pt-3 px-4 max-w-3xl mx-auto space-y-4">
      {/* 1. Overview Summary Cards */}
      <SummaryCards
        totalCredit={overall.totalCredit}
        totalDebit={overall.totalDebit}
        netBalance={overall.netBalance}
      />

      {/* 2. Search, Export & Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">
              {t('accounts')}
            </h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/60 text-[#7542C8] dark:text-purple-300 font-semibold">
              {accounts.length}
            </span>
          </div>

          {/* Mobile Export Trigger */}
          <button
            onClick={() => setIsExportOpen(true)}
            className="sm:hidden p-2 rounded-xl text-[#7542C8] dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100"
            title={t('export')}
          >
            <Download className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Search Bar */}
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('searchAccounts')}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-xl bg-white dark:bg-[#211B30] border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7542C8]/30 dark:focus:ring-purple-500/30 transition-all"
            />
          </div>

          {/* Desktop Export Button */}
          <Button
            variant="outline"
            size="md"
            onClick={() => setIsExportOpen(true)}
            icon={Download}
            className="hidden sm:inline-flex text-xs py-2"
          >
            {t('export')}
          </Button>
        </div>
      </div>

      {/* 3. Account Cards List */}
      <div className="space-y-2.5">
        {filteredAccounts.length === 0 ? (
          <div className="text-center py-12 px-4 rounded-2xl bg-white dark:bg-[#211B30] border border-dashed border-gray-200 dark:border-gray-800">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t('noAccountsFound')}
            </p>
            <Button
              variant="secondary"
              size="sm"
              className="mt-3"
              onClick={handleOpenAddAccount}
              icon={Plus}
            >
              {t('addAccount')}
            </Button>
          </div>
        ) : (
          filteredAccounts.map((acc) => {
            const summary = getAccountSummary(acc.id);
            const isPositive = summary.balance > 0;
            const isNegative = summary.balance < 0;

            return (
              <div
                key={acc.id}
                onClick={() => navigate(`/account/${acc.id}`)}
                className="bg-white dark:bg-[#211B30] hover:bg-purple-50/30 dark:hover:bg-[#261F38] active:scale-[0.99] rounded-2xl p-4 border border-purple-50 dark:border-purple-950/40 shadow-sm transition-all cursor-pointer flex flex-col gap-2.5"
              >
                {/* Top Row: Account Name & Actions */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-purple-100 dark:bg-purple-900/40 text-[#7542C8] dark:text-purple-300 font-bold flex items-center justify-center text-sm shadow-inner">
                      {acc.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <span className="font-semibold text-gray-900 dark:text-gray-100 text-base block">
                        {acc.name}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        {summary.transactionCount} {lang === 'bn' ? 'টি লেনদেন' : 'transactions'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => handleEdit(e, acc)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-purple-600 dark:hover:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-colors"
                      title={t('editAccount')}
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => handleDelete(e, acc)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                      title={t('deleteAccount')}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-600 ml-1" />
                  </div>
                </div>

                {/* Bottom Row: Credit, Debit & Current Balance */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-100 dark:border-gray-800 text-xs">
                  <div>
                    <span className="text-gray-400 block text-[10px]">
                      {t('creditShort')}
                    </span>
                    <span className="font-semibold text-green-600 dark:text-green-400">
                      {formatCurrency(summary.credit, lang)}
                    </span>
                  </div>

                  <div>
                    <span className="text-gray-400 block text-[10px]">
                      {t('debitShort')}
                    </span>
                    <span className="font-semibold text-red-600 dark:text-red-400">
                      {formatCurrency(summary.debit, lang)}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-gray-400 block text-[10px]">
                      {t('netBalance')}
                    </span>
                    <span
                      className={`font-bold text-sm ${
                        isPositive
                          ? 'text-green-600 dark:text-green-400'
                          : isNegative
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      {formatCurrency(summary.balance, lang)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 4. Floating Action Button (+) with Pop-up Menu */}
      <div className="fixed right-5 bottom-20 sm:bottom-8 z-40 flex flex-col items-end">
        {isFabOpen && (
          <div className="mb-3 space-y-2 flex flex-col items-end animate-in fade-in slide-in-from-bottom-3 duration-200">
            <button
              onClick={handleOpenQuickTx}
              className="flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-white dark:bg-[#211B30] text-gray-800 dark:text-gray-100 text-xs font-semibold shadow-lg border border-purple-100 dark:border-purple-900/40 hover:bg-purple-50 dark:hover:bg-purple-950/50 transition-all"
            >
              <span>{lang === 'bn' ? 'লেনদেন যোগ করুন' : 'Add Transaction'}</span>
              <div className="w-7 h-7 rounded-full bg-green-500 text-white flex items-center justify-center">
                <ArrowRightLeft className="w-3.5 h-3.5" />
              </div>
            </button>

            <button
              onClick={handleOpenAddAccount}
              className="flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-white dark:bg-[#211B30] text-gray-800 dark:text-gray-100 text-xs font-semibold shadow-lg border border-purple-100 dark:border-purple-900/40 hover:bg-purple-50 dark:hover:bg-purple-950/50 transition-all"
            >
              <span>{lang === 'bn' ? 'নতুন অ্যাকাউন্ট' : 'New Account'}</span>
              <div className="w-7 h-7 rounded-full bg-[#7542C8] text-white flex items-center justify-center">
                <UserPlus className="w-3.5 h-3.5" />
              </div>
            </button>
          </div>
        )}

        <button
          onClick={() => setIsFabOpen(!isFabOpen)}
          className={`w-14 h-14 rounded-full bg-[#7542C8] hover:bg-[#6334B0] text-white shadow-xl shadow-purple-600/30 flex items-center justify-center active:scale-95 transition-all transform ${
            isFabOpen ? 'rotate-45 bg-gray-800 hover:bg-gray-900' : ''
          }`}
          title={t('addAccount')}
        >
          <Plus className="w-7 h-7 stroke-[2.5]" />
        </button>
      </div>

      {/* 5. Add / Edit Account Modal */}
      <Modal
        isOpen={isAddAccountOpen}
        onClose={() => setIsAddAccountOpen(false)}
        title={editingAccount ? t('editAccount') : t('addAccount')}
      >
        <form onSubmit={handleSaveAccount} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              {t('accountName')} *
            </label>
            <input
              type="text"
              required
              autoFocus
              value={accountNameInput}
              onChange={(e) => setAccountNameInput(e.target.value)}
              placeholder={t('accountNamePlaceholder')}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1B1627] text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7542C8] transition-all"
            />
            {errorMsg && (
              <p className="text-xs text-red-500 mt-1 font-medium">{errorMsg}</p>
            )}
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <Button
              variant="outline"
              size="md"
              onClick={() => setIsAddAccountOpen(false)}
            >
              {t('cancel')}
            </Button>
            <Button type="submit" variant="primary" size="md">
              {t('save')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* 6. Quick Add Transaction Modal (from FAB) */}
      <Modal
        isOpen={isQuickTxOpen}
        onClose={() => setIsQuickTxOpen(false)}
        title={t('newTransaction')}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSaveQuickTx} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              {lang === 'bn' ? 'অ্যাকাউন্ট নির্বাচন করুন' : 'Select Account'} *
            </label>
            <select
              value={quickAccountId}
              onChange={(e) => setQuickAccountId(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1B1627] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#7542C8]"
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              {t('transactionType')} *
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setQuickTxType('credit')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                  quickTxType === 'credit'
                    ? 'border-green-500 bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-300 ring-2 ring-green-500/20'
                    : 'border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400'
                }`}
              >
                <ArrowRightLeft className="w-4 h-4" />
                {t('creditShort')}
              </button>
              <button
                type="button"
                onClick={() => setQuickTxType('debit')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                  quickTxType === 'debit'
                    ? 'border-red-500 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 ring-2 ring-red-500/20'
                    : 'border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400'
                }`}
              >
                <ArrowRightLeft className="w-4 h-4" />
                {t('debitShort')}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              {t('amount')} *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">৳</span>
              <input
                type="number"
                step="any"
                min="0.01"
                required
                value={quickAmount}
                onChange={(e) => setQuickAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-7 pr-3 py-2 text-sm font-bold rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1B1627] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#7542C8]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              {t('particular')} *
            </label>
            <input
              type="text"
              required
              value={quickParticular}
              onChange={(e) => setQuickParticular(e.target.value)}
              placeholder={t('particularPlaceholder')}
              className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1B1627] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#7542C8]"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                {t('method')}
              </label>
              <select
                value={quickMethodId || methods[0]?.id}
                onChange={(e) => setQuickMethodId(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1B1627] text-gray-900 dark:text-gray-100"
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
                {t('date')}
              </label>
              <input
                type="date"
                required
                value={quickDate}
                onChange={(e) => setQuickDate(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1B1627] text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>

          {quickTxError && (
            <p className="text-xs text-red-500 font-medium">{quickTxError}</p>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="outline" size="md" onClick={() => setIsQuickTxOpen(false)}>
              {t('cancel')}
            </Button>
            <Button
              type="submit"
              variant={quickTxType === 'credit' ? 'success' : 'danger'}
              size="md"
            >
              {t('save')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* 7. Export Dashboard Modal */}
      <Modal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        title={lang === 'bn' ? 'ড্যাশবোর্ড রিপোর্ট এক্সপোর্ট' : 'Export Dashboard Report'}
      >
        <div className="space-y-4">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {lang === 'bn' 
              ? 'ড্যাশবোর্ড রিপোর্টে সকল সক্রিয় অ্যাকাউন্টের মোট জমা, মোট খরচ এবং বর্তমান ব্যালেন্সের তালিকা ডাউনলোড করা হবে।' 
              : 'Download a summary statement of all accounts with total credit, total debit, and current balance.'}
          </p>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              onClick={handleExportPDF}
              className="py-4 px-3 rounded-2xl border border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-950/20 hover:bg-purple-100 text-[#7542C8] dark:text-purple-300 flex flex-col items-center gap-2 transition-all"
            >
              <FileDown className="w-7 h-7" />
              <span className="text-xs font-bold">PDF Format</span>
            </button>

            <button
              onClick={handleExportExcel}
              className="py-4 px-3 rounded-2xl border border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20 hover:bg-green-100 text-green-700 dark:text-green-300 flex flex-col items-center gap-2 transition-all"
            >
              <FileSpreadsheet className="w-7 h-7" />
              <span className="text-xs font-bold">Excel (.xlsx)</span>
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
