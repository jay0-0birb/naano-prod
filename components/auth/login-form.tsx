'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { login } from '@/app/(auth)/actions';
import { Loader2, AlertCircle } from 'lucide-react';

export default function LoginForm() {
  const t = useTranslations('auth');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    
    const formData = new FormData(event.currentTarget);
    const result = await login(formData);

    if (result?.error) {
      setError(result.error);
      setIsLoading(false);
    } else {
      // Redirection côté client après connexion réussie
      window.location.href = '/dashboard';
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error === 'Invalid login credentials' ? t('invalidCredentials') : error}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-[#475569] mb-1.5 ml-1">{t('email')}</label>
          <input 
            name="email" 
            type="email" 
            required 
            placeholder={t('emailPlaceholder')}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-[#111827] placeholder:text-gray-400 focus:outline-none focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/10 transition-all"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-[#475569] mb-1.5 ml-1">{t('password')}</label>
          <input 
            name="password" 
            type="password" 
            required 
            placeholder="••••••••"
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-[#111827] placeholder:text-gray-400 focus:outline-none focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/10 transition-all"
          />
        </div>
      </div>

      <button 
        type="submit" 
        disabled={isLoading}
        className="w-full h-11 mt-2 bg-[#0F172A] text-white rounded-xl text-sm font-medium hover:bg-[#1E293B] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            {t('signingIn')}
          </>
        ) : (
          t('signIn')
        )}
      </button>
    </form>
  );
}
