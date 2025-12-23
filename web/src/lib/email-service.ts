/**
 * 邮件通知服务
 * 使用 Nodemailer 发送邮件通知
 */

import nodemailer from 'nodemailer';
import type { NotificationType } from '@/lib/prisma-types';

// ============================================
// Nodemailer 配置
// ============================================

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// ============================================
// 邮件发送
// ============================================

interface Notification {
  type: NotificationType;
  title: string;
  content: string | null;
  linkUrl: string | null;
}

/**
 * 发送通知邮件
 */
export async function sendNotificationEmail(
  to: string,
  notification: Notification
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const { subject, html } = createEmailContent(notification);

    const info = await transporter.sendMail({
      from: `"ButterNovel" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error: any) {
    console.error('Failed to send email:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * 创建邮件内容
 */
export function createEmailContent(notification: Notification): {
  subject: string;
  html: string;
} {
  const { title, content, linkUrl } = notification;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://butternovel.com';

  const subject = title;

  const html = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', sans-serif;
      background-color: #f5f5f5;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background-color: #ffffff;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 30px 20px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      color: #ffffff;
      font-size: 24px;
      font-weight: 600;
    }
    .content {
      padding: 30px 20px;
    }
    .notification-title {
      font-size: 18px;
      font-weight: 600;
      color: #1a202c;
      margin-bottom: 12px;
    }
    .notification-content {
      font-size: 14px;
      color: #4a5568;
      line-height: 1.6;
      margin-bottom: 20px;
      padding: 12px;
      background-color: #f7fafc;
      border-left: 3px solid #667eea;
      border-radius: 4px;
    }
    .button {
      display: inline-block;
      padding: 12px 24px;
      background-color: #667eea;
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 500;
      margin-top: 10px;
    }
    .button:hover {
      background-color: #5a67d8;
    }
    .footer {
      padding: 20px;
      text-align: center;
      font-size: 12px;
      color: #718096;
      background-color: #f7fafc;
      border-top: 1px solid #e2e8f0;
    }
    .footer a {
      color: #667eea;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🦋 ButterNovel</h1>
    </div>
    <div class="content">
      <div class="notification-title">${title}</div>
      ${
        content
          ? `<div class="notification-content">${content}</div>`
          : ''
      }
      ${
        linkUrl
          ? `<a href="${baseUrl}${linkUrl}" class="button">查看详情</a>`
          : ''
      }
    </div>
    <div class="footer">
      <p>这是一封自动发送的通知邮件，请勿直接回复。</p>
      <p>
        <a href="${baseUrl}/settings">管理通知偏好</a> |
        <a href="${baseUrl}">访问 ButterNovel</a>
      </p>
      <p>&copy; ${new Date().getFullYear()} ButterNovel. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `;

  return { subject, html };
}

/**
 * 判断是否应该发送邮件
 */
export function shouldSendEmail(
  type: NotificationType,
  preferences: any
): boolean {
  // 总开关
  if (!preferences.emailNotifications) {
    return false;
  }

  // 评分相关
  if (
    ['RATING_REPLY', 'RATING_LIKE', 'NOVEL_RATING'].includes(type) &&
    !preferences.emailRatingNotifications
  ) {
    return false;
  }

  // 评论相关
  if (
    ['COMMENT_REPLY', 'COMMENT_LIKE', 'NOVEL_COMMENT'].includes(type) &&
    !preferences.emailCommentNotifications
  ) {
    return false;
  }

  // 关注相关
  if (type === 'NEW_FOLLOWER' && !preferences.emailFollowNotifications) {
    return false;
  }

  // 作者动态相关
  if (
    ['AUTHOR_NEW_NOVEL', 'AUTHOR_NEW_CHAPTER', 'NOVEL_UPDATE'].includes(type) &&
    !preferences.emailAuthorNotifications
  ) {
    return false;
  }

  return true;
}
