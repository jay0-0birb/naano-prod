import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { MessageSquare } from 'lucide-react';
import ConversationList from '@/components/messages/conversation-list';
import ChatView from '@/components/messages/chat-view';

interface PageProps {
  searchParams: Promise<{ conversation?: string }>;
}

export default async function MessagesPage({ searchParams }: PageProps) {
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

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-6">
      {/* Conversations List */}
      <div className="w-80 shrink-0">
        <ConversationList 
          conversations={conversations}
          activeConversationId={activeConversationId}
          currentUserId={user.id}
        />
      </div>

      {/* Chat View */}
      <div className="flex-1">
        {activeConversationId && activeConversation ? (
          <ChatView 
            conversationId={activeConversationId}
            currentUser={{
              id: user.id,
              full_name: profile.full_name,
              avatar_url: profile.avatar_url,
            }}
          />
        ) : (
          <div className="h-full flex items-center justify-center bg-[#0A0C10] border border-white/10 rounded-2xl">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-8 h-8 text-slate-500" />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">Sélectionnez une conversation</h3>
              <p className="text-slate-400 text-sm max-w-xs">
                Choisissez une conversation dans la liste pour commencer à discuter
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

