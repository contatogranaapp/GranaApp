-- ============================================
-- GRANA — Schema do Banco de Dados (Supabase)
-- ============================================

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PERFIS DE USUÁRIO
-- ============================================
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  monthly_income DECIMAL(12,2) DEFAULT 0,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro')),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  currency TEXT DEFAULT 'BRL',
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CONTAS BANCÁRIAS
-- ============================================
CREATE TABLE accounts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,                    -- "Nubank", "Bradesco", "Carteira"
  type TEXT NOT NULL CHECK (type IN ('checking', 'savings', 'credit', 'cash', 'investment')),
  balance DECIMAL(12,2) DEFAULT 0,
  color TEXT DEFAULT '#00C06B',
  icon TEXT DEFAULT '🏦',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CATEGORIAS
-- ============================================
CREATE TABLE categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,  -- NULL = categoria padrão
  name TEXT NOT NULL,
  icon TEXT NOT NULL,
  color TEXT NOT NULL,
  type TEXT CHECK (type IN ('expense', 'income', 'both')) DEFAULT 'expense',
  keywords TEXT[] DEFAULT '{}',   -- Para categorização automática
  budget_limit DECIMAL(12,2),     -- Limite mensal opcional
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Categorias padrão do sistema
INSERT INTO categories (id, name, icon, color, type, keywords) VALUES
  ('cat_alimentacao',   'Alimentação',    '🍕', '#FF6B6B', 'expense', ARRAY['mercado','supermercado','ifood','rappi','restaurante','lanche','padaria','açougue']),
  ('cat_transporte',    'Transporte',     '🚗', '#4ECDC4', 'expense', ARRAY['uber','99','posto','gasolina','metro','onibus','estacionamento','pedágio']),
  ('cat_moradia',       'Moradia',        '🏠', '#45B7D1', 'expense', ARRAY['aluguel','condominio','agua','luz','internet','gas']),
  ('cat_saude',         'Saúde',          '💊', '#96CEB4', 'expense', ARRAY['farmacia','medico','hospital','plano de saude','dentista','academia']),
  ('cat_lazer',         'Lazer',          '🎮', '#FFEAA7', 'expense', ARRAY['netflix','spotify','cinema','viagem','hotel','bar','balada']),
  ('cat_educacao',      'Educação',       '📚', '#DDA0DD', 'expense', ARRAY['curso','faculdade','livro','escola']),
  ('cat_roupas',        'Roupas',         '👕', '#F0E68C', 'expense', ARRAY['roupa','calçado','tenis','shopping','zara','renner']),
  ('cat_assinaturas',   'Assinaturas',    '📱', '#87CEEB', 'expense', ARRAY['netflix','spotify','prime','adobe','microsoft','apple']),
  ('cat_salario',       'Salário',        '💼', '#00C06B', 'income',  ARRAY['salario','pagamento','holerite','pro labore']),
  ('cat_freelance',     'Freelance',      '💻', '#20B2AA', 'income',  ARRAY['freelance','projeto','consultoria','servico']),
  ('cat_outros_rec',    'Outras Receitas','💰', '#98FB98', 'income',  ARRAY[]),
  ('cat_outros_gast',   'Outros Gastos',  '📦', '#D3D3D3', 'expense', ARRAY[]);

-- ============================================
-- TRANSAÇÕES
-- ============================================
CREATE TABLE transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  
  type TEXT NOT NULL CHECK (type IN ('expense', 'income', 'transfer')),
  amount DECIMAL(12,2) NOT NULL,
  description TEXT NOT NULL,
  notes TEXT,
  
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Parcelamento
  is_installment BOOLEAN DEFAULT false,
  installment_current INT,
  installment_total INT,
  installment_group_id UUID,
  
  -- Recorrência
  is_recurring BOOLEAN DEFAULT false,
  recurring_interval TEXT CHECK (recurring_interval IN ('daily','weekly','monthly','yearly')),
  
  -- Fonte
  source TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'ai_chat', 'csv_import', 'api')),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- METAS FINANCEIRAS
-- ============================================
CREATE TABLE goals (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT '🎯',
  
  target_amount DECIMAL(12,2) NOT NULL,
  current_amount DECIMAL(12,2) DEFAULT 0,
  
  deadline DATE,
  monthly_target DECIMAL(12,2),   -- Calculado automaticamente
  
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'cancelled')),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- HISTÓRICO DO CHAT COM IA
-- ============================================
CREATE TABLE chat_messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  
  -- Metadados da IA
  tokens_used INT,
  action_taken TEXT,   -- 'created_transaction', 'showed_report', null...
  action_data JSONB,   -- Dados da ação executada
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ORÇAMENTOS MENSAIS
-- ============================================
CREATE TABLE budgets (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE NOT NULL,
  
  month INT NOT NULL,   -- 1-12
  year INT NOT NULL,
  limit_amount DECIMAL(12,2) NOT NULL,
  
  UNIQUE(user_id, category_id, month, year),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ÍNDICES PARA PERFORMANCE
-- ============================================
CREATE INDEX idx_transactions_user_date ON transactions(user_id, date DESC);
CREATE INDEX idx_transactions_category ON transactions(category_id);
CREATE INDEX idx_chat_messages_user ON chat_messages(user_id, created_at DESC);
CREATE INDEX idx_goals_user ON goals(user_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;

-- Políticas: usuário só vê seus próprios dados
CREATE POLICY "users_own_profile" ON profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "users_own_accounts" ON accounts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "users_own_transactions" ON transactions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "users_own_goals" ON goals FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "users_own_chat" ON chat_messages FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "users_own_budgets" ON budgets FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "categories_public_or_own" ON categories FOR SELECT USING (user_id IS NULL OR auth.uid() = user_id);

-- ============================================
-- VIEWS ÚTEIS
-- ============================================

-- Resumo mensal por categoria
CREATE VIEW monthly_summary AS
SELECT
  t.user_id,
  EXTRACT(YEAR FROM t.date) AS year,
  EXTRACT(MONTH FROM t.date) AS month,
  c.name AS category_name,
  c.icon AS category_icon,
  c.color AS category_color,
  t.type,
  SUM(t.amount) AS total,
  COUNT(*) AS transaction_count
FROM transactions t
LEFT JOIN categories c ON t.category_id = c.id
GROUP BY t.user_id, year, month, c.name, c.icon, c.color, t.type;

-- Saldo atual de cada conta
CREATE VIEW account_balances AS
SELECT
  a.id,
  a.user_id,
  a.name,
  a.type,
  a.color,
  a.icon,
  a.balance + COALESCE(
    SUM(CASE WHEN t.type = 'income' THEN t.amount
             WHEN t.type = 'expense' THEN -t.amount
             ELSE 0 END), 0
  ) AS current_balance
FROM accounts a
LEFT JOIN transactions t ON a.id = t.account_id
GROUP BY a.id;
