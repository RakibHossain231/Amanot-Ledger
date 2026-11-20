import { describe, it, expect } from 'vitest';

/**
 * Pure accounting formula engine to verify core mathematical integrity
 */
const calculateAccountSummary = (transactions, accountId) => {
  const accountTxs = transactions.filter((t) => t.accountId === accountId && !t.deletedAt);
  let credit = 0;
  let debit = 0;

  for (const tx of accountTxs) {
    if (tx.type === 'credit') credit += Number(tx.amount) || 0;
    if (tx.type === 'debit') debit += Number(tx.amount) || 0;
  }

  return {
    credit,
    debit,
    balance: credit - debit,
    count: accountTxs.length,
  };
};

const calculateMethodBalances = (methods, transactions, transfers = []) => {
  return methods.map((method) => {
    let credit = 0;
    let debit = 0;

    for (const tx of transactions) {
      if (tx.methodId === method.id && !tx.deletedAt) {
        if (tx.type === 'credit') credit += Number(tx.amount) || 0;
        if (tx.type === 'debit') debit += Number(tx.amount) || 0;
      }
    }

    for (const tr of transfers) {
      if (!tr.deletedAt) {
        if (tr.destinationMethodId === method.id) credit += Number(tr.amount) || 0;
        if (tr.sourceMethodId === method.id) debit += Number(tr.amount) || 0;
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

const canDeleteAccount = (transactions, accountId) => {
  const summary = calculateAccountSummary(transactions, accountId);
  return summary.balance === 0;
};

describe('Amanot Ledger Core Accounting Scenarios', () => {
  // Test 1: Sujon gives 1500, Owner gives 1000 -> Expected +500
  it('Test 1: Credit 1500 and Debit 1000 results in +500 balance (Money deposited with owner)', () => {
    const txs = [
      { id: '1', accountId: 'acc-sujon', type: 'credit', amount: 1500 },
      { id: '2', accountId: 'acc-sujon', type: 'debit', amount: 1000 },
    ];
    const summary = calculateAccountSummary(txs, 'acc-sujon');
    expect(summary.credit).toBe(1500);
    expect(summary.debit).toBe(1000);
    expect(summary.balance).toBe(500);
  });

  // Test 2: Sujon gives 1000, Owner gives 1500 -> Expected -500
  it('Test 2: Credit 1000 and Debit 1500 results in -500 balance (Receivable from person)', () => {
    const txs = [
      { id: '1', accountId: 'acc-sujon', type: 'credit', amount: 1000 },
      { id: '2', accountId: 'acc-sujon', type: 'debit', amount: 1500 },
    ];
    const summary = calculateAccountSummary(txs, 'acc-sujon');
    expect(summary.credit).toBe(1000);
    expect(summary.debit).toBe(1500);
    expect(summary.balance).toBe(-500);
  });

  // Test 3: Sujon gives 5000, Owner gives 5000 -> Expected 0
  it('Test 3: Equal Credit 5000 and Debit 5000 results in 0 (Settled)', () => {
    const txs = [
      { id: '1', accountId: 'acc-sujon', type: 'credit', amount: 5000 },
      { id: '2', accountId: 'acc-sujon', type: 'debit', amount: 5000 },
    ];
    const summary = calculateAccountSummary(txs, 'acc-sujon');
    expect(summary.balance).toBe(0);
  });

  // Test 4: Edit a transaction
  it('Test 4: Editing transaction recalculates balance dynamically', () => {
    let txs = [
      { id: '1', accountId: 'acc-sujon', type: 'credit', amount: 1500 },
      { id: '2', accountId: 'acc-sujon', type: 'debit', amount: 1000 },
    ];
    expect(calculateAccountSummary(txs, 'acc-sujon').balance).toBe(500);

    // Edit transaction 2 from 1000 to 1200
    txs = txs.map((t) => (t.id === '2' ? { ...t, amount: 1200 } : t));
    expect(calculateAccountSummary(txs, 'acc-sujon').balance).toBe(300);
  });

  // Test 5: Delete a transaction
  it('Test 5: Soft deleting transaction recalculates balance dynamically', () => {
    let txs = [
      { id: '1', accountId: 'acc-sujon', type: 'credit', amount: 1500 },
      { id: '2', accountId: 'acc-sujon', type: 'debit', amount: 1000, deletedAt: null },
    ];
    expect(calculateAccountSummary(txs, 'acc-sujon').balance).toBe(500);

    // Mark as deleted
    txs = txs.map((t) => (t.id === '2' ? { ...t, deletedAt: new Date().toISOString() } : t));
    expect(calculateAccountSummary(txs, 'acc-sujon').balance).toBe(1500);
  });

  // Test 6, 7, 8: Method Balances
  it('Test 6, 7, 8: Method-wise balance increases on credit and decreases on debit', () => {
    const methods = [{ id: 'm-city', name: 'City Bank' }];
    let txs = [
      { id: '1', accountId: 'acc-1', type: 'credit', amount: 5000, methodId: 'm-city' },
    ];

    let balances = calculateMethodBalances(methods, txs);
    expect(balances[0].balance).toBe(5000);

    // Give 2000 through City Bank
    txs.push({ id: '2', accountId: 'acc-1', type: 'debit', amount: 2000, methodId: 'm-city' });
    balances = calculateMethodBalances(methods, txs);
    expect(balances[0].balance).toBe(3000);
  });

  // Test 9: Internal Transfer Between Methods
  it('Test 9: Transfer 1000 from Cash to City Bank updates method balances while total remains constant', () => {
    const methods = [
      { id: 'm-cash', name: 'Cash' },
      { id: 'm-city', name: 'City Bank' },
    ];

    // Initial: Cash has 5000, City Bank has 3000
    const txs = [
      { id: '1', accountId: 'acc-1', type: 'credit', amount: 5000, methodId: 'm-cash' },
      { id: '2', accountId: 'acc-2', type: 'credit', amount: 3000, methodId: 'm-city' },
    ];

    const transfers = [
      {
        id: 'tr-1',
        sourceMethodId: 'm-cash',
        destinationMethodId: 'm-city',
        amount: 1000,
      },
    ];

    const balances = calculateMethodBalances(methods, txs, transfers);
    const cashBalance = balances.find((b) => b.id === 'm-cash').balance;
    const cityBalance = balances.find((b) => b.id === 'm-city').balance;
    const total = cashBalance + cityBalance;

    expect(cashBalance).toBe(4000); // 5000 - 1000
    expect(cityBalance).toBe(4000); // 3000 + 1000
    expect(total).toBe(8000); // Total remains 8000
  });

  // Test 14: Zero-balance deletion protection
  it('Test 14: Accounts with non-zero balance cannot be deleted, zero balance accounts can be deleted', () => {
    const activeTxs = [
      { id: '1', accountId: 'acc-non-zero', type: 'credit', amount: 500 },
    ];
    expect(canDeleteAccount(activeTxs, 'acc-non-zero')).toBe(false);

    const settledTxs = [
      { id: '1', accountId: 'acc-settled', type: 'credit', amount: 500 },
      { id: '2', accountId: 'acc-settled', type: 'debit', amount: 500 },
    ];
    expect(canDeleteAccount(settledTxs, 'acc-settled')).toBe(true);
  });
});
