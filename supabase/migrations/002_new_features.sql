-- ================================================================
-- GRANA — Novas funcionalidades
-- Execute no Supabase: SQL Editor → New Query → Cole e Execute
-- ================================================================

-- ── BUDGETS: já existe, adicionar coluna spent_amount se não tiver
ALTER TABLE budgets ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- ── CREDIT CARDS ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS credit_cards (
  id              UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id         UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name            TEXT NOT NULL,
  limit_amount    DECIMAL(12,2) NOT NULL DEFAULT 0,
  closing_day     INT NOT NULL CHECK (closing_day BETWEEN 1 AND 31),
  due_day         INT NOT NULL CHECK (due_day BETWEEN 1 AND 31),
  color           TEXT DEFAULT '#818CF8',
  icon            TEXT DEFAULT '💳',
  is_active       BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE credit_cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_credit_cards" ON credit_cards FOR ALL USING (auth.uid() = user_id);

-- Adicionar coluna credit_card_id nas transactions
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS credit_card_id UUID REFERENCES credit_cards(id) ON DELETE SET NULL;

-- ── RECURRING TRANSACTIONS ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS recurring_transactions (
  id              UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id         UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  category_id     UUID REFERENCES categories(id) ON DELETE SET NULL,
  credit_card_id  UUID REFERENCES credit_cards(id) ON DELETE SET NULL,
  type            TEXT NOT NULL CHECK (type IN ('expense','income')),
  amount          DECIMAL(12,2) NOT NULL CHECK (amount > 0),
  description     TEXT NOT NULL,
  interval        TEXT NOT NULL CHECK (interval IN ('daily','weekly','monthly','yearly')),
  start_date      DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date        DATE,
  last_generated  DATE,
  is_active       BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE recurring_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_recurring" ON recurring_transactions FOR ALL USING (auth.uid() = user_id);

-- ── FINANCIAL HEALTH SCORE HISTORY ─────────────────────────────
CREATE TABLE IF NOT EXISTS health_scores (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id     UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  month       INT NOT NULL CHECK (month BETWEEN 1 AND 12),
  year        INT NOT NULL,
  score       INT NOT NULL CHECK (score BETWEEN 0 AND 100),
  details     JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, month, year)
);

ALTER TABLE health_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_health_scores" ON health_scores FOR ALL USING (auth.uid() = user_id);

-- ── ÍNDICES ─────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_credit_cards_user ON credit_cards(user_id);
CREATE INDEX IF NOT EXISTS idx_recurring_user ON recurring_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_health_scores_user ON health_scores(user_id, year DESC, month DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_card ON transactions(credit_card_id);
