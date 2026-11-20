-- ====================================================================
-- AMANOT LEDGER (আমানত লেজার) - DATABASE SCHEMA & RLS POLICIES
-- PostgreSQL / Supabase Schema Definition
-- ====================================================================

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  language TEXT DEFAULT 'bn',
  theme TEXT DEFAULT 'system',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT profiles_owner_unique UNIQUE (owner_id)
);

-- 2. Transaction Methods Table (Cash, bKash, Bank, etc.)
CREATE TABLE IF NOT EXISTS public.transaction_methods (
  id TEXT PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  method_name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Individual Accounts Table (Sujon, Karim, etc.)
CREATE TABLE IF NOT EXISTS public.accounts (
  id TEXT PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_name TEXT NOT NULL,
  is_archived BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Transactions Table (Person-based Ledger)
CREATE TABLE IF NOT EXISTS public.transactions (
  id TEXT PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id TEXT NOT NULL REFERENCES public.accounts(id) ON DELETE RESTRICT,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('credit', 'debit')),
  amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  particular TEXT NOT NULL,
  method_id TEXT REFERENCES public.transaction_methods(id) ON DELETE SET NULL,
  method_name_snapshot TEXT NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  sync_version BIGINT DEFAULT 1
);

-- 5. Internal Transfers Between Methods (Cash -> Bank, etc.)
CREATE TABLE IF NOT EXISTS public.internal_transfers (
  id TEXT PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_method_id TEXT NOT NULL REFERENCES public.transaction_methods(id),
  destination_method_id TEXT NOT NULL REFERENCES public.transaction_methods(id),
  amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
  transfer_date DATE NOT NULL DEFAULT CURRENT_DATE,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- 6. Audit & Activity Logs
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id TEXT PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  action TEXT NOT NULL,
  old_values JSONB,
  new_values JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ====================================================================
-- INDEXES FOR MAXIMUM QUERY EFFICIENCY
-- ====================================================================
CREATE INDEX IF NOT EXISTS idx_accounts_owner ON public.accounts(owner_id);
CREATE INDEX IF NOT EXISTS idx_transactions_owner ON public.transactions(owner_id);
CREATE INDEX IF NOT EXISTS idx_transactions_account ON public.transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON public.transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_transfers_owner ON public.internal_transfers(owner_id);
CREATE INDEX IF NOT EXISTS idx_methods_owner ON public.transaction_methods(owner_id);

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Ensures each owner can ONLY access and modify their own financial data
-- ====================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internal_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = owner_id);

-- Accounts Policies
CREATE POLICY "Users can view own accounts" ON public.accounts FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Users can insert own accounts" ON public.accounts FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Users can update own accounts" ON public.accounts FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Users can delete own accounts" ON public.accounts FOR DELETE USING (auth.uid() = owner_id);

-- Transactions Policies
CREATE POLICY "Users can view own transactions" ON public.transactions FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Users can insert own transactions" ON public.transactions FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Users can update own transactions" ON public.transactions FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Users can delete own transactions" ON public.transactions FOR DELETE USING (auth.uid() = owner_id);

-- Methods Policies
CREATE POLICY "Users can view own methods" ON public.transaction_methods FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Users can insert own methods" ON public.transaction_methods FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Users can update own methods" ON public.transaction_methods FOR UPDATE USING (auth.uid() = owner_id);

-- Internal Transfers Policies
CREATE POLICY "Users can view own transfers" ON public.internal_transfers FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Users can insert own transfers" ON public.internal_transfers FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Users can update own transfers" ON public.internal_transfers FOR UPDATE USING (auth.uid() = owner_id);

-- Activity Logs Policies
CREATE POLICY "Users can view own activity logs" ON public.activity_logs FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Users can insert own activity logs" ON public.activity_logs FOR INSERT WITH CHECK (auth.uid() = owner_id);
