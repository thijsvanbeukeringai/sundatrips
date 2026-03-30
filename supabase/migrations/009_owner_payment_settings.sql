-- Per-owner payment method control (set by admin)
-- 'all' = cash + online, 'cash_only' = cash only, 'online_only' = stripe only
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS allowed_payment_methods TEXT NOT NULL DEFAULT 'all'
    CHECK (allowed_payment_methods IN ('all', 'cash_only', 'online_only'));
