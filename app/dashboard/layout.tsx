import Sidebar from '@/components/Sidebar'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen bg-[#09090B]">
      <Sidebar />
      <main className="flex-1 ml-0 lg:ml-60 min-h-screen overflow-auto">
        {children}
      </main>
    </div>
  )
}
