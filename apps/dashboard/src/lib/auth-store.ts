import { create } from 'zustand'

export interface User {
  id: number
  username: string
  email: string
  role: 'ADMIN' | 'DEVELOPER' | 'VIEWER'
  workspace: string
  is_active: boolean
  created_at: string
}

interface AuthState {
  user: User | null
  token: string | null
  setAuth: (user: User, token: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  setAuth: (user, token) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('nora_token', token)
    }
    set({ user, token })
  },
  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('nora_token')
    }
    set({ user: null, token: null })
  },
}))
