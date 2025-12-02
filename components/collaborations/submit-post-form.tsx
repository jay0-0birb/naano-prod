'use client';

import { useState } from 'react';
import { Loader2, Link as LinkIcon, Send, AlertCircle } from 'lucide-react';
import { submitPost } from '@/app/(dashboard)/dashboard/collaborations/[id]/actions';
import LinkedInPreview from './linkedin-preview';

interface SubmitPostFormProps {
  collaborationId: string;
}

export default function SubmitPostForm({ collaborationId }: SubmitPostFormProps) {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const isValidLinkedInUrl = (url: string) => {
    return url.includes('linkedin.com/') && (url.includes('/posts/') || url.includes('/feed/update/'));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isValidLinkedInUrl(url)) {
      setError('Veuillez entrer une URL de post LinkedIn valide');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
    const result = await submitPost(collaborationId, url);

    if (result.error) {
        console.error('Submit error:', result.error);
      setError(result.error);
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
      setError('Une erreur inattendue s\'est produite. Vérifiez les permissions dans Supabase.');
    }

    setIsLoading(false);
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {success && (
        <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm flex items-center gap-2">
          <Send className="w-4 h-4 shrink-0" />
          Post soumis avec succès !
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Lien du post LinkedIn
          </label>
          <div className="relative">
            <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.linkedin.com/posts/..."
              className="w-full bg-[#020408] border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all"
            />
          </div>
          <p className="text-xs text-slate-500 mt-1.5">
            Copiez l'URL de votre post LinkedIn depuis la barre d'adresse ou via "Copier le lien"
          </p>
        </div>

        {/* Preview */}
        {url && isValidLinkedInUrl(url) && (
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Aperçu
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
              Envoi en cours...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Soumettre le post
            </>
          )}
        </button>
      </form>
    </div>
  );
}

