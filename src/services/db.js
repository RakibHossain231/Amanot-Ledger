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

// Seed default transaction methods only (No demo accounts or transactions)
export const seedDefaultData = async () => {
  // Purge any legacy demo data from browser if present
  try {
    await db.accounts.where('id').anyOf(['acc-sujon', 'acc-karim']).delete();
    await db.transactions.where('id').anyOf(['tx-1', 'tx-2', 'tx-3', 'tx-4']).delete();
  } catch (e) {
    // ignore
  }

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
};
