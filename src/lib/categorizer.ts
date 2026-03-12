// src/lib/categorizer.ts
// ============================================
// CATEGORIZADOR AUTOMÁTICO DE TRANSAÇÕES
// ============================================

interface CategoryMatch {
  category_id: string
  confidence: number
}

// Mapa de palavras-chave → categoria
// (espelha os dados do banco, mas usado no front para preview rápido)
const KEYWORD_MAP: Record<string, string[]> = {
  cat_alimentacao: [
    'mercado', 'supermercado', 'ifood', 'rappi', 'uber eats', 'restaurante',
    'lanche', 'padaria', 'açougue', 'hortifruti', 'pão de açúcar', 'carrefour',
    'extra', 'walmart', 'atacadão', 'assaí', 'pizza', 'hamburger', 'sushi',
    'delivery', 'mcdonalds', 'burger king', 'subway', 'kfc',
  ],
  cat_transporte: [
    'uber', '99', 'taxi', 'cabify', 'posto', 'gasolina', 'combustível', 'etanol',
    'metro', 'metrô', 'ônibus', 'onibus', 'estacionamento', 'pedágio', 'pedagio',
    'shell', 'ipiranga', 'petrobras', 'br', 'maintenance', 'manutenção',
  ],
  cat_moradia: [
    'aluguel', 'condominio', 'condomínio', 'água', 'agua', 'luz', 'energia',
    'internet', 'net', 'claro', 'vivo', 'tim', 'oi', 'gás', 'gas', 'iptu',
    'seguro residencial', 'móveis', 'moveis', 'reforma',
  ],
  cat_saude: [
    'farmácia', 'farmacia', 'drogaria', 'ultrafarma', 'droga raia', 'pacheco',
    'médico', 'medico', 'hospital', 'clínica', 'clinica', 'exame', 'dentista',
    'plano de saúde', 'unimed', 'amil', 'bradesco saúde', 'academia', 'gym',
    'smart fit', 'bodytech', 'fisioterapia',
  ],
  cat_lazer: [
    'netflix', 'spotify', 'hbo', 'disney', 'amazon prime', 'apple tv',
    'cinema', 'ingresso', 'teatro', 'show', 'viagem', 'hotel', 'airbnb',
    'bar', 'balada', 'festa', 'jogo', 'steam', 'playstation', 'xbox',
  ],
  cat_educacao: [
    'curso', 'faculdade', 'universidade', 'livro', 'escola', 'udemy', 'alura',
    'coursera', 'mensalidade', 'material escolar', 'inglês', 'ingles',
  ],
  cat_roupas: [
    'roupa', 'calçado', 'tenis', 'tênis', 'shopping', 'zara', 'renner', 'riachuelo',
    'c&a', 'hering', 'lojas americanas', 'centauro', 'decathlon',
  ],
  cat_assinaturas: [
    'netflix', 'spotify', 'prime', 'adobe', 'microsoft', 'apple', 'google one',
    'dropbox', 'notion', 'canva', 'figma', 'chatgpt', 'claude', 'openai',
    'antivírus', 'antivirus', 'domínio', 'dominio', 'hospedagem',
  ],
  cat_salario: [
    'salário', 'salario', 'pagamento', 'holerite', 'pro labore', 'prolabore',
    'folha', 'transferência recebida',
  ],
  cat_freelance: [
    'freelance', 'projeto', 'consultoria', 'serviço', 'servico', 'honorário',
    'honorario', 'comissão', 'comissao', 'pix recebido',
  ],
}

/**
 * Detecta a categoria mais provável para uma descrição de transação
 */
export function detectCategory(description: string): CategoryMatch {
  const text = description.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

  let bestMatch = { category_id: 'cat_outros_gast', confidence: 0 }

  for (const [categoryId, keywords] of Object.entries(KEYWORD_MAP)) {
    for (const keyword of keywords) {
      const normalizedKeyword = keyword.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      if (text.includes(normalizedKeyword)) {
        // Pontuação baseada no tamanho da keyword (mais específico = mais confiança)
        const confidence = normalizedKeyword.length / text.length + 0.5
        if (confidence > bestMatch.confidence) {
          bestMatch = { category_id: categoryId, confidence }
        }
      }
    }
  }

  return bestMatch
}

/**
 * Parseia texto em linguagem natural para dados de transação
 * Ex: "gastei 45 reais no mercado" → { amount: 45, description: "Mercado", type: "expense" }
 */
export function parseNaturalTransaction(text: string): Partial<{
  amount: number
  description: string
  type: 'expense' | 'income'
  date: string
  category_id: string
}> | null {
  const lower = text.toLowerCase()

  // Detectar tipo
  const incomeWords = ['recebi', 'ganhei', 'entrou', 'caiu', 'depositei', 'transferência recebida']
  const expenseWords = ['gastei', 'paguei', 'comprei', 'fui', 'comi', 'abasteci', 'assinei']
  const isIncome = incomeWords.some(w => lower.includes(w))
  const isExpense = expenseWords.some(w => lower.includes(w))

  if (!isIncome && !isExpense) return null

  // Extrair valor — padrões: "45 reais", "R$ 45", "45,90", "45.90"
  const valuePatterns = [
    /r\$\s*(\d+(?:[.,]\d{1,2})?)/i,
    /(\d+(?:[.,]\d{1,2})?)\s*(?:reais?|conto[s]?|real)/i,
    /(\d+(?:[.,]\d{1,2})?)/,
  ]

  let amount: number | null = null
  for (const pattern of valuePatterns) {
    const match = text.match(pattern)
    if (match) {
      amount = parseFloat(match[1].replace(',', '.'))
      break
    }
  }

  if (!amount) return null

  // Extrair data
  const todayWords = ['hoje', 'agora', 'pouco']
  const yesterdayWords = ['ontem']
  let date = new Date().toISOString().split('T')[0]

  if (yesterdayWords.some(w => lower.includes(w))) {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    date = yesterday.toISOString().split('T')[0]
  }

  // Extrair descrição (palavra-chave após preposição)
  const afterPrep = text.match(/(?:no|na|em|pro|pra|pelo|pela|com)\s+([^,\n.]+)/i)
  const description = afterPrep
    ? afterPrep[1].trim().replace(/\s+/g, ' ')
    : text.slice(0, 50)

  const { category_id } = detectCategory(description)

  return {
    amount,
    description: description.charAt(0).toUpperCase() + description.slice(1),
    type: isIncome ? 'income' : 'expense',
    date,
    category_id,
  }
}
