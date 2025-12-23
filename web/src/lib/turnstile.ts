// src/lib/turnstile.ts
// Cloudflare Turnstile server-side verification

interface TurnstileVerifyResponse {
  success: boolean
  'error-codes'?: string[]
  challenge_ts?: string
  hostname?: string
}

/**
 * Verify a Turnstile token with Cloudflare's API
 * @param token - The token received from the frontend
 * @param remoteip - Optional: the user's IP address
 * @returns Promise<{ success: boolean; error?: string }>
 */
export async function verifyTurnstileToken(
  token: string,
  remoteip?: string
): Promise<{ success: boolean; error?: string }> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY

  // If secret key is not configured, skip verification (for development/testing)
  if (!secretKey) {
    console.warn('[Turnstile] Secret key not configured, skipping verification')
    return { success: true }
  }

  // Skip verification in test environment
  if (process.env.SKIP_TURNSTILE_IN_TEST === 'true') {
    console.log('[Turnstile] Skipping verification in test environment')
    return { success: true }
  }

  // Token is required when Turnstile is enabled
  if (!token) {
    return { success: false, error: 'Verification token is required' }
  }

  try {
    const formData = new URLSearchParams()
    formData.append('secret', secretKey)
    formData.append('response', token)
    if (remoteip) {
      formData.append('remoteip', remoteip)
    }

    const response = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      }
    )

    if (!response.ok) {
      console.error('[Turnstile] API request failed:', response.status)
      return { success: false, error: 'Verification service unavailable' }
    }

    const data: TurnstileVerifyResponse = await response.json()

    if (data.success) {
      return { success: true }
    }

    // Log error codes for debugging
    const errorCodes = data['error-codes'] || []
    console.error('[Turnstile] Verification failed:', errorCodes)

    // Map error codes to user-friendly messages
    const errorMessages: Record<string, string> = {
      'missing-input-secret': 'Server configuration error',
      'invalid-input-secret': 'Server configuration error',
      'missing-input-response': 'Verification token is missing',
      'invalid-input-response': 'Verification token is invalid or expired',
      'bad-request': 'Invalid verification request',
      'timeout-or-duplicate': 'Verification expired, please try again',
      'internal-error': 'Verification service error',
    }

    const errorMessage = errorCodes
      .map((code) => errorMessages[code] || code)
      .join(', ')

    return { success: false, error: errorMessage || 'Verification failed' }
  } catch (error) {
    console.error('[Turnstile] Verification error:', error)
    return { success: false, error: 'Verification service error' }
  }
}
