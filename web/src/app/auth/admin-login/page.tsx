import AdminLoginForm from '@/components/admin/AdminLoginForm'

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-900 rounded-2xl mb-4">
            <span className="text-3xl">🦋</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">ButterNovel Admin</h1>
          <p className="text-gray-600 mt-2">Sign in to manage your platform</p>
        </div>

        {/* Login Form */}
        <AdminLoginForm />
      </div>
    </div>
  )
}