import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import DashboardSidebar from '@/components/dashboard/sidebar';
import DashboardHeader from '@/components/dashboard/header';
import SessionValidator from '@/components/dashboard/session-validator';

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

  // Check if we're on the onboarding page
  // We need to allow access to onboarding even if profile is incomplete
  
  return (
    <div className="flex min-h-screen bg-[#020408] text-slate-300">
      <SessionValidator userId={user.id} />
      <DashboardSidebar 
        role={profile?.role || 'saas'} 
        onboardingCompleted={profile?.onboarding_completed || false}
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
