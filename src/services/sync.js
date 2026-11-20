import { db } from './db';
import { supabase, isSupabaseConfigured } from './supabase';

class SyncService {
  constructor() {
    this.isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    this.status = 'idle'; // 'idle' | 'syncing' | 'synced' | 'offline' | 'error'
    this.lastSync = localStorage.getItem('amanot_last_sync') || null;
    this.listeners = new Set();

    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.handleNetworkChange(true));
      window.addEventListener('offline', () => this.handleNetworkChange(false));
    }
  }

  subscribe(listener) {
    this.listeners.add(listener);
    listener({ isOnline: this.isOnline, status: this.status, lastSync: this.lastSync });
    return () => this.listeners.delete(listener);
  }

  notify() {
    this.listeners.forEach((listener) =>
      listener({ isOnline: this.isOnline, status: this.status, lastSync: this.lastSync })
    );
  }

  handleNetworkChange(online) {
    this.isOnline = online;
    if (online) {
      this.status = 'idle';
      this.syncNow();
    } else {
      this.status = 'offline';
    }
    this.notify();
  }

  async syncNow() {
    if (!this.isOnline) {
      this.status = 'offline';
      this.notify();
      return { success: false, message: 'Offline' };
    }

    if (!isSupabaseConfigured || !supabase) {
      this.status = 'synced'; // Standalone local offline mode
      this.notify();
      return { success: true, message: 'Local Offline Engine Active (No Supabase keys configured)' };
    }

    try {
      this.status = 'syncing';
      this.notify();

      // Check current Supabase authenticated user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        this.status = 'idle';
        this.notify();
        return { success: false, message: 'User not logged into Supabase' };
      }

      const ownerId = user.id;

      // 0. Auto-sync Profile row in Supabase
      try {
        await supabase.from('profiles').upsert({
          owner_id: ownerId,
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Owner',
          email: user.email,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'owner_id' });
      } catch (profileErr) {
        console.warn('Profile sync notice:', profileErr);
      }

      // 1. Sync Methods
      const localMethods = await db.methods.toArray();
      for (const method of localMethods) {
        await supabase.from('transaction_methods').upsert({
          id: method.id,
          owner_id: ownerId,
          method_name: method.name,
          is_active: method.isActive,
          updated_at: method.updatedAt || new Date().toISOString(),
        });
      }

      // 2. Sync Accounts
      const localAccounts = await db.accounts.toArray();
      for (const acc of localAccounts) {
        await supabase.from('accounts').upsert({
          id: acc.id,
          owner_id: ownerId,
          account_name: acc.name,
          is_archived: acc.isArchived,
          updated_at: acc.updatedAt || new Date().toISOString(),
        });
      }

      // 3. Sync Transactions
      const localTransactions = await db.transactions.toArray();
      for (const tx of localTransactions) {
        await supabase.from('transactions').upsert({
          id: tx.id,
          owner_id: ownerId,
          account_id: tx.accountId,
          transaction_type: tx.type,
          amount: tx.amount,
          transaction_date: tx.date,
          particular: tx.particular,
          method_id: tx.methodId,
          method_name_snapshot: tx.methodNameSnapshot,
          note: tx.note,
          deleted_at: tx.deletedAt,
          updated_at: tx.updatedAt || new Date().toISOString(),
        });
      }

      // 4. Sync Transfers
      const localTransfers = await db.transfers.toArray();
      for (const tr of localTransfers) {
        await supabase.from('internal_transfers').upsert({
          id: tr.id,
          owner_id: ownerId,
          source_method_id: tr.sourceMethodId,
          destination_method_id: tr.destinationMethodId,
          amount: tr.amount,
          transfer_date: tr.date,
          note: tr.note,
          deleted_at: tr.deletedAt,
          updated_at: tr.updatedAt || new Date().toISOString(),
        });
      }

      // 5. Pull Remote Updates
      // 5.1 Remote Methods
      const { data: remoteMethods } = await supabase
        .from('transaction_methods')
        .select('*')
        .eq('owner_id', ownerId);

      if (remoteMethods && remoteMethods.length > 0) {
        for (const rM of remoteMethods) {
          await db.methods.put({
            id: rM.id,
            name: rM.method_name,
            isActive: rM.is_active,
            createdAt: rM.created_at,
            updatedAt: rM.updated_at,
          });
        }
      }

      // 5.2 Remote Accounts
      const { data: remoteAccounts } = await supabase
        .from('accounts')
        .select('*')
        .eq('owner_id', ownerId);

      if (remoteAccounts && remoteAccounts.length > 0) {
        for (const rAcc of remoteAccounts) {
          await db.accounts.put({
            id: rAcc.id,
            name: rAcc.account_name,
            isArchived: rAcc.is_archived,
            createdAt: rAcc.created_at,
            updatedAt: rAcc.updated_at,
          });
        }
      }

      // 5.3 Remote Transactions
      const { data: remoteTxs } = await supabase
        .from('transactions')
        .select('*')
        .eq('owner_id', ownerId);

      if (remoteTxs && remoteTxs.length > 0) {
        for (const rTx of remoteTxs) {
          await db.transactions.put({
            id: rTx.id,
            accountId: rTx.account_id,
            type: rTx.transaction_type,
            amount: parseFloat(rTx.amount),
            particular: rTx.particular,
            methodId: rTx.method_id,
            methodNameSnapshot: rTx.method_name_snapshot,
            date: rTx.transaction_date,
            note: rTx.note,
            deletedAt: rTx.deleted_at,
            createdAt: rTx.created_at,
            updatedAt: rTx.updated_at,
          });
        }
      }

      // 5.4 Remote Transfers
      const { data: remoteTransfers } = await supabase
        .from('internal_transfers')
        .select('*')
        .eq('owner_id', ownerId);

      if (remoteTransfers && remoteTransfers.length > 0) {
        for (const rTr of remoteTransfers) {
          await db.transfers.put({
            id: rTr.id,
            sourceMethodId: rTr.source_method_id,
            destinationMethodId: rTr.destination_method_id,
            amount: parseFloat(rTr.amount),
            date: rTr.transfer_date,
            note: rTr.note,
            deletedAt: rTr.deleted_at,
            createdAt: rTr.created_at,
            updatedAt: rTr.updated_at,
          });
        }
      }

      this.lastSync = new Date().toISOString();
      localStorage.setItem('amanot_last_sync', this.lastSync);
      this.status = 'synced';
      this.notify();

      return { success: true, timestamp: this.lastSync };
    } catch (error) {
      console.error('Cloud Sync Error:', error);
      this.status = 'error';
      this.notify();
      return { success: false, error: error.message };
    }
  }
}

export const syncService = new SyncService();
