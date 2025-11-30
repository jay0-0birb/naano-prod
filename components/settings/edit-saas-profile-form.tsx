'use client';

import { useState } from 'react';
import { updateSaasProfile } from '@/app/(dashboard)/dashboard/settings/actions';
import { Loader2, Save, X, Building2, Globe } from 'lucide-react';

interface EditSaasProfileFormProps {
  saasCompany: {
    id: string;
    company_name: string;
    description: string | null;
    website: string | null;
    industry: string | null;
    commission_rate: number | null;
    conditions: string | null;
  };
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditSaasProfileForm({ saasCompany, onClose, onSuccess }: EditSaasProfileFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const result = await updateSaasProfile(formData);

    if (result?.error) {
      setError(result.error);
      setIsLoading(false);
    } else {
      onSuccess();
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-[#0A0C10] border border-white/10 rounded-2xl p-6 max-w-2xl w-full my-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-medium text-white">Modifier le profil entreprise</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Company Name */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Nom de l'entreprise *
            </label>
            <div className="relative">
              <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                name="companyName"
                type="text"
                required
                defaultValue={saasCompany.company_name}
                placeholder="Acme Inc."
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Description *
            </label>
            <textarea
              name="description"
              required
              rows={4}
              defaultValue={saasCompany.description || ''}
              placeholder="Décrivez votre entreprise et ce que vous proposez..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all resize-none"
            />
          </div>

          {/* Website */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Site web *
            </label>
            <div className="relative">
              <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                name="website"
                type="url"
                required
                defaultValue={saasCompany.website || ''}
                placeholder="https://votre-site.com"
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all"
              />
            </div>
          </div>

          {/* Industry & Commission Rate */}
          <div className="grid grid-cols-2 gap-4">
            {/* Industry */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Secteur *
              </label>
              <select
                name="industry"
                required
                defaultValue={saasCompany.industry || ''}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all"
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
              <label className="block text-sm font-medium text-slate-300 mb-2">
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
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-12 text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500">%</span>
              </div>
            </div>
          </div>

          {/* Conditions */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Conditions de collaboration
            </label>
            <textarea
              name="conditions"
              rows={3}
              defaultValue={saasCompany.conditions || ''}
              placeholder="Décrivez vos attentes et conditions..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all resize-none"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-slate-300 hover:text-white hover:border-white/20 transition-all disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-xl text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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

