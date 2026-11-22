import React, { createContext, useContext, useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, seedDefaultData } from '../services/db';
import { syncService } from '../services/sync';

const LedgerContext = createContext();

export const LedgerProvider = ({ children }) => {
  const [isDbReady, setIsDbReady] = useState(false);

  useEffect(() => {
    seedDefaultData().then(() => {
      setIsDbReady(true);
      // Auto-sync on startup if online
      syncService.syncNow().catch(() => {});
    });
  }, []);

  const triggerAutoSync = () => {
    setTimeout(() => {
      syncService.syncNow().catch(() => {});
    }, 500);
  };

  // Live queries from Dexie.js (IndexedDB) - sorted alphabetically
  const accounts = useLiveQuery(
    () =>
      db.accounts
        .filter((a) => !a.isArchived)
        .toArray()
        .then((arr) =>
          arr.sort((a, b) =>
            a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
          )
        ),
    []
  ) || [];

  const transactions = useLiveQuery(
    () => db.transactions.filter((t) => !t.deletedAt).reverse().toArray(),
    []
  ) || [];

  const methods = useLiveQuery(
    () => db.methods.filter((m) => m.isActive).toArray(),
    []
  ) || [];

  const transfers = useLiveQuery(
    () => db.transfers.filter((tr) => !tr.deletedAt).reverse().toArray(),
    []
  ) || [];

  // 1. Account Operations
  const addAccount = async (name) => {
    if (!name || !name.trim()) return;
    const newAccount = {
      id: `acc-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: name.trim(),
      isArchived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await db.accounts.add(newAccount);
    await db.activityLogs.add({
      id: `log-${Date.now()}`,
      entityType: 'account',
      entityId: newAccount.id,
      action: 'create',
      newValues: newAccount,
      createdAt: new Date().toISOString(),
    });
    triggerAutoSync();
    return newAccount;
  };

  const editAccount = async (id, newName) => {
    if (!newName || !newName.trim()) return;
    const oldAccount = await db.accounts.get(id);
    const updatedFields = {
      name: newName.trim(),
      updatedAt: new Date().toISOString(),
    };
    await db.accounts.update(id, updatedFields);
    await db.activityLogs.add({
      id: `log-${Date.now()}`,
      entityType: 'account',
      entityId: id,
      action: 'update',
      oldValues: oldAccount,
      newValues: updatedFields,
      createdAt: new Date().toISOString(),
    });
    triggerAutoSync();
  };

  const deleteAccount = async (id) => {
    const summary = getAccountSummary(id);
    if (summary.balance !== 0) {
      throw new Error('Only accounts with zero (৳0) balance can be deleted.');
    }
    const oldAccount = await db.accounts.get(id);
    // Soft-archive account
    await db.accounts.update(id, {
      isArchived: true,
      updatedAt: new Date().toISOString(),
    });
    await db.activityLogs.add({
      id: `log-${Date.now()}`,
      entityType: 'account',
      entityId: id,
      action: 'archive',
      oldValues: oldAccount,
      createdAt: new Date().toISOString(),
    });
    triggerAutoSync();
  };

  // 2. Transaction Operations
  const addTransaction = async (tx) => {
    const methodObj = (methods.find((m) => m.id === tx.methodId)) || { name: 'Cash' };
    const newTx = {
      id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      accountId: tx.accountId,
      type: tx.type, // 'credit' (+) | 'debit' (−)
      amount: Math.abs(parseFloat(tx.amount)) || 0,
      particular: tx.particular?.trim() || '',
      methodId: tx.methodId,
      methodNameSnapshot: methodObj.name,
      date: tx.date || new Date().toISOString().split('T')[0],
      note: tx.note?.trim() || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    };
    await db.transactions.add(newTx);
    await db.activityLogs.add({
      id: `log-${Date.now()}`,
      entityType: 'transaction',
      entityId: newTx.id,
      action: 'create',
      newValues: newTx,
      createdAt: new Date().toISOString(),
    });
    triggerAutoSync();
    return newTx;
  };

  const editTransaction = async (id, updatedFields) => {
    const oldTx = await db.transactions.get(id);
    if (!oldTx) return;

    let methodName = oldTx.methodNameSnapshot;
    if (updatedFields.methodId) {
      const methodObj = methods.find((m) => m.id === updatedFields.methodId);
      if (methodObj) methodName = methodObj.name;
    }

    const newValues = {
      ...updatedFields,
      amount: updatedFields.amount !== undefined ? Math.abs(parseFloat(updatedFields.amount)) : oldTx.amount,
      methodNameSnapshot: methodName,
      updatedAt: new Date().toISOString(),
    };

    await db.transactions.update(id, newValues);
    await db.activityLogs.add({
      id: `log-${Date.now()}`,
      entityType: 'transaction',
      entityId: id,
      action: 'update',
      oldValues: oldTx,
      newValues,
      createdAt: new Date().toISOString(),
    });
    triggerAutoSync();
  };

  const deleteTransaction = async (id) => {
    const oldTx = await db.transactions.get(id);
    if (!oldTx) return;

    // Soft delete to preserve audit history
    await db.transactions.update(id, {
      deletedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    await db.activityLogs.add({
      id: `log-${Date.now()}`,
      entityType: 'transaction',
      entityId: id,
      action: 'delete',
      oldValues: oldTx,
      createdAt: new Date().toISOString(),
    });
    triggerAutoSync();
  };

  // 3. Method Operations
  const addMethod = async (name) => {
    if (!name || !name.trim()) return;
    const newMethod = {
      id: `m-${Date.now()}`,
      name: name.trim(),
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await db.methods.add(newMethod);
    triggerAutoSync();
    return newMethod;
  };

  // 4. Internal Transfer Between Methods
  const addTransfer = async ({ sourceMethodId, destinationMethodId, amount, note, date }) => {
    const numAmount = Math.abs(parseFloat(amount)) || 0;
    if (numAmount <= 0) return;
    const newTransfer = {
      id: `tr-${Date.now()}`,
      sourceMethodId,
      destinationMethodId,
      amount: numAmount,
      date: date || new Date().toISOString().split('T')[0],
      note: note?.trim() || '',
      createdAt: new Date().toISOString(),
      deletedAt: null,
    };
    await db.transfers.add(newTransfer);
    triggerAutoSync();
    return newTransfer;
  };

  // 5. Accounting Calculations
  const getAccountSummary = (accountId) => {
    const accountTxs = transactions.filter((tx) => tx.accountId === accountId);
    let credit = 0;
    let debit = 0;

    for (const tx of accountTxs) {
      if (tx.type === 'credit') {
        credit += Number(tx.amount) || 0;
      } else if (tx.type === 'debit') {
        debit += Number(tx.amount) || 0;
      }
    }

    return {
      credit,
      debit,
      balance: credit - debit,
      transactionCount: accountTxs.length,
    };
  };

  const getOverallSummary = () => {
    let totalCredit = 0;
    let totalDebit = 0;

    for (const tx of transactions) {
      if (tx.type === 'credit') {
        totalCredit += Number(tx.amount) || 0;
      } else if (tx.type === 'debit') {
        totalDebit += Number(tx.amount) || 0;
      }
    }

    return {
      totalCredit,
      totalDebit,
      netBalance: totalCredit - totalDebit,
      accountsCount: accounts.length,
      transactionsCount: transactions.length,
    };
  };

  const getMethodBalances = () => {
    return methods.map((method) => {
      let credit = 0;
      let debit = 0;

      // Calculate from personal transactions
      for (const tx of transactions) {
        if (tx.methodId === method.id) {
          if (tx.type === 'credit') credit += Number(tx.amount) || 0;
          if (tx.type === 'debit') debit += Number(tx.amount) || 0;
        }
      }

      // Calculate from internal transfers between methods
      for (const tr of transfers) {
        if (tr.destinationMethodId === method.id) {
          credit += Number(tr.amount) || 0; // Inflow
        }
        if (tr.sourceMethodId === method.id) {
          debit += Number(tr.amount) || 0; // Outflow
        }
      }

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
        isDbReady,
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
