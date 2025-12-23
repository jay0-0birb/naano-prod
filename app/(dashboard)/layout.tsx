import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import DashboardSidebar from '@/components/dashboard/sidebar';
import DashboardHeader from '@/components/dashboard/header';
import SessionValidator from '@/components/dashboard/session-validator';
import CardValidator from '@/components/dashboard/card-validator';

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

  // BP1.md: Get card status for SaaS
  let cardOnFile = true; // Default to true (creators don't need card)
  if (profile?.role === 'saas') {
    const { data: saasCompany } = await supabase
      .from('saas_companies')
      .select('card_on_file')
      .eq('profile_id', user.id)
      .single();
    
    cardOnFile = saasCompany?.card_on_file || false;
  }

  // Check if we're on the onboarding page
  // We need to allow access to onboarding even if profile is incomplete
  
  return (
    <div className="flex min-h-screen bg-[#020408] text-slate-300">
      <SessionValidator userId={user.id} />
      <CardValidator 
        cardOnFile={cardOnFile}
        isSaaS={profile?.role === 'saas'}
        onboardingCompleted={profile?.onboarding_completed || false}
      />
      <DashboardSidebar 
        role={profile?.role || 'saas'} 
        onboardingCompleted={profile?.onboarding_completed || false}
        userId={user.id}
      />
      <main className="flex-1 ml-64">
        <DashboardHeader 
          userName={profile?.full_name || user.email || 'Utilisateur'}
          avatarUrl={profile?.avatar_url}
        />
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
