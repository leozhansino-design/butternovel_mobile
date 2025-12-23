/**
 * 手动触发首页revalidate
 * 访问: /api/revalidate-home
 */

import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    console.log('[Revalidate] Manually triggering homepage revalidation...');

    // 清除Next.js的ISR缓存
    revalidatePath('/', 'page');

    console.log('[Revalidate] ✅ Homepage revalidated successfully');

    return NextResponse.json({
      success: true,
      message: 'Homepage revalidated successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Revalidate] Failed to revalidate homepage:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
