import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import { ReactNode } from 'react'

export default async function Layout({
  children,
}: {
  children: ReactNode
}) {
  // Check if user is authenticated
  const session = await auth()

  if (!session?.user) {
    // ✅ 跳转到首页，用户可以在那里通过AuthModal登录
    redirect('/')
  }

  return (
    <DashboardLayout
      userName={session.user.name || 'Author'}
      userEmail={session.user.email || ''}
    >
      {children}
    </DashboardLayout>
  )
}
