// src/app/(app)/layout.tsx
import { AuthGuard } from '@/components/layout/AuthGuard'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      {children}
    </AuthGuard>
  )
}
