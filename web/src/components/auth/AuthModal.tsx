// src/components/auth/AuthModal.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { X } from 'lucide-react'
import { safeParseJson } from '@/lib/fetch-utils'
import Turnstile from './Turnstile'

type AuthModalProps = {
  isOpen: boolean
  onClose: () => void
  defaultTab?: 'login' | 'register'
}

export default function AuthModal({ isOpen, onClose, defaultTab = 'login' }: AuthModalProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'login' | 'register'>(defaultTab)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // 防止背景滚动 - Prevent background scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      // 保存原始的 overflow 值
      const originalOverflow = document.body.style.overflow
      const originalPaddingRight = document.body.style.paddingRight

      // 计算滚动条宽度，防止内容抖动
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth

      // 锁定滚动
      document.body.style.overflow = 'hidden'
      // 如果有滚动条，添加 padding 防止内容位移
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`
      }

      // 清理函数：modal 关闭时恢复滚动
      return () => {
        document.body.style.overflow = originalOverflow
        document.body.style.paddingRight = originalPaddingRight
      }
    }
  }, [isOpen])

  const [loginData, setLoginData] = useState({
    identifier: '', // Can be email or username
    password: '',
  })

  const [registerData, setRegisterData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })

  // Turnstile verification state
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
  const [turnstileError, setTurnstileError] = useState(false)

  // Check if Turnstile is enabled (site key is configured)
  const isTurnstileEnabled = !!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY

  const handleTurnstileVerify = useCallback((token: string) => {
    setTurnstileToken(token)
    setTurnstileError(false)
  }, [])

  const handleTurnstileExpire = useCallback(() => {
    setTurnstileToken(null)
  }, [])

  const handleTurnstileError = useCallback(() => {
    setTurnstileError(true)
    setTurnstileToken(null)
  }, [])

  if (!isOpen) return null

  const handleGoogleSignIn = async () => {
    setLoading(true)
    // ⭐ 使用当前完整URL作为 callbackUrl，登录后跳回当前页面
    const callbackUrl = window.location.href
    await signIn('google', { callbackUrl })
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // ✅ Use redirect: false to stay on current page
      const result = await signIn('credentials', {
        identifier: loginData.identifier,
        password: loginData.password,
        redirect: false,
      })

      if (result?.error) {
        // ✅ Parse and show user-friendly error messages
        // NextAuth returns error types like "CredentialsSignin", but we want the actual message
        let errorMessage = 'Login failed. Please check your credentials.'

        // Check URL for error parameter (NextAuth adds it to callbackUrl)
        const url = new URL(window.location.href)
        const authError = url.searchParams.get('error')

        if (authError) {
          errorMessage = decodeURIComponent(authError)
        } else if (result.error === 'CredentialsSignin') {
          errorMessage = 'Invalid email/username or password. Please try again.'
        } else if (result.error.includes('No account found')) {
          errorMessage = 'No account found with this email or username.'
        } else if (result.error.includes('Google sign-in')) {
          errorMessage = 'This account uses Google sign-in. Please use "Continue with Google".'
        } else if (result.error.includes('Incorrect password')) {
          errorMessage = 'Incorrect password. Please try again.'
        } else {
          errorMessage = result.error
        }

        setError(errorMessage)
        setLoading(false)
      } else if (result?.ok) {
        // Login successful - refresh page to update session
        router.refresh()
        onClose()
      }
    } catch (error) {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (registerData.password !== registerData.confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    if (registerData.password.length < 6) {
      setError('Password must be at least 6 characters')
      setLoading(false)
      return
    }

    // Check Turnstile verification if enabled
    if (isTurnstileEnabled && !turnstileToken) {
      setError('Please complete the verification challenge')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: registerData.name,
          email: registerData.email,
          password: registerData.password,
          turnstileToken: turnstileToken, // Include Turnstile token
        }),
      })

      const data = await safeParseJson(response)

      if (!response.ok) {
        setError(data.error || 'Registration failed')
        setLoading(false)
        return
      }

      // ✅ Wait briefly for database to commit before auto-login
      // This prevents "No account found" error when database write is still in progress
      await new Promise(resolve => setTimeout(resolve, 500))

      // ✅ 注册成功后自动登录，留在当前页面
      const result = await signIn('credentials', {
        identifier: registerData.email,
        password: registerData.password,
        redirect: false,
      })

      if (result?.error) {
        // ✅ Parse error message for better UX
        let errorMessage = 'Auto-login failed. Please try logging in manually.'

        if (result.error === 'CredentialsSignin') {
          errorMessage = 'Account created successfully! Please try logging in.'
        } else if (result.error.includes('No account found')) {
          errorMessage = 'Account created successfully! Please try logging in.'
        } else {
          errorMessage = result.error
        }

        setError(errorMessage)
        setLoading(false)
        // Switch to login tab so user can login manually
        setActiveTab('login')
      } else if (result?.ok) {
        // Registration and login successful - refresh page to update session
        router.refresh()
        onClose()
      }
    } catch (error) {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>

        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('login')}
            className={`flex-1 py-3 font-semibold transition-colors ${
              activeTab === 'login'
                ? 'text-amber-600 border-b-2 border-amber-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Log In
          </button>
          <button
            onClick={() => setActiveTab('register')}
            className={`flex-1 py-3 font-semibold transition-colors ${
              activeTab === 'register'
                ? 'text-amber-600 border-b-2 border-amber-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Sign Up
          </button>
        </div>

        <div className="p-4 sm:p-6 md:p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {activeTab === 'login' && (
            <>
              <div className="space-y-3 mb-6">
                <button
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="w-full py-3 px-4 border-2 border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </button>
                
                <p className="text-xs text-gray-500 text-center -mt-2">
                  New user? We'll create your account automatically.
                </p>
              </div>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">or continue with email</span>
                </div>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email or Username
                  </label>
                  <input
                    type="text"
                    value={loginData.identifier}
                    onChange={(e) => setLoginData({ ...loginData, identifier: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="you@example.com or username"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="••••••••"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all disabled:opacity-50"
                >
                  {loading ? 'Signing in...' : 'Sign In'}
                </button>
              </form>
            </>
          )}

          {activeTab === 'register' && (
            <>
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  💡 <strong>Tip:</strong> Use{' '}
                  <button 
                    onClick={() => setActiveTab('login')}
                    className="underline font-semibold hover:text-blue-900"
                  >
                    "Continue with Google"
                  </button>{' '}
                  in the Login tab for instant sign-up!
                </p>
              </div>

              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    value={registerData.name}
                    onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="Your name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={registerData.email}
                    onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="you@example.com"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    value={registerData.password}
                    onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="••••••••"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    value={registerData.confirmPassword}
                    onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="••••••••"
                    required
                  />
                </div>

                {/* Turnstile verification */}
                {isTurnstileEnabled && (
                  <div className="flex flex-col items-center">
                    <Turnstile
                      onVerify={handleTurnstileVerify}
                      onExpire={handleTurnstileExpire}
                      onError={handleTurnstileError}
                      theme="light"
                    />
                    {turnstileError && (
                      <p className="text-red-500 text-sm mt-2">
                        Verification failed. Please try again.
                      </p>
                    )}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || (isTurnstileEnabled && !turnstileToken)}
                  className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all disabled:opacity-50"
                >
                  {loading ? 'Creating account...' : 'Create Account'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}