"use client";

import { useState } from "react";
import { updateCreatorProfile } from "@/app/(dashboard)/dashboard/settings/actions";
import { Loader2, Save, X, Linkedin } from "lucide-react";

const THEMES = [
  { value: "tech", label: "Tech" },
  { value: "business", label: "Business" },
  { value: "lifestyle", label: "Lifestyle" },
];

interface EditCreatorProfileFormProps {
  creatorProfile: {
    id: string;
    bio: string | null;
    linkedin_url: string | null;
    followers_count: number;
    theme: string | null;
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
  const [theme, setTheme] = useState<string>(creatorProfile.theme || "");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    formData.append("theme", theme);

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
      <div className="bg-white border border-gray-200 rounded-2xl p-6 max-w-2xl w-full my-8 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-medium text-[#111827]">
            Modifier le profil créateur
          </h3>
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
          {/* Bio */}
          <div>
            <label className="block text-sm font-medium text-[#374151] mb-2">
              Bio *
            </label>
            <textarea
              name="bio"
              required
              rows={4}
              defaultValue={creatorProfile.bio || ""}
              placeholder="Présentez-vous en quelques lignes..."
              className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#1D4ED8] focus:ring-1 focus:ring-[#1D4ED8]/30 transition-all resize-none"
            />
          </div>

          {/* LinkedIn URL */}
          <div>
            <label className="block text-sm font-medium text-[#374151] mb-2">
              Profil LinkedIn *
            </label>
            <div className="relative">
              <Linkedin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9CA3AF]" />
              <input
                name="linkedinUrl"
                type="url"
                required
                defaultValue={creatorProfile.linkedin_url || ""}
                placeholder="https://linkedin.com/in/votre-profil"
                className="w-full bg-white border border-gray-200 rounded-xl pl-12 pr-4 py-3 text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#1D4ED8] focus:ring-1 focus:ring-[#1D4ED8]/30 transition-all"
              />
            </div>
          </div>

          {/* Followers Count */}
          <div>
            <label className="block text-sm font-medium text-[#374151] mb-2">
              Nombre de followers *
            </label>
            <input
              name="followersCount"
              type="number"
              required
              min="0"
              defaultValue={creatorProfile.followers_count}
              className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#1D4ED8] focus:ring-1 focus:ring-[#1D4ED8]/30 transition-all"
            />
          </div>

          {/* Theme */}
          <div>
            <label className="block text-sm font-medium text-[#374151] mb-2">
              Thématique
            </label>
            <div className="flex flex-wrap gap-2">
              {THEMES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setTheme(t.value)}
                  className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                    theme === t.value
                      ? "bg-[#0F172A] text-white"
                      : "bg-gray-100 text-[#64748B] hover:bg-gray-200 hover:text-[#111827] border border-gray-200"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
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
