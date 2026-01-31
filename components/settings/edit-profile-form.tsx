'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { updateProfile } from '@/app/(dashboard)/dashboard/settings/actions';
import { Loader2, Save, X, Camera, User } from 'lucide-react';

interface EditProfileFormProps {
  profile: {
    id: string;
    full_name: string | null;
    email: string;
    role: string;
    avatar_url?: string | null;
  };
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditProfileForm({ profile, onClose, onSuccess }: EditProfileFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const displayUrl = previewUrl ?? profile.avatar_url ?? null;

  const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    if (file.size > MAX_FILE_SIZE) {
      setError('L\'image ne doit pas dépasser 2 Mo. Choisissez une image plus légère.');
      return;
    }
    setError(null);
    setPreviewUrl(URL.createObjectURL(file));
  };

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const avatarFile = (event.currentTarget.elements.namedItem('avatar') as HTMLInputElement)?.files?.[0];
    if (avatarFile && avatarFile.size > MAX_FILE_SIZE) {
      setError('L\'image ne doit pas dépasser 2 Mo. Choisissez une image plus légère.');
      return;
    }
    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData(event.currentTarget);
      const result = await updateProfile(formData);

    if (result?.error) {
      setError(result.error);
      return;
    }
    onSuccess();
  } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg.includes('1 MB') || msg.includes('body size')
        ? 'L\'image est trop volumineuse (max 2 Mo). Choisissez une image plus légère.'
        : 'Une erreur est survenue. Réessayez.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white border border-gray-200 rounded-2xl p-6 max-w-md w-full shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-medium text-[#111827]">Modifier le profil</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-[#64748B]" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Avatar upload */}
          <div>
            <label className="block text-sm font-medium text-[#374151] mb-2">
              Photo de profil
            </label>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="relative w-20 h-20 rounded-xl overflow-hidden bg-gray-100 border border-gray-200 flex items-center justify-center hover:border-gray-300 transition-colors group"
              >
                {displayUrl ? (
                  <Image
                    src={displayUrl}
                    alt="Avatar"
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                ) : (
                  <User className="w-10 h-10 text-[#9CA3AF]" />
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <Camera className="w-6 h-6 text-white" />
                </div>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                name="avatar"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleFileChange}
                className="hidden"
              />
              <div>
                <p className="text-sm text-[#64748B]">
                  JPG, PNG, WebP ou GIF. Max 2 Mo.
                </p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-1 text-sm text-[#1D4ED8] hover:text-[#1E40AF]"
                >
                  {displayUrl ? 'Changer' : 'Ajouter une photo'}
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#374151] mb-2">
              Nom complet
            </label>
            <input
              name="fullName"
              type="text"
              required
              defaultValue={profile.full_name || ''}
              className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#1D4ED8] focus:ring-1 focus:ring-[#1D4ED8]/30 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#374151] mb-2">
              Email
            </label>
            <input
              type="email"
              disabled
              value={profile.email}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[#64748B] cursor-not-allowed"
            />
            <p className="text-xs text-[#64748B] mt-1.5">
              L&apos;email ne peut pas être modifié
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 bg-gray-100 border border-gray-200 rounded-xl text-[#374151] hover:bg-gray-200 transition-all disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#0F172A] hover:bg-[#1E293B] rounded-xl text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Enregistrement...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Enregistrer</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

