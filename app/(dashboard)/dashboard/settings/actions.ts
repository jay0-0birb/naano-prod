'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

const AVATAR_MAX_SIZE = 2 * 1024 * 1024 // 2MB
const AVATAR_ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

async function uploadAvatar(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  file: File,
  filename: string
): Promise<string | null> {
  if (file.size > AVATAR_MAX_SIZE) return null
  if (!AVATAR_ALLOWED_TYPES.includes(file.type)) return null

  const ext = file.name.split('.').pop() || 'jpg'
  const path = `${userId}/${filename}-${Date.now()}.${ext}`

  const { error } = await supabase.storage
    .from('avatars')
    .upload(path, file, { cacheControl: '3600', upsert: true })

  if (error) return null

  const { data: { publicUrl } } = supabase.storage
    .from('avatars')
    .getPublicUrl(path)

  return publicUrl
}

export async function updateProfile(formData: FormData) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Non authentifié' }
  }

  const fullName = formData.get('fullName') as string
  const avatarFile = formData.get('avatar') as File | null

  let avatarUrl: string | null | undefined = undefined
  if (avatarFile && avatarFile.size > 0) {
    const url = await uploadAvatar(supabase, user.id, avatarFile, 'avatar')
    if (url) avatarUrl = url
  }

  const updateData: Record<string, string | null> = { full_name: fullName }
  if (avatarUrl !== undefined) updateData.avatar_url = avatarUrl

  const { error } = await supabase
    .from('profiles')
    .update(updateData)
    .eq('id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard/settings')
  revalidatePath('/dashboard')
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
  const logoFile = formData.get('logo') as File | null

  let logoUrl: string | null | undefined = undefined
  if (logoFile && logoFile.size > 0) {
    const url = await uploadAvatar(supabase, user.id, logoFile, 'logo')
    if (url) logoUrl = url
  }

  const updateData: Record<string, string | number | null> = {
    company_name: companyName,
    description,
    website,
    industry,
    commission_rate: commissionRate,
    conditions,
  }
  if (logoUrl !== undefined) updateData.logo_url = logoUrl

  const { error } = await supabase
    .from('saas_companies')
    .update(updateData)
    .eq('profile_id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard/settings')
  revalidatePath('/dashboard/marketplace')
  return { success: true }
}

