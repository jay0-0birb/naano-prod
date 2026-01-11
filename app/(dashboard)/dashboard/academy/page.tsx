import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import AcademyPageClient from './page-client';

export default async function AcademyPage() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, onboarding_completed')
    .eq('id', user.id)
    .single();

  if (!profile?.onboarding_completed) {
    redirect('/dashboard/onboarding');
  }

  return <AcademyPageClient />;
}
