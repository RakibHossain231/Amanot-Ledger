import Dexie from 'dexie';

export const db = new Dexie('AmanotLedgerDB');

db.version(1).stores({
  accounts: 'id, name, isArchived, createdAt, updatedAt',
  transactions: 'id, accountId, type, date, methodId, deletedAt, createdAt, updatedAt',
  methods: 'id, name, isActive, createdAt',
  transfers: 'id, sourceMethodId, destinationMethodId, date, deletedAt, createdAt',
  activityLogs: 'id, entityType, entityId, action, createdAt',
  syncQueue: '++id, table, action, recordId, timestamp',
});

// Seed default transaction methods if empty
export const seedDefaultData = async () => {
  const methodCount = await db.methods.count();
  if (methodCount === 0) {
    await db.methods.bulkAdd([
      { id: 'm-cash', name: 'Cash', isActive: true, createdAt: new Date().toISOString() },
      { id: 'm-bkash', name: 'bKash', isActive: true, createdAt: new Date().toISOString() },
      { id: 'm-nagad', name: 'Nagad', isActive: true, createdAt: new Date().toISOString() },
      { id: 'm-bank', name: 'Bank', isActive: true, createdAt: new Date().toISOString() },
      { id: 'm-other', name: 'Other', isActive: true, createdAt: new Date().toISOString() },
    ]);
  }

  const accountCount = await db.accounts.count();
  if (accountCount === 0) {
    const defaultAccounts = [
      { id: 'acc-sujon', name: 'সুজন (Sujon)', isArchived: false, createdAt: new Date().toISOString() },
      { id: 'acc-karim', name: 'করিম (Karim)', isArchived: false, createdAt: new Date().toISOString() },
    ];
    await db.accounts.bulkAdd(defaultAccounts);

    await db.transactions.bulkAdd([
      {
        id: 'tx-1',
        accountId: 'acc-sujon',
        type: 'credit',
        amount: 1500,
        particular: 'আমানত হিসেবে জমা দিলেন',
        methodId: 'm-cash',
        methodNameSnapshot: 'Cash',
        date: new Date().toISOString().split('T')[0],
        note: 'প্রাথমিক আমানত',
        createdAt: new Date().toISOString(),
        deletedAt: null,
      },
      {
        id: 'tx-2',
        accountId: 'acc-sujon',
        type: 'debit',
        amount: 1000,
        particular: 'টাকা ফেরত নিলেন',
        methodId: 'm-cash',
        methodNameSnapshot: 'Cash',
        date: new Date().toISOString().split('T')[0],
        note: '',
        createdAt: new Date().toISOString(),
        deletedAt: null,
      },
      {
        id: 'tx-3',
        accountId: 'acc-karim',
        type: 'credit',
        amount: 5000,
        particular: 'টাকা জমা দিল',
        methodId: 'm-bkash',
        methodNameSnapshot: 'bKash',
        date: new Date().toISOString().split('T')[0],
        note: '',
        createdAt: new Date().toISOString(),
        deletedAt: null,
      },
    ]);
  }
};
