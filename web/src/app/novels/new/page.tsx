import NovelUploadForm from '@/components/admin/NovelUploadForm'

export default function UploadNovelPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Upload Novel</h1>
        <p className="text-gray-600">
          Fill in the novel information and upload chapters
        </p>
      </div>

      {/* Upload Form */}
      <NovelUploadForm />
    </div>
  )
}