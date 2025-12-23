import { jwtVerify } from 'jose'
import { cookies } from 'next/headers'

export async function getAdminSession() {
  const cookieStore = await cookies()
  const token = cookieStore.get('admin-token')

  if (!token) {
    return null
  }

  try {
    // ✅ FIX: Use the same default secret as login route
    const secret = new TextEncoder().encode(
      process.env.ADMIN_JWT_SECRET || 'butternovel-dev-secret-min-32-characters-long-DO-NOT-USE-IN-PRODUCTION'
    )

    const { payload } = await jwtVerify(token.value, secret)

    return {
      id: payload.id as string,        // ✅ FIX: Include id field
      email: payload.email as string,
      name: payload.name as string,
      role: payload.role as string,
    }
  } catch (error) {
    console.error('[Auth] JWT verification failed:', error)
    return null
  }
}