'use client'

// src/app/error.tsx
// Global Error Boundary - Catches server-side errors and displays a friendly error page

import { useEffect } from 'react'
import Link from 'next/link'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log error to console (in production, you could send this to an error tracking service)
    console.error('Application Error:', error)
  }, [error])

  // Check if this is a database connection error
  const isDatabaseError =
    error.message?.includes('database') ||
    error.message?.includes('prisma') ||
    error.message?.includes('P1001') ||
    error.message?.includes("Can't reach database")

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-sky-50 to-white p-4">
      <div className="max-w-2xl w-full bg-white rounded-3xl shadow-2xl p-8 md:p-12 border border-blue-100">
        {/* Error Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center">
            <svg
              className="w-12 h-12 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
        </div>

        {/* Error Title */}
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 text-center mb-4">
          {isDatabaseError ? 'Database Connection Error' : 'Something Went Wrong'}
        </h1>

        {/* Error Description */}
        {isDatabaseError ? (
          <div className="space-y-4 mb-8">
            <p className="text-gray-600 text-center">
              The application cannot connect to the database. This is usually caused by incorrect environment configuration.
            </p>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-3">
              <p className="text-red-800 font-semibold">Possible Causes:</p>
              <ul className="list-disc list-inside text-red-700 space-y-1 text-sm">
                <li>DATABASE_URL is not set or has incorrect format</li>
                <li>Database server is unreachable or not running</li>
                <li>Network connection issues</li>
                <li>Database credentials have expired</li>
              </ul>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
              <p className="text-blue-800 font-semibold">Steps to Fix:</p>
              <ol className="list-decimal list-inside text-blue-700 space-y-1 text-sm">
                <li>Check if <code className="bg-blue-100 px-2 py-0.5 rounded">.env</code> file exists</li>
                <li>Verify DATABASE_URL is correctly configured</li>
                <li>Restart the development server</li>
              </ol>
            </div>
          </div>
        ) : (
          <div className="space-y-4 mb-8">
            <p className="text-gray-600 text-center">
              Sorry, the server encountered an unexpected error. We have logged this issue and are working on it.
            </p>

            {process.env.NODE_ENV === 'development' && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-xs font-mono text-gray-700 break-all">
                  {error.message}
                </p>
                {error.digest && (
                  <p className="text-xs text-gray-500 mt-2">
                    Error ID: {error.digest}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-semibold rounded-lg transition-all shadow-lg hover:shadow-xl"
          >
            Try Again
          </button>

          <Link
            href="/"
            className="px-6 py-3 bg-white border-2 border-blue-200 hover:border-blue-300 text-blue-700 font-semibold rounded-lg transition-all text-center hover:bg-blue-50"
          >
            Go to Homepage
          </Link>
        </div>

        {/* Help Link */}
        <div className="mt-8 pt-6 border-t border-gray-200 text-center">
          <p className="text-sm text-gray-500">
            Still having issues?{' '}
            <a
              href="mailto:support@butternovel.com"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Contact Support
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
