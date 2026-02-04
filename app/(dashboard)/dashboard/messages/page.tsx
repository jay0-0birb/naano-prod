import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { MessageSquare } from 'lucide-react';
import ConversationList from '@/components/messages/conversation-list';
import ChatView from '@/components/messages/chat-view';

interface PageProps {
  searchParams: Promise<{ conversation?: string }>;
}

export default async function MessagesPage({ searchParams }: PageProps) {
  const t = await getTranslations('messages');
  const { conversation: conversationParam } = await searchParams;
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, onboarding_completed, full_name, avatar_url')
    .eq('id', user.id)
    .single();

  if (!profile?.onboarding_completed) {
    redirect('/dashboard/onboarding');
  }

  // Get user's conversations
  const { data: participations } = await supabase
    .from('conversation_participants')
    .select('conversation_id')
    .eq('user_id', user.id);

  const conversationIds = participations?.map(p => p.conversation_id) || [];

  let conversations: any[] = [];
  
  if (conversationIds.length > 0) {
    const { data } = await supabase
      .from('conversations')
      .select(`
        id,
        created_at,
        collaborations:collaboration_id (
          id,
          applications:application_id (
            creator_profiles:creator_id (
              profiles:profile_id (
                id,
                full_name,
                avatar_url
              )
            ),
            saas_companies:saas_id (
              company_name,
              logo_url,
              profiles:profile_id (
                id,
                full_name,
                avatar_url
              )
            )
          )
        )
      `)
      .in('id', conversationIds)
      .order('created_at', { ascending: false });

    conversations = data || [];
  }

  // Get the active conversation
  const activeConversationId = conversationParam;
  const activeConversation = conversations.find(c => c.id === activeConversationId);

  // Get partner info for the active conversation
  const getPartnerInfo = (conversation: any) => {
    const app = conversation?.collaborations?.applications;
    if (!app) return { name: null, avatar: null };

    const creatorProfileId = app.creator_profiles?.profiles?.id;
    
    // If current user is the creator, show the SaaS company
    if (creatorProfileId === user.id) {
      return {
        name: app.saas_companies?.company_name || t('company'),
        avatar: app.saas_companies?.logo_url,
      };
    }
    
    // If current user is the SaaS, show the creator
    return {
      name: app.creator_profiles?.profiles?.full_name || t('creator'),
      avatar: app.creator_profiles?.profiles?.avatar_url,
    };
  };

  const partnerInfo = activeConversation ? getPartnerInfo(activeConversation) : { name: null, avatar: null };

  return (
    <div className="h-[calc(100vh-5rem)] sm:h-[calc(100vh-6rem)] md:h-[calc(100vh-8rem)] flex flex-col md:flex-row gap-4 md:gap-6 min-h-0">
      {/* Conversations List - hidden on mobile when a conversation is open */}
      <div
        className={`w-full md:w-80 shrink-0 min-h-0 flex flex-col ${
          activeConversationId ? "hidden md:flex" : "flex"
        }`}
      >
        <ConversationList
          conversations={conversations}
          activeConversationId={activeConversationId}
          currentUserId={user.id}
          currentUserRole={profile?.role as "saas" | "influencer" | undefined}
        />
      </div>

      {/* Chat View - full width on mobile when conversation selected */}
      <div className="flex-1 min-w-0 min-h-0 flex flex-col">
        {activeConversationId && activeConversation ? (
          <ChatView
            conversationId={activeConversationId}
            currentUser={{
              id: user.id,
              full_name: profile.full_name,
              avatar_url: profile.avatar_url,
            }}
            partnerName={partnerInfo.name}
            partnerAvatar={partnerInfo.avatar}
          />
        ) : (
          <div className="h-full hidden md:flex items-center justify-center bg-white border border-gray-200 rounded-2xl shadow-sm">
            <div className="text-center px-4">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <MessageSquare className="w-7 h-7 sm:w-8 sm:h-8 text-[#94A3B8]" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-[#111827] mb-2">
                {t("selectConversation")}
              </h3>
              <p className="text-[#64748B] text-sm max-w-xs mx-auto">
                {t("selectConversationDesc")}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

