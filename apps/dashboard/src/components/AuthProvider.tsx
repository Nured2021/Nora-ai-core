'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '@/lib/auth-store'
import { getMe } from '@/lib/api'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user, setAuth, logout } = useAuthStore()
  const [checking, setChecking] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('nora_token') : null
    if (!token) {
      setChecking(false)
      if (pathname !== '/login') router.push('/login')
      return
    }
    getMe()
      .then((u) => {
        setAuth(u, token)
        setChecking(false)
      })
      .catch(() => {
        logout()
        setChecking(false)
        router.push('/login')
      })
  }, [])

  if (checking) {
    return (
      <div className="flex items-center justify-center h-screen bg-nora-bg">
        <div className="text-nora-accent font-mono text-sm animate-pulse">Loading NORA...</div>
      </div>
    )
  }

  return <>{children}</>
}
