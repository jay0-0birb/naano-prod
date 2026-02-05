// Email notification service using Resend
// You'll need to add RESEND_API_KEY to your .env.local

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || 'Naano <notifications@naano.xyz>';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: EmailOptions): Promise<{ success: boolean; error?: string }> {
  if (!RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not configured, skipping email');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [to],
        subject,
        html,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Failed to send email:', error);
      return { success: false, error };
    }

    return { success: true };
  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, error: String(error) };
  }
}

// Naano-style email wrapper: light gray bg, white card, brand, dark CTA
function naanoEmail(args: {
  title: string;
  greeting: string;
  bodyHtml: string;
  ctaText: string;
  ctaUrl: string;
  footer?: string;
}): string {
  const footer = args.footer ?? "This is an automated message. Please do not reply to this email.";
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${args.title} – Naano</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5; color: #18181b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f4f4f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 480px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);">
          <tr>
            <td style="padding: 40px 32px;">
              <div style="text-align: center; margin-bottom: 28px;">
                <span style="font-size: 24px; font-weight: 700; letter-spacing: -0.5px; color: #18181b;">Naano</span>
              </div>
              <h1 style="margin: 0 0 8px; font-size: 22px; font-weight: 600; color: #18181b; line-height: 1.3;">${args.title}</h1>
              <p style="margin: 0 0 24px; font-size: 15px; color: #71717a; line-height: 1.5;">${args.greeting}</p>
              <div style="margin: 0 0 24px; font-size: 15px; color: #71717a; line-height: 1.5;">${args.bodyHtml}</div>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="padding: 8px 0 28px;">
                    <a href="${args.ctaUrl}" style="display: inline-block; padding: 14px 28px; background-color: #18181b; color: #ffffff; font-size: 15px; font-weight: 600; text-decoration: none; border-radius: 8px;">${args.ctaText}</a>
                  </td>
                </tr>
              </table>
              <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 24px 0;" />
              <p style="margin: 0; font-size: 12px; color: #a1a1aa; line-height: 1.5;">${footer}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`.trim();
}

// Email Templates (Naano style)
export const emailTemplates = {
  newApplication: (data: {
    recipientName: string;
    creatorName: string;
    companyName: string;
    dashboardUrl: string;
  }) => ({
    subject: `New application from ${data.creatorName}`,
    html: naanoEmail({
      title: 'New application',
      greeting: `Hello ${data.recipientName},`,
      bodyHtml: `<p style="margin: 0 0 16px;"><strong style="color: #18181b;">${escapeHtml(data.creatorName)}</strong> has applied to collaborate with <strong style="color: #18181b;">${escapeHtml(data.companyName)}</strong>.</p><p style="margin: 0;">Review the application and accept or decline from your dashboard.</p>`,
      ctaText: 'View application',
      ctaUrl: data.dashboardUrl,
    }),
  }),

  newMessage: (data: {
    recipientName: string;
    senderName: string;
    messagePreview: string;
    conversationUrl: string;
  }) => {
    const preview = data.messagePreview.length > 120 ? data.messagePreview.slice(0, 120) + '…' : data.messagePreview;
    return {
      subject: `New message from ${data.senderName}`,
      html: naanoEmail({
        title: 'New message',
        greeting: `Hello ${data.recipientName},`,
        bodyHtml: `<p style="margin: 0 0 16px;"><strong style="color: #18181b;">${escapeHtml(data.senderName)}</strong> sent you a message:</p><div style="background: #f4f4f5; border-radius: 8px; padding: 12px 16px; margin: 0 0 16px;"><p style="margin: 0; font-size: 14px; color: #52525b; font-style: italic;">"${escapeHtml(preview)}"</p></div><p style="margin: 0;">Reply from your dashboard.</p>`,
        ctaText: 'Reply',
        ctaUrl: data.conversationUrl,
      }),
    };
  },

  collaborationUpdate: (data: {
    recipientName: string;
    partnerName: string;
    updateType: 'accepted' | 'post_submitted' | 'post_validated' | 'completed';
    collaborationUrl: string;
  }) => {
    const config = {
      accepted: { title: 'Application accepted', body: `Your application with <strong style="color: #18181b;">${escapeHtml(data.partnerName)}</strong> has been accepted. You can now start the collaboration.`, cta: 'View collaboration' },
      post_submitted: { title: 'New post submitted', body: `<strong style="color: #18181b;">${escapeHtml(data.partnerName)}</strong> has submitted a new LinkedIn post for your review.`, cta: 'View collaboration' },
      post_validated: { title: 'Post validated', body: `Your post has been validated by <strong style="color: #18181b;">${escapeHtml(data.partnerName)}</strong>.`, cta: 'View collaboration' },
      completed: { title: 'Collaboration completed', body: `Your collaboration with <strong style="color: #18181b;">${escapeHtml(data.partnerName)}</strong> is now completed. Thank you!`, cta: 'View collaboration' },
    };
    const { title, body, cta } = config[data.updateType];
    return {
      subject: title,
      html: naanoEmail({
        title,
        greeting: `Hello ${data.recipientName},`,
        bodyHtml: `<p style="margin: 0;">${body}</p>`,
        ctaText: cta,
        ctaUrl: data.collaborationUrl,
      }),
    };
  },

  collaborationStopped: (data: {
    recipientName: string;
    partnerName: string;
    collaborationUrl: string;
  }) => ({
    subject: 'Collaboration stopped',
    html: naanoEmail({
      title: 'Collaboration stopped',
      greeting: `Hello ${data.recipientName},`,
      bodyHtml: `<p style="margin: 0;">The collaboration with <strong style="color: #18181b;">${escapeHtml(data.partnerName)}</strong> has been stopped. You can view the details in your dashboard.</p>`,
      ctaText: 'View collaborations',
      ctaUrl: data.collaborationUrl,
    }),
  }),
};

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
