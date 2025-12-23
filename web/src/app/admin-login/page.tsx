import AdminLoginForm from '@/components/admin/AdminLoginForm'

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen bg-[#fafafa] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            ButterNovel
          </h1>
          <p className="text-gray-600">Admin Panel</p>
        </div>

        <AdminLoginForm />
      </div>
    </div>
  )
}