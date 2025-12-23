'use client'

import { useState } from 'react'

export default function FixAuthorsPage() {
  const [diagnosisResults, setDiagnosisResults] = useState<any>(null)
  const [selectedUserId, setSelectedUserId] = useState<string>('')
  const [fixResults, setFixResults] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDiagnose = async () => {
    setLoading(true)
    setError(null)
    setDiagnosisResults(null)
    setFixResults(null)

    try {
      const res = await fetch('/api/admin/fix-authors', {
        method: 'GET'
      })

      const data = await res.json()

      if (res.ok) {
        setDiagnosisResults(data.data)
        // Auto-select suggested admin if available
        if (data.data.suggestedAdmin) {
          setSelectedUserId(data.data.suggestedAdmin.id)
        }
      } else {
        setError(data.error || 'Failed to diagnose')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to diagnose')
    } finally {
      setLoading(false)
    }
  }

  const handleFix = async () => {
    if (!selectedUserId) {
      setError('Please select a user to set as author')
      return
    }

    if (!confirm(`Are you sure you want to set all invalid novels to user ID: ${selectedUserId}?\n\nThis will update the database.`)) {
      return
    }

    setLoading(true)
    setError(null)
    setFixResults(null)

    try {
      const res = await fetch('/api/admin/fix-authors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedUserId })
      })

      const data = await res.json()

      if (res.ok) {
        setFixResults(data.data)
      } else {
        setError(data.error || 'Failed to fix')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fix')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Fix Author IDs</h1>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Problem Description</h2>
          <div className="space-y-2 text-gray-700">
            <p>Some novels have invalid <code className="bg-gray-100 px-2 py-1 rounded">authorId</code> values that don't match any existing users.</p>
            <p>This causes:</p>
            <ul className="list-disc list-inside ml-4">
              <li>404 errors when clicking author names on novel pages</li>
              <li>"User not found" errors when trying to follow authors</li>
            </ul>
          </div>
        </div>

        <div className="flex gap-4 mb-6">
          <button
            onClick={handleDiagnose}
            disabled={loading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Loading...' : '🔍 Diagnose'}
          </button>

          {diagnosisResults && diagnosisResults.invalidNovels > 0 && (
            <button
              onClick={handleFix}
              disabled={loading || !selectedUserId}
              className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Loading...' : '🔧 Fix All'}
            </button>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800 font-semibold">Error:</p>
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {diagnosisResults && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Diagnosis Results</h2>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-600 font-semibold">Total Users</p>
                <p className="text-2xl font-bold text-blue-900">{diagnosisResults.totalUsers}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-green-600 font-semibold">Total Novels</p>
                <p className="text-2xl font-bold text-green-900">{diagnosisResults.totalNovels}</p>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <p className="text-sm text-red-600 font-semibold">Invalid Novels</p>
                <p className="text-2xl font-bold text-red-900">{diagnosisResults.invalidNovels}</p>
              </div>
            </div>

            {diagnosisResults.invalidNovels > 0 && (
              <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="font-semibold text-amber-800 mb-3">Select User to Set as Author:</p>
                <div className="space-y-2">
                  {diagnosisResults.users.map((user: any) => (
                    <label key={user.id} className="flex items-start gap-3 p-3 bg-white rounded border hover:border-amber-400 cursor-pointer">
                      <input
                        type="radio"
                        name="userId"
                        value={user.id}
                        checked={selectedUserId === user.id}
                        onChange={(e) => setSelectedUserId(e.target.value)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{user.name || 'Unnamed User'}</div>
                        <div className="text-sm text-gray-600">Email: {user.email}</div>
                        <div className="text-sm text-gray-600">Writer Name: {user.writerName || 'N/A'}</div>
                        <div className="text-xs text-gray-500 font-mono">ID: {user.id}</div>
                      </div>
                      {diagnosisResults.suggestedAdmin?.id === user.id && (
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">Suggested</span>
                      )}
                    </label>
                  ))}
                </div>
              </div>
            )}

            {diagnosisResults.invalidNovelsList && diagnosisResults.invalidNovelsList.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Invalid Novels:</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Author ID</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Author Name</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {diagnosisResults.invalidNovelsList.map((novel: any) => (
                        <tr key={novel.id}>
                          <td className="px-4 py-2 text-sm text-gray-900">{novel.id}</td>
                          <td className="px-4 py-2 text-sm text-gray-900">{novel.title}</td>
                          <td className="px-4 py-2 text-sm text-red-600 font-mono">{novel.authorId}</td>
                          <td className="px-4 py-2 text-sm text-gray-900">{novel.authorName}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {fixResults && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Fix Results</h2>

            {fixResults.fix?.message && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <p className="text-green-800">{fixResults.fix.message}</p>
              </div>
            )}

            {fixResults.fix?.selectedUser && (
              <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="font-semibold text-blue-800 mb-2">Updated all novels to use:</p>
                <div className="text-sm text-blue-700">
                  <p><strong>ID:</strong> {fixResults.fix.selectedUser.id}</p>
                  <p><strong>Email:</strong> {fixResults.fix.selectedUser.email}</p>
                  <p><strong>Name:</strong> {fixResults.fix.selectedUser.name}</p>
                  <p><strong>Writer Name:</strong> {fixResults.fix.selectedUser.writerName}</p>
                </div>
              </div>
            )}

            {fixResults.fix?.updateResults && (
              <div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-sm text-green-600 font-semibold">Successfully Updated</p>
                    <p className="text-2xl font-bold text-green-900">{fixResults.fix.successCount}</p>
                  </div>
                  <div className="bg-red-50 p-4 rounded-lg">
                    <p className="text-sm text-red-600 font-semibold">Failed</p>
                    <p className="text-2xl font-bold text-red-900">{fixResults.fix.failedCount}</p>
                  </div>
                </div>

                <h3 className="font-semibold text-gray-900 mb-2">Update Details:</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Old Author ID</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">New Author ID</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {fixResults.fix.updateResults.map((result: any) => (
                        <tr key={result.id} className={result.status === 'failed' ? 'bg-red-50' : ''}>
                          <td className="px-4 py-2 text-sm text-gray-900">{result.id}</td>
                          <td className="px-4 py-2 text-sm text-gray-900">{result.title}</td>
                          <td className="px-4 py-2 text-sm">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              result.status === 'updated'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {result.status}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-600 font-mono">{result.oldAuthorId}</td>
                          <td className="px-4 py-2 text-sm text-green-600 font-mono">{result.newAuthorId || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
