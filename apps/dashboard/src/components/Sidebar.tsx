'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import clsx from 'clsx'
import {
  LayoutDashboard,
  Activity,
  Hammer,
  Brain,
  UserCheck,
  Users,
  BookMarked,
  Settings,
  LogOut,
  Zap,
} from 'lucide-react'
import { useAuthStore } from '@/lib/auth-store'
import { useRouter } from 'next/navigation'

const NAV_ITEMS = [
  { label: 'Dashboard',     href: '/dashboard',     icon: LayoutDashboard },
  { label: 'Live Jobs',     href: '/live-jobs',      icon: Activity },
  { label: 'Builder',       href: '/builder',        icon: Hammer },
  { label: 'Brain Connect', href: '/brain-connect',  icon: Brain },
  { label: 'HumanLoop',    href: '/humanloop',       icon: UserCheck },
  { label: 'Multi-User',   href: '/multi-user',      icon: Users },
  { label: 'Tactics',      href: '/tactics',         icon: BookMarked },
  { label: 'Settings',     href: '/settings',        icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuthStore()
  const router = useRouter()

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  return (
    <aside className="flex flex-col w-56 min-h-screen bg-nora-surface border-r border-nora-border shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 py-5 border-b border-nora-border">
        <div className="w-7 h-7 rounded bg-nora-accent flex items-center justify-center">
          <Zap className="w-4 h-4 text-white" />
        </div>
        <span className="text-nora-text font-bold text-lg tracking-wide">NORA</span>
        <span className="text-xs text-nora-muted ml-auto">v1.0</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 overflow-y-auto">
        <div className="space-y-0.5">
          {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link
                key={href}
                href={href}
                className={clsx(
                  'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                  active
                    ? 'bg-nora-accent text-white'
                    : 'text-nora-muted hover:text-nora-text hover:bg-nora-border'
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {label}
              </Link>
            )
          })}
        </div>
      </nav>

      {/* User info + logout */}
      {user && (
        <div className="px-4 py-4 border-t border-nora-border">
          <div className="text-xs text-nora-muted mb-1">{user.workspace}</div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-nora-text font-medium">{user.username}</div>
              <div className="text-xs text-nora-accent">{user.role}</div>
            </div>
            <button
              onClick={handleLogout}
              className="text-nora-muted hover:text-nora-error transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </aside>
  )
}
