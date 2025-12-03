'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { notifyNewMessage } from '@/lib/notifications'

export async function sendMessage(conversationId: string, content: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Non authentifié' }
  }

  // Verify user is a participant
  const { data: participant } = await supabase
    .from('conversation_participants')
    .select('user_id')
    .eq('conversation_id', conversationId)
    .eq('user_id', user.id)
    .single()

  if (!participant) {
    return { error: 'Non autorisé' }
  }

  // Send message
  const { error, data } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: user.id,
      content,
    })
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  // Trigger email notification (async, don't wait)
  notifyNewMessage(data.id, conversationId, user.id).catch(console.error)

  revalidatePath('/dashboard/messages')
  
  return { success: true, message: data }
}

export async function getMessages(conversationId: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Non authentifié', messages: [] }
  }

  // Verify user is a participant
  const { data: participant } = await supabase
    .from('conversation_participants')
    .select('user_id')
    .eq('conversation_id', conversationId)
    .eq('user_id', user.id)
    .single()

  if (!participant) {
    return { error: 'Non autorisé', messages: [] }
  }

  const { data: messages, error } = await supabase
    .from('messages')
    .select(`
      *,
      profiles:sender_id (
        id,
        full_name,
        avatar_url
      )
    `)
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })

  if (error) {
    return { error: error.message, messages: [] }
  }

  return { messages: messages || [], currentUserId: user.id }
}

export async function markAsRead(conversationId: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Non authentifié' }
  }

  try {
    // First try the database function
    const { error: rpcError } = await supabase.rpc('mark_messages_as_read', {
      p_conversation_id: conversationId,
      p_user_id: user.id
    })

    if (!rpcError) {
      revalidatePath('/dashboard/messages')
      return { success: true }
    }
    
    // Fallback: direct update if function doesn't exist
    const { error } = await supabase
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('conversation_id', conversationId)
      .neq('sender_id', user.id)
      .is('read_at', null)

    if (error) {
      // If read_at column doesn't exist, just ignore
      if (!error.message.includes('read_at')) {
        console.error('Error marking messages as read:', error)
      }
    }
  } catch (err) {
    // Silently fail if the feature isn't set up yet
    console.error('markAsRead error:', err)
  }

  revalidatePath('/dashboard/messages')
  return { success: true }
}

