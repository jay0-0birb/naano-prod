"use client";

import { useState } from "react";
import { updateCreatorProfile } from "@/app/(dashboard)/dashboard/settings/actions";
import { Loader2, Save, X, Linkedin, Users as UsersIcon } from "lucide-react";

const EXPERTISE_SECTORS = [
  "Tech / SaaS",
  "Marketing Digital",
  "Finance / Fintech",
  "Entrepreneuriat",
  "Productivité",
  "Leadership",
  "Ventes / Sales",
  "Ressources Humaines",
  "Data / Analytics",
  "Design / UX",
  "IA / Innovation",
  "Autre",
];

interface EditCreatorProfileFormProps {
  creatorProfile: {
    id: string;
    bio: string | null;
    linkedin_url: string | null;
    followers_count: number;
    engagement_rate: number | null;
    expertise_sectors: string[] | null;
    hourly_rate: number | null;
  };
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditCreatorProfileForm({
  creatorProfile,
  onClose,
  onSuccess,
}: EditCreatorProfileFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSectors, setSelectedSectors] = useState<string[]>(
    creatorProfile.expertise_sectors || [],
  );

  function toggleSector(sector: string) {
    setSelectedSectors((prev) =>
      prev.includes(sector)
        ? prev.filter((s) => s !== sector)
        : [...prev, sector],
    );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    formData.append("expertiseSectors", selectedSectors.join(","));

    const result = await updateCreatorProfile(formData);

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
          <h3 className="text-xl font-medium text-white">
            Modifier le profil créateur
          </h3>
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
          {/* Bio */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Bio *
            </label>
            <textarea
              name="bio"
              required
              rows={4}
              defaultValue={creatorProfile.bio || ""}
              placeholder="Présentez-vous en quelques lignes..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all resize-none"
            />
          </div>

          {/* LinkedIn URL */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Profil LinkedIn *
            </label>
            <div className="relative">
              <Linkedin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                name="linkedinUrl"
                type="url"
                required
                defaultValue={creatorProfile.linkedin_url || ""}
                placeholder="https://linkedin.com/in/votre-profil"
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all"
              />
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 gap-4">
            {/* Followers Count */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Nombre de followers *
              </label>
              <input
                name="followersCount"
                type="number"
                required
                min="0"
                defaultValue={creatorProfile.followers_count}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all"
              />
            </div>

            {/* Engagement Rate */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Taux d'engagement (%)
              </label>
              <div className="relative">
                <input
                  name="engagementRate"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  defaultValue={creatorProfile.engagement_rate || ""}
                  placeholder="3.5"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-12 text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500">
                  %
                </span>
              </div>
            </div>
          </div>

          {/* Expertise Sectors */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Secteurs d'expertise
            </label>
            <div className="flex flex-wrap gap-2">
              {EXPERTISE_SECTORS.map((sector) => (
                <button
                  key={sector}
                  type="button"
                  onClick={() => toggleSector(sector)}
                  className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                    selectedSectors.includes(sector)
                      ? "bg-purple-600 text-white"
                      : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white border border-white/10"
                  }`}
                >
                  {sector}
                </button>
              ))}
            </div>
          </div>

          {/* Hourly Rate */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Tarif indicatif (€/post)
            </label>
            <div className="relative">
              <input
                name="hourlyRate"
                type="number"
                min="0"
                defaultValue={creatorProfile.hourly_rate || ""}
                placeholder="150"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-12 text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500">
                €
              </span>
            </div>
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
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 rounded-xl text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
