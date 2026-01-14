'use client';

import { useState } from 'react';
import { Linkedin, Users, TrendingUp, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { updateApplicationStatus } from '@/app/(dashboard)/dashboard/candidates/actions';

interface CreatorProfile {
  id: string;
  bio: string | null;
  linkedin_url: string | null;
  followers_count: number;
  engagement_rate: number | null;
  expertise_sectors: string[] | null;
  hourly_rate: number | null;
  profiles: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    email: string;
  };
}

interface Application {
  id: string;
  message: string | null;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  creator_profiles: CreatorProfile;
}

interface CandidateCardProps {
  application: Application;
  readonly?: boolean;
}

export default function CandidateCard({ application, readonly = false }: CandidateCardProps) {
  const [isLoading, setIsLoading] = useState<'accept' | 'reject' | null>(null);
  const [status, setStatus] = useState(application.status);

  const creator = application.creator_profiles;
  const profile = creator.profiles;

  const handleAction = async (action: 'accepted' | 'rejected') => {
    setIsLoading(action === 'accepted' ? 'accept' : 'reject');
    
    const result = await updateApplicationStatus(application.id, action);
    
    if (result.success) {
      setStatus(action);
    }
    
    setIsLoading(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
    });
  };

  const initials = profile.full_name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '??';

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-md transition-all">
      <div className="flex items-start gap-4">
        {/* Avatar */}
        {profile.avatar_url ? (
          <img
            src={profile.avatar_url}
            alt={profile.full_name || 'Créateur'}
            className="w-14 h-14 rounded-xl object-cover border border-gray-200"
          />
        ) : (
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 border border-gray-200 flex items-center justify-center">
            <span className="text-lg font-medium text-purple-600">
              {initials}
            </span>
          </div>
        )}

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1">
            <h3 className="font-semibold text-[#111827] text-lg truncate">
              {profile.full_name || 'Créateur'}
            </h3>
            {creator.linkedin_url && (
              <a 
                href={creator.linkedin_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#3B82F6] hover:text-[#1D4ED8] transition-colors"
              >
                <Linkedin className="w-4 h-4" />
              </a>
            )}
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5 text-[#64748B]">
              <Users className="w-4 h-4" />
              <span>{creator.followers_count.toLocaleString()} followers</span>
            </div>
            {creator.engagement_rate && (
              <div className="flex items-center gap-1.5 text-[#64748B]">
                <TrendingUp className="w-4 h-4" />
                <span>{creator.engagement_rate}% engagement</span>
              </div>
            )}
          </div>

          {/* Expertise */}
          {creator.expertise_sectors && creator.expertise_sectors.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {creator.expertise_sectors.slice(0, 3).map((sector) => (
                <span 
                  key={sector}
                  className="text-xs px-2 py-0.5 bg-gray-100 text-[#4B5563] rounded-full"
                >
                  {sector}
                </span>
              ))}
              {creator.expertise_sectors.length > 3 && (
                <span className="text-xs text-slate-500">
                  +{creator.expertise_sectors.length - 3}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Date & Status */}
        <div className="text-right shrink-0">
          <span className="text-xs text-[#9CA3AF]">
            {formatDate(application.created_at)}
          </span>
          {status !== 'pending' && (
            <div
              className={`mt-2 inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full ${
                status === 'accepted'
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-rose-50 text-rose-700'
              }`}
            >
              {status === 'accepted' ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Acceptée</span>
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4" />
                  <span>Refusée</span>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Bio */}
      {creator.bio && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-sm text-[#4B5563] line-clamp-2">{creator.bio}</p>
        </div>
      )}

      {/* Application Message */}
      {application.message && (
        <div className="mt-3 p-3 bg-purple-50 rounded-lg">
          <p className="text-xs text-[#6B7280] mb-1">
            Message de candidature :
          </p>
          <p className="text-sm text-[#111827]">{application.message}</p>
        </div>
      )}

      {/* Actions */}
      {status === 'pending' && !readonly && (
        <div className="mt-4 flex gap-3">
          <button
            onClick={() => handleAction('rejected')}
            disabled={isLoading !== null}
            className="flex-1 py-2.5 bg-white hover:bg-rose-50 text-[#111827] hover:text-rose-700 border border-gray-200 hover:border-rose-200 rounded-xl text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading === 'reject' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <XCircle className="w-4 h-4" />
                Refuser
              </>
            )}
          </button>
          <button
            onClick={() => handleAction('accepted')}
            disabled={isLoading !== null}
            className="flex-1 py-2.5 bg-[#111827] hover:bg-[#020617] text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading === 'accept' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Accepter
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

