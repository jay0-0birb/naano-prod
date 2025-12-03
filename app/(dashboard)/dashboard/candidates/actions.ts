'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { notifyCollaborationAccepted } from '@/lib/notifications'

export async function updateApplicationStatus(applicationId: string, status: 'accepted' | 'rejected') {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Non authentifié' }
  }

  // Get the application and verify ownership
  const { data: application } = await supabase
    .from('applications')
    .select(`
      id,
      saas_id,
      saas_companies:saas_id (
        profile_id
      )
    `)
    .eq('id', applicationId)
    .single()

  if (!application) {
    return { error: 'Candidature non trouvée' }
  }

  // Verify that the current user owns the SaaS company
  const saasCompany = application.saas_companies as any
  if (saasCompany?.profile_id !== user.id) {
    return { error: 'Non autorisé' }
  }

  // Update the application status
  const { error } = await supabase
    .from('applications')
    .update({ status })
    .eq('id', applicationId)

  if (error) {
    return { error: error.message }
  }

  // If accepted, create a collaboration
  if (status === 'accepted') {
    const { error: collabError } = await supabase
      .from('collaborations')
      .insert({
        application_id: applicationId,
        status: 'active',
      })

    if (collabError) {
      console.error('Error creating collaboration:', collabError)
    }

    // Create a conversation for the collaboration
    const { data: collaboration } = await supabase
      .from('collaborations')
      .select('id')
      .eq('application_id', applicationId)
      .single()

    if (collaboration) {
      // Get the creator's profile_id
      const { data: appWithCreator } = await supabase
        .from('applications')
        .select(`
          creator_profiles:creator_id (
            profile_id
          )
        `)
        .eq('id', applicationId)
        .single()

      const creatorProfileId = (appWithCreator?.creator_profiles as any)?.profile_id

      if (creatorProfileId) {
        // Create conversation
        const { data: conversation } = await supabase
          .from('conversations')
          .insert({
            collaboration_id: collaboration.id,
          })
          .select('id')
          .single()

        if (conversation) {
          // Add both participants
          await supabase
            .from('conversation_participants')
            .insert([
              { conversation_id: conversation.id, user_id: user.id },
              { conversation_id: conversation.id, user_id: creatorProfileId },
            ])
        }
      }

      // Notify creator that their application was accepted
      notifyCollaborationAccepted(collaboration.id).catch(console.error)
    }
  }

  revalidatePath('/dashboard/candidates')
  revalidatePath('/dashboard/applications')
  revalidatePath('/dashboard/collaborations')
  
  return { success: true }
}

