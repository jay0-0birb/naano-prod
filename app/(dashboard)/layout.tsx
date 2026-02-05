import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import DashboardShell from '@/components/dashboard/dashboard-shell';
import SessionValidator from '@/components/dashboard/session-validator';
import CardValidator from '@/components/dashboard/card-validator';
import OnboardingGuard from '@/components/dashboard/onboarding-guard';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/login');
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // Get card status for SaaS
  let cardOnFile = true; // Default to true (creators don't need card)
  if (profile?.role === 'saas') {
    const { data: saasCompany } = await supabase
      .from('saas_companies')
      .select('card_on_file')
      .eq('profile_id', user.id)
      .single();
    
    cardOnFile = saasCompany?.card_on_file || false;
  }

  return (
    <div className="flex min-h-screen bg-gray-50 text-[#111827] dashboard-layout" style={{ fontFamily: 'Satoshi, sans-serif' }}>
      <SessionValidator userId={user.id} />
      <CardValidator 
        cardOnFile={cardOnFile}
        isSaaS={profile?.role === 'saas'}
        onboardingCompleted={profile?.onboarding_completed || false}
      />
      <DashboardShell
        role={profile?.role || 'saas'}
        onboardingCompleted={profile?.onboarding_completed || false}
        userId={user.id}
        userName={profile?.full_name || user.email || 'User'}
        avatarUrl={profile?.avatar_url}
      >
        <OnboardingGuard onboardingCompleted={profile?.onboarding_completed ?? false}>
          {children}
        </OnboardingGuard>
      </DashboardShell>
    </div>
  );
}
