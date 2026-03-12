// src/lib/constants.ts

export const CATEGORIES = [
  { id: 'cat_alimentacao', icon: '🍕', name: 'Alimentação', color: '#FF9800', type: 'expense' },
  { id: 'cat_transporte',  icon: '🚗', name: 'Transporte', color: '#2196F3', type: 'expense' },
  { id: 'cat_moradia',     icon: '🏠', name: 'Moradia', color: '#9C27B0', type: 'expense' },
  { id: 'cat_saude',       icon: '💊', name: 'Saúde', color: '#F44336', type: 'expense' },
  { id: 'cat_lazer',       icon: '🎮', name: 'Lazer', color: '#E91E63', type: 'expense' },
  { id: 'cat_educacao',    icon: '📚', name: 'Educação', color: '#3F51B5', type: 'expense' },
  { id: 'cat_assinaturas', icon: '📱', name: 'Assinaturas', color: '#00BCD4', type: 'expense' },
  { id: 'cat_salario',     icon: '💼', name: 'Salário', color: '#4CAF50', type: 'income' },
  { id: 'cat_freelance',   icon: '💻', name: 'Freelance', color: '#8BC34A', type: 'income' },
  { id: 'cat_outros_gast', icon: '📦', name: 'Outros', color: '#9E9E9E', type: 'all' },
]

export function getCategoryById(id: string) {
  return CATEGORIES.find(c => c.id === id) || CATEGORIES.find(c => c.id === 'cat_outros_gast')!
}
