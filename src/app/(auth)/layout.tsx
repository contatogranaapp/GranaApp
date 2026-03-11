// src/app/(auth)/layout.tsx
// Layout para páginas de autenticação (login, onboarding)
// Sem verificação de sessão — páginas públicas

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
