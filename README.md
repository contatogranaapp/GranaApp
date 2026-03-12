# 🌱 Grana — Guia do Desenvolvedor

> Assistente financeiro pessoal com IA para brasileiros.

---

## ⚡ Setup em 15 minutos

### 1. Clone e instale dependências

```bash
# Instalar dependências
npm install

# Copiar variáveis de ambiente
cp .env.example .env.local
```

### 2. Configurar Supabase

1. Acesse [supabase.com](https://supabase.com) → **New Project**
2. Vá em **SQL Editor** → cole e execute o arquivo `supabase/migrations/001_initial.sql`
3. Vá em **Settings → API** e copie:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. Vá em **Authentication → Providers** e habilite **Email (Magic Link)**
5. Em **Authentication → URL Configuration**, adicione: `http://localhost:3000/**`

### 3. Configurar Anthropic (Claude AI)

1. Acesse [console.anthropic.com](https://console.anthropic.com)
2. **API Keys → Create Key**
3. Cole em `ANTHROPIC_API_KEY` no `.env.local`

### 4. Configurar Stripe

```bash
# Instalar Stripe CLI
brew install stripe/stripe-cli/stripe  # macOS
# ou baixe em: https://stripe.com/docs/stripe-cli

# Login
stripe login
```

1. Acesse [dashboard.stripe.com](https://dashboard.stripe.com) (use modo **Test**)
2. **Products → Add Product**: nome "Grana Pro", preço R$50/mês, recorrente
3. Copie o **Price ID** (price_xxx) → `STRIPE_PRO_PRICE_ID`
4. Copie a **Secret Key** → `STRIPE_SECRET_KEY`

### 5. Rodar localmente

```bash
# Terminal 1 — App
npm run dev

# Terminal 2 — Stripe webhook (para testar pagamentos)
npm run stripe:listen
# Copie o webhook secret (whsec_...) → STRIPE_WEBHOOK_SECRET no .env.local
```

Acesse: **http://localhost:3000**

---

## 📁 Estrutura do projeto

```
src/
├── app/
│   ├── (auth)/              ← Páginas sem sidebar (login, onboarding)
│   │   ├── login/           ← Magic link login
│   │   └── onboarding/      ← Setup inicial do usuário
│   ├── (app)/               ← Páginas autenticadas (com sidebar)
│   │   ├── dashboard/       ← Página principal
│   │   ├── transacoes/      ← Lista de transações
│   │   ├── metas/           ← Gestão de metas
│   │   ├── relatorios/      ← Relatório mensal
│   │   └── chat/            ← Chat com IA
│   └── api/
│       ├── chat/            ← POST — streaming com Claude
│       ├── transactions/    ← GET, POST, DELETE
│       ├── goals/           ← GET, POST, PATCH
│       ├── accounts/        ← GET, POST
│       ├── subscription/checkout/  ← POST — cria sessão Stripe
│       └── webhooks/stripe/ ← POST — ativa/cancela plano
├── components/
│   ├── layout/Sidebar.tsx
│   ├── chat/ChatInterface.tsx   ← Chat funcional com streaming
│   ├── dashboard/               ← Componentes do dashboard
│   └── goals/                   ← Componentes de metas
├── hooks/
│   ├── useTransactions.ts       ← CRUD de transações
│   └── useGoals.ts              ← CRUD de metas
├── lib/
│   ├── supabase.ts              ← Clientes Supabase
│   ├── anthropic.ts             ← Claude + system prompt
│   ├── stripe.ts                ← Cliente Stripe
│   └── utils.ts                 ← Helpers, formatadores, categorizador
├── types/index.ts               ← Todos os tipos TypeScript
└── styles/globals.css           ← Tailwind + variáveis CSS
```

---

## 🗄️ Banco de dados (Supabase)

### Tabelas principais

| Tabela          | Descrição                              |
|-----------------|----------------------------------------|
| `profiles`      | Dados do usuário + plano Stripe        |
| `accounts`      | Contas bancárias do usuário            |
| `categories`    | Categorias (sistema + customizadas)    |
| `transactions`  | Todas as transações                    |
| `goals`         | Metas financeiras                      |
| `chat_messages` | Histórico do chat com IA               |
| `budgets`       | Orçamentos mensais por categoria       |

### Funcionalidades automáticas do banco
- ✅ **RLS ativo** — usuário só acessa seus próprios dados
- ✅ **Trigger** — cria perfil automaticamente ao registrar
- ✅ **View** `monthly_summary` — resumo mensal por categoria

---

## 🔌 Endpoints da API

### Chat IA
```
POST /api/chat
Body: { messages: [], context: { profile, summary, goals, recentTransactions } }
Response: text/event-stream (SSE)
```

### Transações
```
GET    /api/transactions?month=3&year=2026&type=expense&page=1
POST   /api/transactions   { type, amount, description, date, category_id, ... }
DELETE /api/transactions?id=xxx
```

### Metas
```
GET   /api/goals?status=active
POST  /api/goals    { title, target_amount, deadline, icon }
PATCH /api/goals?id=xxx   { current_amount, status }
```

### Pagamentos
```
POST /api/subscription/checkout   → retorna { url: 'https://checkout.stripe.com/...' }
POST /api/webhooks/stripe         → recebe eventos do Stripe
```

---

## 💰 Modelo de negócio

| Plano    | Preço   | Recursos                                    |
|----------|---------|---------------------------------------------|
| **Free** | Grátis  | Lançamentos manuais, dashboard básico, 20 mensagens IA/mês |
| **Pro**  | R$50/mês | IA ilimitada, metas, relatórios, alertas, suporte |

**Custo por usuário Pro:**
- Supabase: ~R$0,05
- Claude API (~500 msgs): ~R$2-3
- Stripe fees: ~R$4,50
- **Margem líquida: ~R$42/usuário** 🎉

---

## 🚀 Deploy (Vercel)

```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel

# Configurar variáveis de ambiente no dashboard do Vercel
# Depois atualizar URL do webhook no Stripe Dashboard
```

---

## 📅 Roadmap MVP (4 semanas)

| Semana | Tarefas |
|--------|---------|
| **1** | Auth (magic link), onboarding, CRUD transações |
| **2** | Dashboard com dados reais, gráficos, categorização |
| **3** | Chat IA com streaming, metas, alertas |
| **4** | Stripe, polish, beta com 10 usuários |

---

## 🆘 Dúvidas comuns

**"Erro de CORS no Supabase"**
→ Verifique se `NEXT_PUBLIC_SUPABASE_URL` está correto no `.env.local`

**"Stripe webhook não recebe eventos"**
→ Rode `npm run stripe:listen` e certifique que `STRIPE_WEBHOOK_SECRET` está atualizado

**"IA não responde"**
→ Verifique se `ANTHROPIC_API_KEY` começa com `sk-ant-`

**"Usuário não redirecionado após login"**
→ Configure o redirect URL no Supabase: Authentication → URL Configuration → `http://localhost:3000/**`
