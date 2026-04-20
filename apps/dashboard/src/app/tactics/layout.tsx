'use client'

import { Sidebar } from '@/components/Sidebar'
import { AuthProvider } from '@/components/AuthProvider'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <div className="flex h-screen bg-nora-bg overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </AuthProvider>
  )
}
