import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Workspaces — NORA' }
export default function WorkspacesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
