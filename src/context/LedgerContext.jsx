import React, { createContext, useContext, useState, useEffect } from 'react';

const LedgerContext = createContext();

const INITIAL_METHODS = [
  { id: 'm-cash', name: 'Cash', isActive: true },
  { id: 'm-bkash', name: 'bKash', isActive: true },
  { id: 'm-nagad', name: 'Nagad', isActive: true },
  { id: 'm-bank', name: 'Bank', isActive: true },
  { id: 'm-other', name: 'Other', isActive: true },
];

const INITIAL_ACCOUNTS = [
  { id: 'acc-1', name: 'সুজন (Sujon)', isArchived: false, createdAt: new Date().toISOString() },
  { id: 'acc-2', name: 'করিম (Karim)', isArchived: false, createdAt: new Date().toISOString() },
  { id: 'acc-3', name: 'রহিম (Rahim)', isArchived: false, createdAt: new Date().toISOString() },
];

const INITIAL_TRANSACTIONS = [
  {
    id: 'tx-1',
    accountId: 'acc-1',
    type: 'credit', // Credit (+)
    amount: 1500,
    particular: 'টাকা জমা দিল',
    methodId: 'm-cash',
    methodNameSnapshot: 'Cash',
    date: new Date().toISOString().split('T')[0],
    note: 'প্রাথমিক আমানত',
    createdAt: new Date().toISOString()
  },
  {
    id: 'tx-2',
    accountId: 'acc-1',
    type: 'debit', // Debit (-)
    amount: 1000,
    particular: 'প্রয়োজনে টাকা নিল',
    methodId: 'm-cash',
    methodNameSnapshot: 'Cash',
    date: new Date().toISOString().split('T')[0],
    note: '',
    createdAt: new Date().toISOString()
  },
  {
    id: 'tx-3',
    accountId: 'acc-2',
    type: 'credit',
    amount: 3000,
    particular: 'ব্যাংক ট্রান্সফার',
    methodId: 'm-bank',
    methodNameSnapshot: 'Bank',
    date: new Date().toISOString().split('T')[0],
    note: '',
    createdAt: new Date().toISOString()
  },
  {
    id: 'tx-4',
    accountId: 'acc-2',
    type: 'debit',
    amount: 5000,
    particular: 'ঋণ দেওয়া হলো',
    methodId: 'm-bkash',
    methodNameSnapshot: 'bKash',
    date: new Date().toISOString().split('T')[0],
    note: '',
    createdAt: new Date().toISOString()
  }
];

