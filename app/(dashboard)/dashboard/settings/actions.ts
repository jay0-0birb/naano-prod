'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateProfile(formData: FormData) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Non authentifié' }
  }

  const fullName = formData.get('fullName') as string

  const { error } = await supabase
    .from('profiles')
    .update({
      full_name: fullName,
    })
    .eq('id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard/settings')
  return { success: true }
}

export async function updateCreatorProfile(formData: FormData) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Non authentifié' }
  }

  const bio = formData.get('bio') as string
  const linkedinUrl = formData.get('linkedinUrl') as string
  const followersCount = parseInt(formData.get('followersCount') as string) || 0
  const engagementRate = parseFloat(formData.get('engagementRate') as string) || null
  const expertiseSectorsRaw = formData.get('expertiseSectors') as string
  const expertiseSectors = expertiseSectorsRaw ? expertiseSectorsRaw.split(',').map(s => s.trim()).filter(Boolean) : []
  const hourlyRate = parseInt(formData.get('hourlyRate') as string) || null

  const { error } = await supabase
    .from('creator_profiles')
    .update({
      bio,
      linkedin_url: linkedinUrl,
      followers_count: followersCount,
      engagement_rate: engagementRate,
      expertise_sectors: expertiseSectors.length > 0 ? expertiseSectors : null,
      hourly_rate: hourlyRate,
    })
    .eq('profile_id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard/settings')
  revalidatePath('/dashboard/marketplace')
  return { success: true }
}

export async function updateSaasProfile(formData: FormData) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Non authentifié' }
  }

  const companyName = formData.get('companyName') as string
  const description = formData.get('description') as string
  const website = formData.get('website') as string
  const industry = formData.get('industry') as string
  const commissionRate = parseFloat(formData.get('commissionRate') as string) || null
  const conditions = formData.get('conditions') as string

  const { error } = await supabase
    .from('saas_companies')
    .update({
      company_name: companyName,
      description,
      website,
      industry,
      commission_rate: commissionRate,
      conditions,
    })
    .eq('profile_id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard/settings')
  revalidatePath('/dashboard/marketplace')
  return { success: true }
}

