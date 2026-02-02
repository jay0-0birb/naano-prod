'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Loader2, Link as LinkIcon, Send, AlertCircle, X } from 'lucide-react';
import { submitPost } from '@/app/(dashboard)/dashboard/collaborations/[id]/actions-v2';
import LinkedInPreview from './linkedin-preview';

interface SubmitPostFormProps {
  collaborationId: string;
}

export default function SubmitPostForm({ collaborationId }: SubmitPostFormProps) {
  const t = useTranslations('collaboration');
  const tCredits = useTranslations('credits');
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);

  const isValidLinkedInUrl = (url: string) => {
    return url.includes('linkedin.com/') && (url.includes('/posts/') || url.includes('/feed/update/'));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isValidLinkedInUrl(url)) {
      setError(t('invalidUrl'));
      return;
    }

    setIsLoading(true);
    setError(null);
    setShowLimitModal(false);

    try {
    const result = await submitPost(collaborationId, url);

    if (result.error) {
        console.error('Submit error:', result.error);
      setError(result.error);
      if (result.error.toLowerCase().includes('limit') || result.error.toLowerCase().includes('limite')) {
        setShowLimitModal(true);
      }
    } else {
      setSuccess(true);
      setUrl('');
        // Reset success after 3 seconds and reload page
        setTimeout(() => {
          setSuccess(false);
          window.location.reload();
        }, 2000);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      setError(t('unexpectedError'));
    }

    setIsLoading(false);
  };

  return (
    <div className="space-y-4">
      {/* Limit modal */}
      {showLimitModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 max-w-md w-full shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[#111827]">{t('limitReached')}</h3>
              <button
                onClick={() => setShowLimitModal(false)}
                className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5 text-[#64748B]" />
              </button>
            </div>
            <p className="text-[#64748B] text-sm mb-6">
              {t('limitDesc')}
            </p>
            <button
              onClick={() => setShowLimitModal(false)}
              className="w-full py-2.5 bg-[#0F172A] hover:bg-[#1E293B] text-white rounded-xl text-sm font-medium transition-colors"
            >
              {t('gotIt')}
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {success && (
        <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm flex items-center gap-2">
          <Send className="w-4 h-4 shrink-0" />
          {t('postSubmitted')}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            {t('linkLabel')}
          </label>
          <div className="relative">
            <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder={tCredits('placeholder')}
              className="w-full bg-[#020408] border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all"
            />
          </div>
          <p className="text-xs text-slate-500 mt-1.5">
            {t('copyUrlHint')}
          </p>
        </div>

        {/* Preview */}
        {url && isValidLinkedInUrl(url) && (
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              {t('preview')}
            </label>
            <LinkedInPreview url={url} />
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading || !url}
          className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {t('sending')}
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              {t('submit')}
            </>
          )}
        </button>
      </form>
    </div>
  );
}

