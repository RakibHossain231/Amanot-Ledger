import React from 'react';
import { ArrowDownLeft, ArrowUpRight, Scale } from 'lucide-react';
import { formatCurrency } from '../../utils/currency';
import { useLanguage } from '../../context/LanguageContext';

export const SummaryCards = ({ totalCredit = 0, totalDebit = 0, netBalance = 0, sticky = false }) => {
  const { lang, t } = useLanguage();

  return (
    <div className={`grid grid-cols-3 gap-2.5 sm:gap-3 ${sticky ? 'sticky top-14 z-30 bg-[#F7F5FC]/95 dark:bg-[#171321]/95 backdrop-blur-md py-2.5 border-b border-purple-100/50 dark:border-purple-950/40' : ''}`}>
      {/* 1. Total Credit (+) */}
      <div className="bg-white dark:bg-[#211B30] rounded-2xl p-3 border border-green-100 dark:border-green-950/40 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between text-green-600 dark:text-green-400 mb-1">
          <span className="text-[11px] sm:text-xs font-medium truncate">
            {t('creditShort')}
          </span>
          <div className="w-5 h-5 rounded-full bg-green-50 dark:bg-green-950/60 flex items-center justify-center shrink-0">
            <ArrowDownLeft className="w-3.5 h-3.5 stroke-[2.5]" />
          </div>
        </div>
        <div className="text-sm sm:text-base font-bold text-green-600 dark:text-green-400 tracking-tight truncate">
          {formatCurrency(totalCredit, lang)}
        </div>
      </div>

      {/* 2. Total Debit (−) */}
      <div className="bg-white dark:bg-[#211B30] rounded-2xl p-3 border border-red-100 dark:border-red-950/40 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between text-red-600 dark:text-red-400 mb-1">
          <span className="text-[11px] sm:text-xs font-medium truncate">
            {t('debitShort')}
          </span>
          <div className="w-5 h-5 rounded-full bg-red-50 dark:bg-red-950/60 flex items-center justify-center shrink-0">
            <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.5]" />
          </div>
        </div>
        <div className="text-sm sm:text-base font-bold text-red-600 dark:text-red-400 tracking-tight truncate">
          {formatCurrency(totalDebit, lang)}
        </div>
      </div>

      {/* 3. Net Balance */}
      <div className={`bg-white dark:bg-[#211B30] rounded-2xl p-3 border shadow-sm flex flex-col justify-between ${
        netBalance > 0 
          ? 'border-purple-200 dark:border-purple-900/50' 
          : netBalance < 0 
            ? 'border-amber-200 dark:border-amber-900/50' 
            : 'border-gray-200 dark:border-gray-800'
      }`}>
        <div className="flex items-center justify-between text-[#7542C8] dark:text-purple-300 mb-1">
          <span className="text-[11px] sm:text-xs font-medium truncate">
            {t('netBalance')}
          </span>
          <div className="w-5 h-5 rounded-full bg-purple-50 dark:bg-purple-950/60 flex items-center justify-center shrink-0">
            <Scale className="w-3 h-3 text-[#7542C8] dark:text-purple-300 stroke-[2.5]" />
          </div>
        </div>
        <div className={`text-sm sm:text-base font-bold tracking-tight truncate ${
          netBalance > 0 
            ? 'text-[#7542C8] dark:text-purple-300' 
            : netBalance < 0 
              ? 'text-red-600 dark:text-red-400' 
              : 'text-gray-600 dark:text-gray-300'
        }`}>
          {formatCurrency(netBalance, lang)}
        </div>
      </div>
    </div>
  );
};
