// src/lib/fetch-utils.ts
// 安全的 fetch 响应处理工具

/**
 * 安全解析 JSON 响应
 * 处理非 JSON 响应（如服务器错误、代理错误等）
 */
export async function safeParseJson(response: Response): Promise<any> {
  const contentType = response.headers.get('content-type')

  if (contentType && contentType.includes('application/json')) {
    try {
      return await response.json()
    } catch (e) {
      // JSON 解析失败
      return { error: 'Invalid JSON response from server' }
    }
  }

  // 非 JSON 响应，尝试读取文本
  try {
    const text = await response.text()
    return { error: text || `Server error: ${response.status} ${response.statusText}` }
  } catch (e) {
    return { error: `Server error: ${response.status} ${response.statusText}` }
  }
}

/**
 * 安全的 fetch 封装
 * 自动处理 JSON 解析和错误
 */
export async function safeFetch(
  url: string,
  options?: RequestInit
): Promise<{ ok: boolean; status: number; data: any }> {
  try {
    const response = await fetch(url, options)
    const data = await safeParseJson(response)

    return {
      ok: response.ok,
      status: response.status,
      data
    }
  } catch (error) {
    // 网络错误或其他 fetch 错误
    return {
      ok: false,
      status: 0,
      data: { error: error instanceof Error ? error.message : 'Network error' }
    }
  }
}
