// Email notification service using Resend
// You'll need to add RESEND_API_KEY to your .env.local

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || 'Konex <notifications@konex.app>';

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

// Email Templates
export const emailTemplates = {
  newApplication: (data: { 
    recipientName: string; 
    creatorName: string; 
    companyName: string;
    dashboardUrl: string;
  }) => ({
    subject: `🎉 Nouvelle candidature de ${data.creatorName}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0a0c10; color: #e2e8f0; padding: 40px 20px;">
          <div style="max-width: 500px; margin: 0 auto; background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(147, 51, 234, 0.1)); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 32px;">
            <h1 style="color: #fff; font-size: 24px; margin: 0 0 16px;">Nouvelle candidature !</h1>
            <p style="color: #94a3b8; margin: 0 0 24px; line-height: 1.6;">
              Bonjour ${data.recipientName},
            </p>
            <p style="color: #94a3b8; margin: 0 0 24px; line-height: 1.6;">
              <strong style="color: #3b82f6;">${data.creatorName}</strong> a postulé pour devenir ambassadeur de <strong style="color: #fff;">${data.companyName}</strong>.
            </p>
            <a href="${data.dashboardUrl}" style="display: inline-block; background: #3b82f6; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 500;">
              Voir la candidature
            </a>
            <p style="color: #64748b; font-size: 12px; margin: 32px 0 0;">
              — L'équipe Konex
            </p>
          </div>
        </body>
      </html>
    `,
  }),

  newMessage: (data: { 
    recipientName: string; 
    senderName: string; 
    messagePreview: string;
    conversationUrl: string;
  }) => ({
    subject: `💬 Nouveau message de ${data.senderName}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0a0c10; color: #e2e8f0; padding: 40px 20px;">
          <div style="max-width: 500px; margin: 0 auto; background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(147, 51, 234, 0.1)); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 32px;">
            <h1 style="color: #fff; font-size: 24px; margin: 0 0 16px;">Nouveau message</h1>
            <p style="color: #94a3b8; margin: 0 0 24px; line-height: 1.6;">
              Bonjour ${data.recipientName},
            </p>
            <p style="color: #94a3b8; margin: 0 0 16px; line-height: 1.6;">
              <strong style="color: #3b82f6;">${data.senderName}</strong> vous a envoyé un message :
            </p>
            <div style="background: rgba(255,255,255,0.05); border-radius: 8px; padding: 16px; margin: 0 0 24px;">
              <p style="color: #e2e8f0; margin: 0; font-style: italic;">
                "${data.messagePreview.length > 100 ? data.messagePreview.slice(0, 100) + '...' : data.messagePreview}"
              </p>
            </div>
            <a href="${data.conversationUrl}" style="display: inline-block; background: #3b82f6; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 500;">
              Répondre
            </a>
            <p style="color: #64748b; font-size: 12px; margin: 32px 0 0;">
              — L'équipe Konex
            </p>
          </div>
        </body>
      </html>
    `,
  }),

  collaborationUpdate: (data: { 
    recipientName: string; 
    partnerName: string;
    updateType: 'accepted' | 'post_submitted' | 'post_validated' | 'completed';
    collaborationUrl: string;
  }) => {
    const messages = {
      accepted: {
        title: '🎉 Candidature acceptée !',
        body: `Votre candidature auprès de <strong style="color: #3b82f6;">${data.partnerName}</strong> a été acceptée. Vous pouvez maintenant commencer votre collaboration !`,
      },
      post_submitted: {
        title: '📝 Nouveau post soumis',
        body: `<strong style="color: #3b82f6;">${data.partnerName}</strong> a soumis un nouveau post LinkedIn pour validation.`,
      },
      post_validated: {
        title: '✅ Post validé !',
        body: `Votre post a été validé par <strong style="color: #3b82f6;">${data.partnerName}</strong>. Continuez comme ça !`,
      },
      completed: {
        title: '🏆 Collaboration terminée',
        body: `Votre collaboration avec <strong style="color: #3b82f6;">${data.partnerName}</strong> est maintenant terminée. Merci pour votre travail !`,
      },
    };

    const { title, body } = messages[data.updateType];

    return {
      subject: title,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0a0c10; color: #e2e8f0; padding: 40px 20px;">
            <div style="max-width: 500px; margin: 0 auto; background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(147, 51, 234, 0.1)); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 32px;">
              <h1 style="color: #fff; font-size: 24px; margin: 0 0 16px;">${title}</h1>
              <p style="color: #94a3b8; margin: 0 0 24px; line-height: 1.6;">
                Bonjour ${data.recipientName},
              </p>
              <p style="color: #94a3b8; margin: 0 0 24px; line-height: 1.6;">
                ${body}
              </p>
              <a href="${data.collaborationUrl}" style="display: inline-block; background: #3b82f6; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 500;">
                Voir la collaboration
              </a>
              <p style="color: #64748b; font-size: 12px; margin: 32px 0 0;">
                — L'équipe Konex
              </p>
            </div>
          </body>
        </html>
      `,
    };
  },
};

