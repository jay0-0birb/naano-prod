'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { updateSaasProfile, fetchLogoFromWebsite } from '@/app/(dashboard)/dashboard/settings/actions';
import { Loader2, Save, X, Building2, Globe, Camera, Sparkles, Trash2 } from 'lucide-react';

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
  const [fetchingLogo, setFetchingLogo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [removeLogo, setRemoveLogo] = useState(false);
  const [imageLoadError, setImageLoadError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const hasLogo = !removeLogo && (previewUrl ?? saasCompany.logo_url ?? null);
  const displayUrl = removeLogo ? null : (previewUrl ?? saasCompany.logo_url ?? null);
  const showImage = displayUrl && !imageLoadError;
  const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

  const handleFetchLogo = async () => {
    const website = (formRef.current?.elements.namedItem('website') as HTMLInputElement)?.value?.trim()
      || saasCompany.website?.trim();
    if (!website) {
      setError('Indiquez d\'abord l\'URL de votre site web.');
      return;
    }
    setFetchingLogo(true);
    setError(null);
    setRemoveLogo(false);
    const result = await fetchLogoFromWebsite(website);
    setFetchingLogo(false);
    if (result.error) {
      setError(result.error);
    } else if (result.logoUrl) {
      setPreviewUrl(result.logoUrl);
      setImageLoadError(false);
      // Don't close modal - let user see the preview
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    if (file.size > MAX_FILE_SIZE) {
      setError('L\'image ne doit pas dépasser 2 Mo. Choisissez une image plus légère.');
      return;
    }
    setError(null);
    setRemoveLogo(false);
    setImageLoadError(false);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleRemoveLogo = () => {
    setRemoveLogo(true);
    setPreviewUrl(null);
    setImageLoadError(false);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
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
      if (removeLogo) formData.set('removeLogo', 'true');
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

        <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
          {/* Logo - big and centered */}
          <div className="flex flex-col items-center">
            <label className="block text-sm font-medium text-[#374151] mb-3 w-full text-center">
              Logo de l&apos;entreprise
            </label>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="relative w-40 h-40 min-w-40 min-h-40 aspect-square rounded-full overflow-hidden bg-gray-100 border-2 border-gray-200 flex items-center justify-center hover:border-[#1D4ED8]/50 hover:bg-gray-50 transition-all group shrink-0"
            >
              {showImage ? (
                <Image
                  key={displayUrl}
                  src={displayUrl}
                  alt="Logo"
                  fill
                  className="object-cover rounded-full"
                  sizes="160px"
                  priority
                  unoptimized={displayUrl.startsWith('blob:')}
                  onError={() => setImageLoadError(true)}
                />
              ) : (
                <Building2 className="w-20 h-20 text-[#9CA3AF]" />
              )}
              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <Camera className="w-10 h-10 text-white" />
                <span className="absolute bottom-2 left-0 right-0 text-white text-xs font-medium">Cliquer pour changer</span>
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

            <div className="flex flex-wrap justify-center gap-2 mt-4">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-[#374151] text-sm font-medium transition-colors"
              >
                {hasLogo ? 'Changer' : 'Ajouter un logo'}
              </button>
              <button
                type="button"
                onClick={handleFetchLogo}
                disabled={fetchingLogo}
                className="px-4 py-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#1D4ED8] text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1.5"
              >
                {fetchingLogo ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Détection...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Importer depuis le site
                  </>
                )}
              </button>
              {hasLogo && (
                <button
                  type="button"
                  onClick={handleRemoveLogo}
                  className="px-4 py-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 text-sm font-medium transition-colors inline-flex items-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" />
                  Retirer
                </button>
              )}
            </div>
            <p className="text-xs text-[#64748B] mt-2 text-center">
              JPG, PNG, WebP ou GIF. Max 2 Mo.
            </p>
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

