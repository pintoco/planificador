import Navigation from '@/components/Navigation'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation />
      <main className="max-w-5xl mx-auto px-4 py-6">{children}</main>
    </div>
  )
}
