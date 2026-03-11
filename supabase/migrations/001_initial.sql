-- ================================================================
-- GRANA — Schema completo do banco de dados
-- Execute no Supabase: SQL Editor → New Query → Cole e Execute
-- ================================================================

-- Extensões
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── PROFILES ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id              UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name            TEXT NOT NULL,
  email           TEXT NOT NULL,
  monthly_income  DECIMAL(12,2) DEFAULT 0,
  plan            TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro')),
  stripe_customer_id      TEXT UNIQUE,
  stripe_subscription_id  TEXT,
  currency        TEXT DEFAULT 'BRL',
  avatar_url      TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── ACCOUNTS ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS accounts (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id     UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name        TEXT NOT NULL,
  type        TEXT NOT NULL CHECK (type IN ('checking','savings','credit','cash','investment')),
  balance     DECIMAL(12,2) DEFAULT 0,
  color       TEXT DEFAULT '#2DCC8F',
  icon        TEXT DEFAULT '🏦',
  is_active   BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── CATEGORIES ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categories (
  id            UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id       UUID REFERENCES profiles(id) ON DELETE CASCADE, -- NULL = categoria padrão do sistema
  name          TEXT NOT NULL,
  icon          TEXT NOT NULL,
  color         TEXT NOT NULL,
  type          TEXT CHECK (type IN ('expense','income','both')) DEFAULT 'expense',
  keywords      TEXT[] DEFAULT '{}',
  budget_limit  DECIMAL(12,2),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Categorias padrão do sistema (user_id NULL)
INSERT INTO categories (id, name, icon, color, type, keywords) VALUES
  ('cat_alimentacao',  'Alimentação',     '🍕', '#FF5E5E', 'expense', ARRAY['mercado','supermercado','ifood','rappi','restaurante','lanche','padaria','açougue','pão de açúcar','carrefour','extra','pizza','hamburguer','delivery','mcdonalds']),
  ('cat_transporte',   'Transporte',      '🚗', '#5B8DEF', 'expense', ARRAY['uber','99','taxi','posto','gasolina','combustível','metrô','metro','ônibus','onibus','estacionamento','pedágio','shell','ipiranga']),
  ('cat_moradia',      'Moradia',         '🏠', '#F5A623', 'expense', ARRAY['aluguel','condominio','água','luz','energia','internet','net','claro','vivo','tim','gás','iptu']),
  ('cat_saude',        'Saúde',           '💊', '#96CEB4', 'expense', ARRAY['farmácia','farmacia','drogaria','ultrafarma','médico','medico','hospital','exame','dentista','plano de saúde','unimed','academia','smart fit']),
  ('cat_lazer',        'Lazer',           '🎮', '#A78BFA', 'expense', ARRAY['netflix','spotify','hbo','disney','amazon prime','cinema','ingresso','viagem','hotel','airbnb','bar','balada','steam']),
  ('cat_educacao',     'Educação',        '📚', '#60A5FA', 'expense', ARRAY['curso','faculdade','universidade','livro','escola','udemy','alura','coursera','mensalidade']),
  ('cat_roupas',       'Roupas',          '👕', '#F0E68C', 'expense', ARRAY['roupa','calçado','tenis','shopping','zara','renner','riachuelo','c&a','hering']),
  ('cat_assinaturas',  'Assinaturas',     '📱', '#818CF8', 'expense', ARRAY['netflix','spotify','prime','adobe','microsoft','apple','google one','dropbox','notion','canva','chatgpt']),
  ('cat_salario',      'Salário',         '💼', '#2DCC8F', 'income',  ARRAY['salário','salario','pagamento','holerite','pro labore']),
  ('cat_freelance',    'Freelance',       '💻', '#20B2AA', 'income',  ARRAY['freelance','projeto','consultoria','serviço','honorário','comissão','pix recebido']),
  ('cat_outros_rec',   'Outras Receitas', '💰', '#34D399', 'income',  ARRAY[]::TEXT[]),
  ('cat_outros_gast',  'Outros Gastos',   '📦', '#6B7280', 'expense', ARRAY[]::TEXT[])
ON CONFLICT (id) DO NOTHING;

-- ── TRANSACTIONS ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS transactions (
  id                    UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id               UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  account_id            UUID REFERENCES accounts(id) ON DELETE SET NULL,
  category_id           UUID REFERENCES categories(id) ON DELETE SET NULL,
  type                  TEXT NOT NULL CHECK (type IN ('expense','income','transfer')),
  amount                DECIMAL(12,2) NOT NULL CHECK (amount > 0),
  description           TEXT NOT NULL,
  notes                 TEXT,
  date                  DATE NOT NULL DEFAULT CURRENT_DATE,
  is_installment        BOOLEAN DEFAULT false,
  installment_current   INT,
  installment_total     INT,
  installment_group_id  UUID,
  is_recurring          BOOLEAN DEFAULT false,
  recurring_interval    TEXT CHECK (recurring_interval IN ('daily','weekly','monthly','yearly')),
  source                TEXT DEFAULT 'manual' CHECK (source IN ('manual','ai_chat','csv_import','api')),
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- ── GOALS ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS goals (
  id              UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id         UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title           TEXT NOT NULL,
  description     TEXT,
  icon            TEXT DEFAULT '🎯',
  target_amount   DECIMAL(12,2) NOT NULL CHECK (target_amount > 0),
  current_amount  DECIMAL(12,2) DEFAULT 0,
  deadline        DATE,
  monthly_target  DECIMAL(12,2),
  status          TEXT DEFAULT 'active' CHECK (status IN ('active','completed','paused','cancelled')),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── CHAT MESSAGES ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS chat_messages (
  id           UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id      UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  role         TEXT NOT NULL CHECK (role IN ('user','assistant')),
  content      TEXT NOT NULL,
  tokens_used  INT,
  action_taken TEXT,
  action_data  JSONB,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ── BUDGETS ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS budgets (
  id            UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id       UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  category_id   UUID REFERENCES categories(id) ON DELETE CASCADE NOT NULL,
  month         INT NOT NULL CHECK (month BETWEEN 1 AND 12),
  year          INT NOT NULL,
  limit_amount  DECIMAL(12,2) NOT NULL CHECK (limit_amount > 0),
  UNIQUE(user_id, category_id, month, year),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── ÍNDICES ─────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_transactions_user_date    ON transactions(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_category      ON transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type          ON transactions(user_id, type);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user         ON chat_messages(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_goals_user_status          ON goals(user_id, status);

-- ── ROW LEVEL SECURITY (RLS) ────────────────────────────────────
ALTER TABLE profiles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts       ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals          ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages  ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets        ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories     ENABLE ROW LEVEL SECURITY;

-- Políticas: cada usuário só vê/edita seus próprios dados
CREATE POLICY "own_profile"       ON profiles       FOR ALL USING (auth.uid() = id);
CREATE POLICY "own_accounts"      ON accounts       FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_transactions"  ON transactions   FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_goals"         ON goals          FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_chat"          ON chat_messages  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_budgets"       ON budgets        FOR ALL USING (auth.uid() = user_id);
-- Categorias: sistema (user_id NULL) são públicas; customizadas são privadas
CREATE POLICY "categories_access" ON categories     FOR SELECT USING (user_id IS NULL OR auth.uid() = user_id);
CREATE POLICY "categories_insert" ON categories     FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "categories_update" ON categories     FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "categories_delete" ON categories     FOR DELETE USING (auth.uid() = user_id);

-- ── TRIGGER: cria perfil automaticamente ao registrar ───────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── VIEW: resumo mensal ──────────────────────────────────────────
CREATE OR REPLACE VIEW monthly_summary AS
SELECT
  t.user_id,
  EXTRACT(YEAR  FROM t.date)::INT AS year,
  EXTRACT(MONTH FROM t.date)::INT AS month,
  c.id    AS category_id,
  c.name  AS category_name,
  c.icon  AS category_icon,
  c.color AS category_color,
  t.type,
  SUM(t.amount)  AS total,
  COUNT(*)::INT  AS transaction_count
FROM transactions t
LEFT JOIN categories c ON t.category_id = c.id
GROUP BY t.user_id, year, month, c.id, c.name, c.icon, c.color, t.type;
