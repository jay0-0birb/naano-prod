'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { updateSaasProfile } from '@/app/(dashboard)/dashboard/settings/actions';
import { Loader2, Save, X, Building2, Globe, Camera } from 'lucide-react';

interface EditSaasProfileFormProps {
  saasCompany: {
    id: string;
    company_name: string;
    description: string | null;
    website: string | null;
    industry: string | null;
    commission_rate: number | null;
    conditions: string | null;
    logo_url?: string | null;
  };
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditSaasProfileForm({ saasCompany, onClose, onSuccess }: EditSaasProfileFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const displayUrl = previewUrl ?? saasCompany.logo_url ?? null;
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
    const logoFile = (event.currentTarget.elements.namedItem('logo') as HTMLInputElement)?.files?.[0];
    if (logoFile && logoFile.size > MAX_FILE_SIZE) {
      setError('L\'image ne doit pas dépasser 2 Mo. Choisissez une image plus légère.');
      return;
    }
    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData(event.currentTarget);
      const result = await updateSaasProfile(formData);

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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white border border-gray-200 rounded-2xl p-6 max-w-2xl w-full my-8 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-medium text-[#111827]">Modifier le profil entreprise</h3>
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

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Logo upload */}
          <div>
            <label className="block text-sm font-medium text-[#374151] mb-2">
              Logo de l&apos;entreprise
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
                    alt="Logo"
                    fill
                    className="object-contain p-2"
                    sizes="80px"
                  />
                ) : (
                  <Building2 className="w-10 h-10 text-[#9CA3AF]" />
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <Camera className="w-6 h-6 text-white" />
                </div>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                name="logo"
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
                  {displayUrl ? 'Changer' : 'Ajouter un logo'}
                </button>
              </div>
            </div>
          </div>

          {/* Company Name */}
          <div>
            <label className="block text-sm font-medium text-[#374151] mb-2">
              Nom de l&apos;entreprise *
            </label>
            <div className="relative">
              <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9CA3AF]" />
              <input
                name="companyName"
                type="text"
                required
                defaultValue={saasCompany.company_name}
                placeholder="Acme Inc."
                className="w-full bg-white border border-gray-200 rounded-xl pl-12 pr-4 py-3 text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#1D4ED8] focus:ring-1 focus:ring-[#1D4ED8]/30 transition-all"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-[#374151] mb-2">
              Description *
            </label>
            <textarea
              name="description"
              required
              rows={4}
              defaultValue={saasCompany.description || ''}
              placeholder="Décrivez votre entreprise et ce que vous proposez..."
              className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#1D4ED8] focus:ring-1 focus:ring-[#1D4ED8]/30 transition-all resize-none"
            />
          </div>

          {/* Website */}
          <div>
            <label className="block text-sm font-medium text-[#374151] mb-2">
              Site web *
            </label>
            <div className="relative">
              <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9CA3AF]" />
              <input
                name="website"
                type="url"
                required
                defaultValue={saasCompany.website || ''}
                placeholder="https://votre-site.com"
                className="w-full bg-white border border-gray-200 rounded-xl pl-12 pr-4 py-3 text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#1D4ED8] focus:ring-1 focus:ring-[#1D4ED8]/30 transition-all"
              />
            </div>
          </div>

          {/* Industry & Commission Rate */}
          <div className="grid grid-cols-2 gap-4">
            {/* Industry */}
            <div>
              <label className="block text-sm font-medium text-[#374151] mb-2">
                Secteur *
              </label>
              <select
                name="industry"
                required
                defaultValue={saasCompany.industry || ''}
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-[#111827] focus:outline-none focus:border-[#1D4ED8] focus:ring-1 focus:ring-[#1D4ED8]/30 transition-all"
              >
                <option value="">Sélectionner...</option>
                <option value="SaaS">SaaS</option>
                <option value="Marketing">Marketing</option>
                <option value="Finance">Finance</option>
                <option value="E-commerce">E-commerce</option>
                <option value="Productivité">Productivité</option>
                <option value="RH">Ressources Humaines</option>
                <option value="Ventes">Ventes</option>
                <option value="Autre">Autre</option>
              </select>
            </div>

            {/* Commission Rate */}
            <div>
              <label className="block text-sm font-medium text-[#374151] mb-2">
                Taux de commission (%)
              </label>
              <div className="relative">
                <input
                  name="commissionRate"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  defaultValue={saasCompany.commission_rate || ''}
                  placeholder="15"
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 pr-12 text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#1D4ED8] focus:ring-1 focus:ring-[#1D4ED8]/30 transition-all"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#64748B]">%</span>
              </div>
            </div>
          </div>

          {/* Conditions */}
          <div>
            <label className="block text-sm font-medium text-[#374151] mb-2">
              Conditions de collaboration
            </label>
            <textarea
              name="conditions"
              rows={3}
              defaultValue={saasCompany.conditions || ''}
              placeholder="Décrivez vos attentes et conditions..."
              className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#1D4ED8] focus:ring-1 focus:ring-[#1D4ED8]/30 transition-all resize-none"
            />
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

