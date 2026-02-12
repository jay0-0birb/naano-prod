"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { updateCreatorProfile } from "@/app/(dashboard)/dashboard/settings/actions";
import { Loader2, Save, X, Linkedin } from "lucide-react";
import { COUNTRIES } from "@/lib/countries";

const INDUSTRIES = [
  "SaaS / Software",
  "Fintech",
  "E-commerce",
  "Marketing",
  "Sales",
  "Growth",
  "GTM",
  "Human Resources",
  "Productivity",
  "Cybersecurity",
  "AI / Machine Learning",
  "EdTech",
  "HealthTech",
  "Other",
];

interface EditCreatorProfileFormProps {
  creatorProfile: {
    id: string;
    bio: string | null;
    linkedin_url: string | null;
    followers_count: number;
    theme: string | null;
    country: string | null;
    expertise_sectors?: string[] | null;
  };
  stripeConnected?: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditCreatorProfileForm({
  creatorProfile,
  stripeConnected = false,
  onClose,
  onSuccess,
}: EditCreatorProfileFormProps) {
  const t = useTranslations("forms");
  const tSettings = useTranslations("settings");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedThemes, setSelectedThemes] = useState<string[]>(
    (creatorProfile.expertise_sectors &&
      creatorProfile.expertise_sectors.length > 0 &&
      creatorProfile.expertise_sectors) ||
      (creatorProfile.theme ? [creatorProfile.theme] : []),
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(event.currentTarget);

    const primaryTheme = selectedThemes[0] || "";
    formData.append("theme", primaryTheme);
    selectedThemes.forEach((value) => {
      formData.append("themes", value);
    });

    const result = await updateCreatorProfile(formData);

    if (result?.error) {
      setError(result.error);
      setIsLoading(false);
    } else {
      onSuccess();
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex flex-col items-center justify-center z-50 overflow-y-auto py-6 px-4">
      <div className="bg-white border border-gray-200 rounded-2xl max-w-2xl w-full shadow-xl flex flex-col max-h-[calc(100vh-3rem)] my-auto">
        {/* Header aligned like SaaS modal */}
        <div className="relative flex items-center justify-center p-4 sm:p-5 pb-0 shrink-0">
          <h3 className="text-xl font-medium text-[#111827] text-center">
            {t("editCreatorProfile")}
          </h3>
          <button
            onClick={onClose}
            className="absolute right-4 top-4 w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-[#64748B]" />
          </button>
        </div>

        {error && (
          <div className="mx-4 sm:mx-5 mt-3 p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm text-center shrink-0">
            {error}
          </div>
        )}

        {/* Scrollable content and footer aligned with SaaS layout */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 min-h-0 overflow-y-auto pt-4 pb-6">
            <div className="max-w-lg mx-auto w-full px-4 sm:px-6 space-y-5">
              {/* Bio */}
              <div>
                <label className="block text-sm font-medium text-[#374151] mb-2">
                  {tSettings("bio")} *
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
                  {t("linkedInProfile")} *
                </label>
                <div className="relative">
                  <Linkedin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9CA3AF]" />
                  <input
                    name="linkedinUrl"
                    type="text"
                    required
                    inputMode="url"
                    autoComplete="url"
                    defaultValue={creatorProfile.linkedin_url || ""}
                    placeholder={t("linkedInPlaceholder")}
                    className="w-full bg-white border border-gray-200 rounded-xl pl-12 pr-4 py-3 text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#1D4ED8] focus:ring-1 focus:ring-[#1D4ED8]/30 transition-all"
                  />
                </div>
              </div>

              {/* Followers Count */}
              <div>
                <label className="block text-sm font-medium text-[#374151] mb-2">
                  {t("followersCount")} *
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

              {/* Country */}
              <div>
                <label className="block text-sm font-medium text-[#374151] mb-2">
                  {tSettings("country")} *
                </label>
                <select
                  name="country"
                  required
                  defaultValue={creatorProfile.country || ""}
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#1D4ED8] focus:ring-1 focus:ring-[#1D4ED8]/30 transition-all"
                >
                  <option value="">{t("selectCountry")}</option>
                  {COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.name}
                    </option>
                  ))}
                </select>
                {stripeConnected && (
                  <p className="mt-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                    {tSettings("countryStripeConnectedNotice")}
                  </p>
                )}
              </div>

              {/* Industries (up to 3) */}
              <div>
                <label className="block text-sm font-medium text-[#374151] mb-2">
                  {tSettings("industry")}
                </label>
                <p className="text-xs text-[#6B7280] mb-2">
                  Select up to 3 industries that describe your audience.
                </p>
                <div className="flex flex-wrap gap-2">
                  {INDUSTRIES.map((industry) => {
                    const isSelected = selectedThemes.includes(industry);
                    const disabled =
                      !isSelected && selectedThemes.length >= 3;
                    return (
                      <button
                        key={industry}
                        type="button"
                        onClick={() => {
                          setSelectedThemes((prev) => {
                            const already = prev.includes(industry);
                            if (already) {
                              return prev.filter((t) => t !== industry);
                            }
                            if (prev.length >= 3) return prev;
                            return [...prev, industry];
                          });
                        }}
                        disabled={disabled}
                        className={`px-3 py-1 rounded-full border text-xs transition-all ${
                          isSelected
                            ? "bg-blue-600 border-blue-600 text-white"
                            : "bg-white border-gray-200 text-[#111827] hover:border-blue-400"
                        } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
                      >
                        {industry}
                      </button>
                    );
                  })}
                </div>
                {/* Hidden inputs for server */}
                {selectedThemes.map((value) => (
                  <input
                    key={value}
                    type="hidden"
                    name="themes"
                    value={value}
                  />
                ))}
                <input
                  type="hidden"
                  name="theme"
                  value={selectedThemes[0] || ""}
                />
              </div>
            </div>
          </div>

          {/* Footer aligned like SaaS modal */}
          <div className="border-t border-gray-100 shrink-0 px-4 sm:px-6 py-4">
            <div className="max-w-lg mx-auto w-full flex gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="flex-1 px-4 py-2.5 bg-gray-100 border border-gray-200 rounded-xl text-[#374151] hover:bg-gray-200 transition-all disabled:opacity-50"
              >
                {t("cancel")}
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#0F172A] hover:bg-[#1E293B] rounded-xl text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{t("saving")}</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>{t("save")}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
