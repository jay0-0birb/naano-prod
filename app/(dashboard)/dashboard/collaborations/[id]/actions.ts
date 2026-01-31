'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function submitPost(collaborationId: string, linkedinPostUrl: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Non authentifié' }
  }

  // Verify the user is the creator of this collaboration
  const { data: collaboration } = await supabase
    .from('collaborations')
    .select(`
      id,
      status,
      applications:application_id (
        creator_profiles:creator_id (
          profile_id
        )
      )
    `)
    .eq('id', collaborationId)
    .single()

  if (!collaboration) {
    return { error: 'Collaboration non trouvée' }
  }

  if (collaboration.status !== 'active') {
    return { error: 'Cette collaboration n\'est plus active' }
  }

  const creatorProfileId = (collaboration.applications as any)?.creator_profiles?.profile_id
  if (creatorProfileId !== user.id) {
    return { error: 'Non autorisé' }
  }

  // Validate LinkedIn URL
  if (!linkedinPostUrl.includes('linkedin.com/')) {
    return { error: 'URL LinkedIn invalide' }
  }

  // Check if this URL was already submitted
  const { data: existingProof } = await supabase
    .from('publication_proofs')
    .select('id')
    .eq('collaboration_id', collaborationId)
    .eq('linkedin_post_url', linkedinPostUrl)
    .single()

  if (existingProof) {
    return { error: 'Ce post a déjà été soumis' }
  }

  // Create the proof
  const { error } = await supabase
    .from('publication_proofs')
    .insert({
      collaboration_id: collaborationId,
      linkedin_post_url: linkedinPostUrl,
    })

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/dashboard/collaborations/${collaborationId}`)
  return { success: true }
}

/**
 * Generate or retrieve tracking link for a collaboration
 * This is called when viewing the collaboration page
 */
export async function getOrCreateTrackingLink(collaborationId: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Non authentifié' }
  }

  // Check if tracking link already exists
  const { data: existingLink } = await supabase
    .from('tracked_links')
    .select('id, hash, destination_url')
    .eq('collaboration_id', collaborationId)
    .single()

  if (existingLink) {
    // Get click count
    const { data: clicks } = await supabase
      .from('link_clicks')
      .select('id', { count: 'exact', head: true })
      .eq('tracked_link_id', existingLink.id)

    return { 
      success: true, 
      link: existingLink,
      clickCount: clicks || 0
    }
  }

  // Get collaboration details to create tracking link
  const { data: collaboration } = await supabase
    .from('collaborations')
    .select(`
      id,
      applications:application_id (
        creator_profiles:creator_id (
          profiles:profile_id (
            full_name
          )
        ),
        saas_companies:saas_id (
          company_name,
          website
        )
      )
    `)
    .eq('id', collaborationId)
    .single()

  if (!collaboration) {
    return { error: 'Collaboration non trouvée' }
  }

  const saasWebsite = (collaboration.applications as any)?.saas_companies?.website
  if (!saasWebsite) {
    return { error: 'Le SaaS n\'a pas de site web configuré' }
  }

  // Get creator and SaaS names for readable hash
  const creatorName = (collaboration.applications as any)?.creator_profiles?.profiles?.full_name || 'creator'
  const saasName = (collaboration.applications as any)?.saas_companies?.company_name || 'saas'

  // Create URL-friendly slugs
  const creatorSlug = creatorName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  const saasSlug = saasName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

  // Generate unique hash with format: creator-saas-randomhash
  let hash = ''
  let isUnique = false
  let attempts = 0
  const maxAttempts = 10

  while (!isUnique && attempts < maxAttempts) {
    // Generate 6-character random hash
    const randomPart = Math.random().toString(36).substring(2, 8).toLowerCase()
    hash = `${creatorSlug}-${saasSlug}-${randomPart}`
    
    // Check if hash already exists
    const { data: existing } = await supabase
      .from('tracked_links')
      .select('id')
      .eq('hash', hash)
      .single()

    if (!existing) {
      isUnique = true
    }
    attempts++
  }

  if (!isUnique) {
    return { error: 'Impossible de générer un lien unique' }
  }

  // Create tracking link
  const { data: newLink, error } = await supabase
    .from('tracked_links')
    .insert({
      collaboration_id: collaborationId,
      hash: hash,
      destination_url: saasWebsite,
    })
    .select('id, hash, destination_url')
    .single()

  if (error) {
    return { error: error.message }
  }

  return { 
    success: true, 
    link: newLink,
    clickCount: 0
  }
}

