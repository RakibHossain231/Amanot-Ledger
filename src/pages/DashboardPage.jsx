import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, UserPlus, ArrowRightLeft, Edit2, Trash2, ChevronRight, Search } from 'lucide-react';
import { useLedger } from '../context/LedgerContext';
import { useLanguage } from '../context/LanguageContext';
import { SummaryCards } from '../components/common/SummaryCards';
import { formatCurrency } from '../utils/currency';
import { Modal } from '../components/common/Modal';
import { Button } from '../components/common/Button';

export const DashboardPage = () => {
  const navigate = useNavigate();
  const { lang, t } = useLanguage();
  const { accounts, getOverallSummary, getAccountSummary, addAccount, editAccount, deleteAccount } = useLedger();

  const [searchTerm, setSearchTerm] = useState('');
  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [accountNameInput, setAccountNameInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const overall = getOverallSummary();

  const filteredAccounts = accounts.filter((acc) =>
    acc.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenAdd = () => {
    setAccountNameInput('');
    setErrorMsg('');
    setIsAddAccountOpen(true);
  };

  const handleSaveAccount = (e) => {
    e.preventDefault();
    if (!accountNameInput.trim()) {
      setErrorMsg(lang === 'bn' ? 'অ্যাকাউন্টের নাম আবশ্যক' : 'Account name is required');
      return;
    }

    if (editingAccount) {
      editAccount(editingAccount.id, accountNameInput);
      setEditingAccount(null);
    } else {
      addAccount(accountNameInput);
    }

    setIsAddAccountOpen(false);
    setAccountNameInput('');
  };

  const handleEdit = (e, acc) => {
    e.stopPropagation();
    setEditingAccount(acc);
    setAccountNameInput(acc.name);
    setErrorMsg('');
    setIsAddAccountOpen(true);
  };

  const handleDelete = (e, acc) => {
    e.stopPropagation();
    const summary = getAccountSummary(acc.id);
    if (summary.balance !== 0) {
      alert(t('deleteWarningZeroBalance'));
      return;
    }
    if (window.confirm(lang === 'bn' ? `"${acc.name}" অ্যাকাউন্টটি মুছে ফেলতে চান?` : `Delete account "${acc.name}"?`)) {
      try {
        deleteAccount(acc.id);
      } catch (err) {
        alert(err.message);
      }
    }
  };

  return (
    <div className="pb-24 pt-3 px-4 max-w-3xl mx-auto space-y-4">
      {/* 1. Overview Summary Cards */}
      <SummaryCards
        totalCredit={overall.totalCredit}
        totalDebit={overall.totalDebit}
        netBalance={overall.netBalance}
      />

      {/* 2. Search & Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">
            {t('accounts')}
          </h2>
          <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/60 text-[#7542C8] dark:text-purple-300 font-semibold">
            {accounts.length}
          </span>
        </div>

        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t('searchAccounts')}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl bg-white dark:bg-[#211B30] border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7542C8]/30 dark:focus:ring-purple-500/30 transition-all"
          />
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
              onClick={handleOpenAdd}
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
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/40 text-[#7542C8] dark:text-purple-300 font-bold flex items-center justify-center text-sm">
                      {acc.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-semibold text-gray-900 dark:text-gray-100 text-base">
                      {acc.name}
                    </span>
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
                <div className="grid grid-cols-3 gap-2 pt-1 border-t border-gray-100 dark:border-gray-800 text-xs">
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

      {/* 4. Floating Action Button (+) */}
      <button
        onClick={handleOpenAdd}
        className="fixed right-5 bottom-20 sm:bottom-8 z-30 w-14 h-14 rounded-full bg-[#7542C8] hover:bg-[#6334B0] text-white shadow-xl shadow-purple-600/30 flex items-center justify-center active:scale-95 transition-all"
        title={t('addAccount')}
      >
        <Plus className="w-7 h-7 stroke-[2.5]" />
      </button>

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
    </div>
  );
};
