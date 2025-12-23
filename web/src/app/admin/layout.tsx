import { redirect } from 'next/navigation'
import { getAdminSession } from '@/lib/admin-auth'
import AdminSidebar from '@/components/admin/AdminSidebar'
import AdminLayoutClient from '@/components/admin/AdminLayoutClient'
import { ReactNode } from 'react'

export default async function AdminLayout({
  children,
}: {
  children: ReactNode
}) {
  const session = await getAdminSession()

  if (!session) {
    redirect('/auth/admin-login')
  }

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <AdminSidebar adminName={session.name} adminEmail={session.email} />
      <AdminLayoutClient>
        {children}
      </AdminLayoutClient>
    </div>
  )
}