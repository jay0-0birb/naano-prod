'use client';

import { useState, useEffect, useRef } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { sendMessage, getMessages } from '@/app/(dashboard)/dashboard/messages/actions';
import { createClient } from '@/lib/supabase/client';

interface Message {
  id: string;
  content: string;
  created_at: string;
  sender_id: string;
  profiles: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  };
}

interface ChatViewProps {
  conversationId: string;
  currentUser: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  };
  partnerName?: string | null;
  partnerAvatar?: string | null;
}

export default function ChatView({ conversationId, currentUser, partnerName, partnerAvatar }: ChatViewProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadMessages();

    // Set up real-time subscription for new messages
    const supabase = createClient();
    
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          const newMsg = payload.new as any;
          
          // Don't add if it's our own message (we already added it optimistically)
          if (newMsg.sender_id === currentUser.id) return;
          
          // Fetch the sender's profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url')
            .eq('id', newMsg.sender_id)
            .single();
          
          const messageWithProfile: Message = {
            ...newMsg,
            profiles: profile || { id: newMsg.sender_id, full_name: partnerName, avatar_url: partnerAvatar }
          };
          
          setMessages((prev) => {
            // Check if message already exists
            if (prev.some(m => m.id === newMsg.id)) return prev;
            return [...prev, messageWithProfile];
          });
          
          // Mark as read since we're viewing the conversation
          markAsRead(conversationId);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, currentUser.id, partnerName, partnerAvatar]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    setIsLoading(true);
    const result = await getMessages(conversationId);
    if (!result.error) {
      setMessages(result.messages as Message[]);
    }
    setIsLoading(false);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isSending) return;

    setIsSending(true);
    const result = await sendMessage(conversationId, newMessage.trim());
    
    if (result.success && result.message) {
      setMessages(prev => [...prev, {
        ...result.message,
        profiles: {
          id: currentUser.id,
          full_name: currentUser.full_name,
          avatar_url: currentUser.avatar_url,
        }
      } as Message]);
      setNewMessage('');
    }
    
    setIsSending(false);
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Aujourd'hui";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Hier';
    }
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
    });
  };

  // Group messages by date
  const groupedMessages: { date: string; messages: Message[] }[] = [];
  let currentDate = '';
  
  messages.forEach((message) => {
    const messageDate = formatDate(message.created_at);
    if (messageDate !== currentDate) {
      currentDate = messageDate;
      groupedMessages.push({ date: messageDate, messages: [message] });
    } else {
      groupedMessages[groupedMessages.length - 1].messages.push(message);
    }
  });

  return (
    <div className="h-full flex flex-col bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-6 h-6 animate-spin text-[#94A3B8]" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-[#64748B] text-sm">
              Aucun message. Commencez la conversation !
            </p>
          </div>
        ) : (
          groupedMessages.map((group, groupIndex) => (
            <div key={groupIndex}>
              {/* Date Separator */}
              <div className="flex items-center gap-4 my-4">
                <div className="flex-1 h-px bg-gray-200"></div>
                <span className="text-xs text-[#94A3B8]">{group.date}</span>
                <div className="flex-1 h-px bg-gray-200"></div>
              </div>

              {/* Messages */}
              <div className="space-y-4">
                {group.messages.map((message) => {
                  const isOwn = message.sender_id === currentUser.id;
                  const initials = message.profiles.full_name
                    ?.split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2) || '??';

                  return (
                    <div 
                      key={message.id}
                      className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : ''}`}
                    >
                      {/* Avatar */}
                      {message.profiles.avatar_url ? (
                        <img 
                          src={message.profiles.avatar_url} 
                          alt={message.profiles.full_name || ''}
                          className="w-8 h-8 rounded-full object-cover shrink-0"
                        />
                      ) : (
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                            isOwn ? 'bg-blue-50' : 'bg-purple-50'
                          }`}
                        >
                          <span
                            className={`text-xs font-medium ${
                              isOwn ? 'text-[#1D4ED8]' : 'text-purple-600'
                            }`}
                          >
                            {initials}
                          </span>
                        </div>
                      )}

                      {/* Message Bubble */}
                      <div className={`max-w-[70%] ${isOwn ? 'items-end' : 'items-start'}`}>
                        <div className={`px-4 py-2.5 rounded-2xl ${
                          isOwn 
                            ? 'bg-[#111827] text-white rounded-tr-sm' 
                            : 'bg-gray-100 text-[#111827] rounded-tl-sm'
                        }`}>
                          <p className="text-sm">{message.content}</p>
                        </div>
                        <span className={`text-xs text-[#94A3B8] mt-1 block ${
                          isOwn ? 'text-right' : 'text-left'
                        }`}>
                          {formatTime(message.created_at)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSend} className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex gap-3">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Écrivez votre message..."
            className="flex-1 bg-white border border-gray-300 rounded-xl px-4 py-3 text-[#111827] placeholder:text-gray-400 focus:outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]/40 transition-all"
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || isSending}
            className="px-4 py-3 bg-[#111827] hover:bg-[#020617] text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

