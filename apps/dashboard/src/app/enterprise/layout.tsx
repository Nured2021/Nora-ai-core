import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Enterprise — NORA' }
export default function EnterpriseLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
