'use client';

import { useState } from 'react';
import { Users, TrendingUp, Briefcase, Mail, CheckCircle2, Loader2 } from 'lucide-react';
import { inviteCreator } from '@/app/(dashboard)/dashboard/marketplace/actions';

interface CreatorCardProps {
  creator: {
    id: string;
    bio: string | null;
    linkedin_url: string | null;
    followers_count: number;
    engagement_rate: number | null;
    expertise_sectors: string[] | null;
    profiles: {
      id: string;
      full_name: string | null;
      avatar_url: string | null;
      email: string;
    };
  };
  hasInvited: boolean;
  saasCompanyId: string | null;
}

export default function CreatorCard({ creator, hasInvited, saasCompanyId }: CreatorCardProps) {
  const [isInviting, setIsInviting] = useState(false);
  const [invited, setInvited] = useState(hasInvited);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteMessage, setInviteMessage] = useState('');

  const handleInvite = async () => {
    if (!saasCompanyId || !inviteMessage.trim()) return;

    setIsInviting(true);
    const result = await inviteCreator(saasCompanyId, creator.id, inviteMessage);
    
    if (result.success) {
      setInvited(true);
      setShowInviteModal(false);
      setInviteMessage('');
    } else {
      alert(result.error || 'Erreur lors de l\'invitation');
    }
    setIsInviting(false);
  };

  return (
    <>
      <div className="bg-[#0A0C10] border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all">
        {/* Avatar & Name */}
        <div className="flex items-start gap-4 mb-4">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-semibold text-lg shrink-0">
            {creator.profiles.avatar_url ? (
              <img 
                src={creator.profiles.avatar_url} 
                alt={creator.profiles.full_name || 'Creator'} 
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              creator.profiles.full_name?.charAt(0).toUpperCase() || 'C'
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-white text-lg mb-1 truncate">
              {creator.profiles.full_name || 'Créateur'}
            </h3>
            <div className="flex items-center gap-2 text-slate-400 text-sm">
              <Users className="w-4 h-4" />
              <span>{creator.followers_count.toLocaleString()} abonnés</span>
            </div>
          </div>
        </div>

        {/* Bio */}
        {creator.bio && (
          <p className="text-slate-400 text-sm mb-4 line-clamp-3">
            {creator.bio}
          </p>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-white/5 rounded-lg p-3">
            <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
              <TrendingUp className="w-3 h-3" />
              <span>Engagement</span>
            </div>
            <div className="text-white font-semibold">
              {creator.engagement_rate ? `${creator.engagement_rate}%` : 'N/A'}
            </div>
          </div>
          <div className="bg-white/5 rounded-lg p-3">
            <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
              <Briefcase className="w-3 h-3" />
              <span>Secteurs</span>
            </div>
            <div className="text-white font-semibold">
              {creator.expertise_sectors?.length || 0}
            </div>
          </div>
        </div>

        {/* Sectors */}
        {creator.expertise_sectors && creator.expertise_sectors.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {creator.expertise_sectors.slice(0, 3).map((sector) => (
              <span
                key={sector}
                className="px-2 py-1 bg-blue-500/10 text-blue-400 text-xs rounded-md"
              >
                {sector}
              </span>
            ))}
            {creator.expertise_sectors.length > 3 && (
              <span className="px-2 py-1 bg-white/5 text-slate-400 text-xs rounded-md">
                +{creator.expertise_sectors.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          {creator.linkedin_url && (
            <a
              href={creator.linkedin_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-slate-300 hover:text-white hover:border-white/20 transition-all text-sm"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
              </svg>
              <span>Profil</span>
            </a>
          )}
          {invited ? (
            <button
              disabled
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-sm cursor-not-allowed"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Invité</span>
            </button>
          ) : (
            <button
              onClick={() => setShowInviteModal(true)}
              disabled={!saasCompanyId}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl text-white transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Mail className="w-4 h-4" />
              <span>Inviter</span>
            </button>
          )}
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0A0C10] border border-white/10 rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-xl font-medium text-white mb-2">
              Inviter {creator.profiles.full_name}
            </h3>
            <p className="text-slate-400 text-sm mb-6">
              Envoyez un message personnalisé pour inviter ce créateur à collaborer avec vous.
            </p>

            <div className="mb-6">
              <label className="block text-sm text-slate-300 mb-2">
                Message d'invitation
              </label>
              <textarea
                value={inviteMessage}
                onChange={(e) => setInviteMessage(e.target.value)}
                placeholder="Bonjour, nous aimerions collaborer avec vous car..."
                rows={5}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all resize-none"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowInviteModal(false);
                  setInviteMessage('');
                }}
                disabled={isInviting}
                className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-slate-300 hover:text-white hover:border-white/20 transition-all disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={handleInvite}
                disabled={isInviting || !inviteMessage.trim()}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isInviting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Envoi...</span>
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4" />
                    <span>Envoyer l'invitation</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

