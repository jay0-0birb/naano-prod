// Helper functions to trigger email notifications

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002';

async function triggerNotification(type: string, data: any) {
  try {
    await fetch(`${APP_URL}/api/notifications/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.NOTIFICATION_SECRET || 'dev-secret'}`,
      },
      body: JSON.stringify({ type, data }),
    });
  } catch (error) {
    console.error('Failed to trigger notification:', error);
  }
}

export async function notifyNewApplication(applicationId: string) {
  await triggerNotification('new_application', { applicationId });
}

export async function notifyNewMessage(messageId: string, conversationId: string, senderId: string) {
  await triggerNotification('new_message', { messageId, conversationId, senderId });
}

export async function notifyCollaborationAccepted(collaborationId: string) {
  await triggerNotification('collaboration_update', { 
    collaborationId, 
    updateType: 'accepted' 
  });
}

export async function notifyPostSubmitted(collaborationId: string) {
  await triggerNotification('collaboration_update', { 
    collaborationId, 
    updateType: 'post_submitted' 
  });
}

export async function notifyPostValidated(collaborationId: string) {
  await triggerNotification('collaboration_update', { 
    collaborationId, 
    updateType: 'post_validated' 
  });
}

export async function notifyCollaborationCompleted(collaborationId: string, targetUserId: string) {
  await triggerNotification('collaboration_update', { 
    collaborationId, 
    updateType: 'completed',
    targetUserId 
  });
}

export async function notifyCollaborationStopped(collaborationId: string, stoppedByUserId: string) {
  await triggerNotification('collaboration_stopped', { collaborationId, stoppedByUserId });
}