export const LedgerProvider = ({ children }) => {
  // Load from local storage for Phase 1/2 demo, pre-Dexie
  const [accounts, setAccounts] = useState(() => {
    const saved = localStorage.getItem('amanot_accounts');
    return saved ? JSON.parse(saved) : INITIAL_ACCOUNTS;
  });

  const [transactions, setTransactions] = useState(() => {
    const saved = localStorage.getItem('amanot_transactions');
    return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
  });

  const [methods, setMethods] = useState(() => {
    const saved = localStorage.getItem('amanot_methods');
    return saved ? JSON.parse(saved) : INITIAL_METHODS;
  });

  const [transfers, setTransfers] = useState(() => {
    const saved = localStorage.getItem('amanot_transfers');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('amanot_accounts', JSON.stringify(accounts));
  }, [accounts]);

  useEffect(() => {
    localStorage.setItem('amanot_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('amanot_methods', JSON.stringify(methods));
  }, [methods]);

  useEffect(() => {
    localStorage.setItem('amanot_transfers', JSON.stringify(transfers));
  }, [transfers]);

  // Account Operations
  const addAccount = (name) => {
    if (!name || !name.trim()) return;
    const newAccount = {
      id: `acc-${Date.now()}`,
      name: name.trim(),
      isArchived: false,
      createdAt: new Date().toISOString(),
    };
    setAccounts((prev) => [newAccount, ...prev]);
    return newAccount;
  };

  const editAccount = (id, newName) => {
    if (!newName || !newName.trim()) return;
    setAccounts((prev) =>
      prev.map((acc) => (acc.id === id ? { ...acc, name: newName.trim(), updatedAt: new Date().toISOString() } : acc))
    );
  };

  const deleteAccount = (id) => {
    const summary = getAccountSummary(id);
    if (summary.balance !== 0) {
      throw new Error('Only accounts with zero (৳0) balance can be deleted.');
    }
    // Soft-delete / archive
    setAccounts((prev) => prev.filter((acc) => acc.id !== id));
  };

  // Transaction Operations
  const addTransaction = (tx) => {
    const methodObj = methods.find((m) => m.id === tx.methodId) || { name: 'Cash' };
    const newTx = {
      id: `tx-${Date.now()}`,
      accountId: tx.accountId,
      type: tx.type, // 'credit' | 'debit'
      amount: Number(tx.amount) || 0,
      particular: tx.particular || '',
      methodId: tx.methodId,
      methodNameSnapshot: methodObj.name,
      date: tx.date || new Date().toISOString().split('T')[0],
      note: tx.note || '',
      createdAt: new Date().toISOString(),
    };
    setTransactions((prev) => [newTx, ...prev]);
    return newTx;
  };

  const editTransaction = (id, updatedFields) => {
    setTransactions((prev) =>
      prev.map((tx) => {
        if (tx.id !== id) return tx;
        const methodObj = methods.find((m) => m.id === (updatedFields.methodId || tx.methodId));
        return {
          ...tx,
          ...updatedFields,
          amount: updatedFields.amount !== undefined ? Number(updatedFields.amount) : tx.amount,
          methodNameSnapshot: methodObj ? methodObj.name : tx.methodNameSnapshot,
          updatedAt: new Date().toISOString(),
        };
      })
    );
  };

  const deleteTransaction = (id) => {
    setTransactions((prev) => prev.filter((tx) => tx.id !== id));
  };

  // Method Management
  const addMethod = (name) => {
    if (!name || !name.trim()) return;
    const newMethod = {
      id: `m-${Date.now()}`,
      name: name.trim(),
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    setMethods((prev) => [...prev, newMethod]);
    return newMethod;
  };

  // Internal Transfer between methods
  const addTransfer = ({ sourceMethodId, destinationMethodId, amount, note, date }) => {
    const numAmount = Number(amount) || 0;
    if (numAmount <= 0) return;
    const newTransfer = {
      id: `tr-${Date.now()}`,
      sourceMethodId,
      destinationMethodId,
      amount: numAmount,
      date: date || new Date().toISOString().split('T')[0],
      note: note || '',
      createdAt: new Date().toISOString(),
    };
    setTransfers((prev) => [newTransfer, ...prev]);
  };

  // Core Accounting Formulas
  const getAccountSummary = (accountId) => {
    const accountTxs = transactions.filter((tx) => tx.accountId === accountId);
    let credit = 0;
    let debit = 0;

    accountTxs.forEach((tx) => {
      if (tx.type === 'credit') {
        credit += Number(tx.amount) || 0;
      } else if (tx.type === 'debit') {
        debit += Number(tx.amount) || 0;
      }
    });

    const balance = credit - debit;

    return {
      credit,
      debit,
      balance,
      transactionCount: accountTxs.length,
    };
  };

  const getOverallSummary = () => {
    let totalCredit = 0;
    let totalDebit = 0;

    transactions.forEach((tx) => {
      if (tx.type === 'credit') {
        totalCredit += Number(tx.amount) || 0;
      } else if (tx.type === 'debit') {
        totalDebit += Number(tx.amount) || 0;
      }
    });

    const netBalance = totalCredit - totalDebit;

    return {
      totalCredit,
      totalDebit,
      netBalance,
      accountsCount: accounts.length,
      transactionsCount: transactions.length,
    };
  };

  const getMethodBalances = () => {
    return methods.map((method) => {
      let credit = 0;
      let debit = 0;

      // Calculate from transactions
      transactions.forEach((tx) => {
        if (tx.methodId === method.id) {
          if (tx.type === 'credit') credit += Number(tx.amount) || 0;
          if (tx.type === 'debit') debit += Number(tx.amount) || 0;
        }
      });

      // Internal transfers adjustments
      transfers.forEach((tr) => {
        if (tr.destinationMethodId === method.id) {
          credit += Number(tr.amount) || 0; // Inflow
        }
        if (tr.sourceMethodId === method.id) {
          debit += Number(tr.amount) || 0; // Outflow
        }
      });

      return {
        ...method,
        credit,
        debit,
        balance: credit - debit,
      };
    });
  };

  return (
    <LedgerContext.Provider
      value={{
        accounts,
        transactions,
        methods,
        transfers,
        addAccount,
        editAccount,
        deleteAccount,
        addTransaction,
        editTransaction,
        deleteTransaction,
        addMethod,
        addTransfer,
        getAccountSummary,
        getOverallSummary,
        getMethodBalances,
      }}
    >
      {children}
    </LedgerContext.Provider>
  );
};

export const useLedger = () => useContext(LedgerContext);
