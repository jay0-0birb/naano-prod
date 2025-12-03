import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendEmail, emailTemplates } from '@/lib/email';

// Use service role to bypass RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';

// This endpoint is called by Supabase webhooks or internal triggers
export async function POST(request: Request) {
  try {
    const { type, data } = await request.json();

    // Verify the request is from our system (you can add a secret key check here)
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.NOTIFICATION_SECRET}`) {
      // In development, allow without secret
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    switch (type) {
      case 'new_application':
        await handleNewApplication(data);
        break;
      case 'new_message':
        await handleNewMessage(data);
        break;
      case 'collaboration_update':
        await handleCollaborationUpdate(data);
        break;
      default:
        return NextResponse.json({ error: 'Unknown notification type' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Notification error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

async function handleNewApplication(data: { applicationId: string }) {
  // Get application details
  const { data: application } = await supabase
    .from('applications')
    .select(`
      id,
      creator_profiles:creator_id (
        profiles:profile_id (
          id,
          full_name,
          email
        )
      ),
      saas_companies:saas_id (
        company_name,
        profiles:profile_id (
          id,
          full_name,
          email
        )
      )
    `)
    .eq('id', data.applicationId)
    .single();

  if (!application) return;

  const saasProfile = (application.saas_companies as any)?.profiles;
  const creatorProfile = (application.creator_profiles as any)?.profiles;
  const companyName = (application.saas_companies as any)?.company_name;

  if (!saasProfile?.email) return;

  // Check if SaaS wants email notifications
  const { data: prefs } = await supabase
    .from('notification_preferences')
    .select('email_new_applications')
    .eq('user_id', saasProfile.id)
    .single();

  if (prefs?.email_new_applications === false) return;

  // Send email to SaaS
  const template = emailTemplates.newApplication({
    recipientName: saasProfile.full_name || 'there',
    creatorName: creatorProfile?.full_name || 'Un créateur',
    companyName: companyName || 'votre entreprise',
    dashboardUrl: `${APP_URL}/dashboard/candidates`,
  });

  await sendEmail({
    to: saasProfile.email,
    ...template,
  });
}

async function handleNewMessage(data: { messageId: string; conversationId: string; senderId: string }) {
  // Get message and conversation details
  const { data: message } = await supabase
    .from('messages')
    .select(`
      id,
      content,
      sender_id,
      conversation_id,
      profiles:sender_id (
        id,
        full_name,
        email
      )
    `)
    .eq('id', data.messageId)
    .single();

  if (!message) return;

  // Get conversation participants
  const { data: participants } = await supabase
    .from('conversation_participants')
    .select('user_id')
    .eq('conversation_id', data.conversationId);

  if (!participants) return;

  // Get the recipient (the other participant)
  const recipientId = participants.find(p => p.user_id !== data.senderId)?.user_id;
  if (!recipientId) return;

  // Get recipient profile
  const { data: recipient } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .eq('id', recipientId)
    .single();

  if (!recipient?.email) return;

  // Check if recipient wants email notifications
  const { data: prefs } = await supabase
    .from('notification_preferences')
    .select('email_new_messages')
    .eq('user_id', recipientId)
    .single();

  if (prefs?.email_new_messages === false) return;

  const senderName = (message.profiles as any)?.full_name || 'Quelqu\'un';

  // Send email
  const template = emailTemplates.newMessage({
    recipientName: recipient.full_name || 'there',
    senderName,
    messagePreview: message.content,
    conversationUrl: `${APP_URL}/dashboard/messages?conversation=${data.conversationId}`,
  });

  await sendEmail({
    to: recipient.email,
    ...template,
  });
}

async function handleCollaborationUpdate(data: { 
  collaborationId: string; 
  updateType: 'accepted' | 'post_submitted' | 'post_validated' | 'completed';
  targetUserId?: string; // Optional: specific user to notify
}) {
  // Get collaboration details
  const { data: collaboration } = await supabase
    .from('collaborations')
    .select(`
      id,
      applications:application_id (
        creator_profiles:creator_id (
          profiles:profile_id (
            id,
            full_name,
            email
          )
        ),
        saas_companies:saas_id (
          company_name,
          profiles:profile_id (
            id,
            full_name,
            email
          )
        )
      )
    `)
    .eq('id', data.collaborationId)
    .single();

  if (!collaboration) return;

  const app = (collaboration.applications as any);
  const creatorProfile = app?.creator_profiles?.profiles;
  const saasProfile = app?.saas_companies?.profiles;
  const companyName = app?.saas_companies?.company_name;

  // Determine who to notify based on update type
  let recipientProfile: any;
  let partnerName: string;

  switch (data.updateType) {
    case 'accepted':
      // Notify creator that their application was accepted
      recipientProfile = creatorProfile;
      partnerName = companyName || 'L\'entreprise';
      break;
    case 'post_submitted':
      // Notify SaaS that creator submitted a post
      recipientProfile = saasProfile;
      partnerName = creatorProfile?.full_name || 'Le créateur';
      break;
    case 'post_validated':
      // Notify creator that their post was validated
      recipientProfile = creatorProfile;
      partnerName = companyName || 'L\'entreprise';
      break;
    case 'completed':
      // Notify both parties - for now just the one specified
      recipientProfile = data.targetUserId === creatorProfile?.id ? creatorProfile : saasProfile;
      partnerName = data.targetUserId === creatorProfile?.id 
        ? (companyName || 'L\'entreprise')
        : (creatorProfile?.full_name || 'Le créateur');
      break;
  }

  if (!recipientProfile?.email) return;

  // Check if recipient wants email notifications
  const { data: prefs } = await supabase
    .from('notification_preferences')
    .select('email_collaboration_updates')
    .eq('user_id', recipientProfile.id)
    .single();

  if (prefs?.email_collaboration_updates === false) return;

  // Send email
  const template = emailTemplates.collaborationUpdate({
    recipientName: recipientProfile.full_name || 'there',
    partnerName,
    updateType: data.updateType,
    collaborationUrl: `${APP_URL}/dashboard/collaborations/${data.collaborationId}`,
  });

  await sendEmail({
    to: recipientProfile.email,
    ...template,
  });
}

