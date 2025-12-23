import { redirect } from 'next/navigation'
import { getAdminSession } from '@/lib/admin-auth'
import AdminProfileForm from '@/components/admin/AdminProfileForm'

export default async function AdminProfilePage() {
  const session = await getAdminSession()

  if (!session) {
    redirect('/auth/admin-login')
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-4xl font-bold mb-8 text-gray-900">Admin Profile</h1>
      
      <AdminProfileForm adminEmail={session.email} />
    </div>
  )
}