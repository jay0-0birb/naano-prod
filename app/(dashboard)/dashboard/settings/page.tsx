import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import SettingsClient from '@/components/settings/settings-client';
import { verifyStripeConnectStatus } from '@/lib/stripe-status';

interface PageProps {
  searchParams: Promise<{ stripe?: string; stripe_success?: string; stripe_error?: string; password_updated?: string }>;
}

export default async function SettingsPage({ searchParams }: PageProps) {
  const { stripe: stripeStatus, stripe_success, stripe_error, password_updated } = await searchParams;
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  const isCreator = profile?.role === 'influencer';

  // Get creator profile or saas company
  // Note: Verification happens client-side to avoid revalidatePath during render
  let stripeConnected = false;
  let creatorProfile = null;
  let saasCompany = null;

  if (isCreator) {
    const { data } = await supabase
      .from('creator_profiles')
      .select('*')
      .eq('profile_id', user.id)
      .single();
    
    creatorProfile = data;
    stripeConnected = data?.stripe_onboarding_completed || false;
  } else {
    const { data } = await supabase
      .from('saas_companies')
      .select('*')
      .eq('profile_id', user.id)
      .single();
    
    saasCompany = data;
  }

  // Get notification preferences
  const { data: notificationPrefs } = await supabase
    .from('notification_preferences')
    .select('email_new_applications, email_new_messages, email_collaboration_updates, email_collaboration_stopped')
    .eq('user_id', user.id)
    .single();

  // Determine which stripe status to show
  const finalStripeStatus = stripeStatus || (stripe_success ? 'success' : undefined);
  const stripeError = stripe_error;

  return (
    <SettingsClient 
      profile={profile}
      creatorProfile={creatorProfile}
      saasCompany={saasCompany}
      stripeConnected={stripeConnected}
      stripeStatus={finalStripeStatus}
      stripeError={stripeError}
      passwordUpdated={password_updated === "1"}
      initialNotificationPrefs={notificationPrefs || undefined}
    />
  );
}

