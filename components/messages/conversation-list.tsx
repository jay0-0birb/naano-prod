'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Building2, Users } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface Conversation {
  id: string;
  created_at: string;
  collaborations: {
    id: string;
    applications: {
      creator_profiles: {
        profiles: {
          id: string;
          full_name: string | null;
          avatar_url: string | null;
        };
      };
      saas_companies: {
        company_name: string;
        logo_url: string | null;
        profiles: {
          id: string;
          full_name: string | null;
          avatar_url: string | null;
        };
      };
    };
  };
}

interface ConversationListProps {
  conversations: Conversation[];
  activeConversationId?: string;
  currentUserId: string;
}

const LAST_VIEWED_PREFIX = 'konex_conv_last_viewed_';

export default function ConversationList({ 
  conversations, 
  activeConversationId,
  currentUserId 
}: ConversationListProps) {
  const [unreadConversations, setUnreadConversations] = useState<Set<string>>(new Set());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const supabase = createClient();

    const checkUnreadMessages = async () => {
      const unread = new Set<string>();

      for (const conv of conversations) {
        const lastViewed = localStorage.getItem(`${LAST_VIEWED_PREFIX}${conv.id}`);
        const lastViewedDate = lastViewed ? new Date(lastViewed) : new Date(0);

        const { count } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('conversation_id', conv.id)
          .neq('sender_id', currentUserId)
          .gt('created_at', lastViewedDate.toISOString());

        if (count && count > 0) {
          unread.add(conv.id);
        }
      }

      setUnreadConversations(unread);
    };

    checkUnreadMessages();

    // Real-time subscription for new messages
    const channel = supabase
      .channel('conversation-unread')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          const newMessage = payload.new as any;
          if (newMessage.sender_id !== currentUserId && newMessage.conversation_id !== activeConversationId) {
            setUnreadConversations(prev => new Set([...prev, newMessage.conversation_id]));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [mounted, conversations, currentUserId, activeConversationId]);

  // Mark conversation as read when it becomes active
  useEffect(() => {
    if (!mounted || !activeConversationId) return;

    localStorage.setItem(`${LAST_VIEWED_PREFIX}${activeConversationId}`, new Date().toISOString());
    setUnreadConversations(prev => {
      const next = new Set(prev);
      next.delete(activeConversationId);
      return next;
    });
  }, [activeConversationId, mounted]);

  const getPartner = (conversation: Conversation) => {
    const app = conversation.collaborations?.applications;
    if (!app) return null;

    const creatorProfileId = app.creator_profiles?.profiles?.id;

    // If current user is the creator, show the SaaS company
    if (creatorProfileId === currentUserId) {
      return {
        name: app.saas_companies?.company_name || 'Entreprise',
        avatar: app.saas_companies?.logo_url,
        type: 'saas' as const,
      };
    }
    
    // If current user is the SaaS, show the creator
    return {
      name: app.creator_profiles?.profiles?.full_name || 'Créateur',
      avatar: app.creator_profiles?.profiles?.avatar_url,
      type: 'creator' as const,
    };
  };

  return (
    <div className="h-full bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
      <div className="p-4 border-b border-gray-200">
        <h3 className="font-semibold text-[#111827] text-sm">Conversations</h3>
      </div>

      <div className="overflow-y-auto h-[calc(100%-60px)]">
        {conversations.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {conversations.map((conversation) => {
              const partner = getPartner(conversation);
              const isActive = conversation.id === activeConversationId;
              const hasUnread = mounted && unreadConversations.has(conversation.id);

              return (
                <Link
                  key={conversation.id}
                  href={`/dashboard/messages?conversation=${conversation.id}`}
                  className={`flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors ${
                    isActive ? 'bg-gray-50' : ''
                  }`}
                >
                  {/* Avatar */}
                  {partner?.avatar ? (
                    <img 
                      src={partner.avatar} 
                      alt={partner.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      partner?.type === 'saas' 
                        ? 'bg-blue-50 border border-blue-200' 
                        : 'bg-purple-50 border border-purple-200'
                    }`}>
                      {partner?.type === 'saas' ? (
                        <Building2 className="w-5 h-5 text-[#3B82F6]" />
                      ) : (
                        <Users className="w-5 h-5 text-purple-500" />
                      )}
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <h4 className={`text-sm truncate ${
                      hasUnread
                        ? 'font-semibold text-[#111827]'
                        : 'font-medium text-[#111827]'
                    }`}>
                      {partner?.name}
                    </h4>
                    <p
                      className={`text-xs truncate ${
                        hasUnread ? 'text-[#3B82F6]' : 'text-[#64748B]'
                      }`}
                    >
                      {hasUnread ? 'Nouveau message' : 'Collaboration active'}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full p-4">
            <p className="text-sm text-[#64748B] text-center">
              Aucune conversation.<br />
              Les conversations sont créées automatiquement lors de l'acceptation d'une candidature.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

