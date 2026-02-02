"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { completeCreatorOnboarding } from "@/app/(dashboard)/actions";
import { Loader2, AlertCircle, Linkedin, Users, FileText, Calendar } from "lucide-react";
import { useRouter } from "next/navigation";

const CALENDLY_EXPERT_URL =
  process.env.NEXT_PUBLIC_CALENDLY_EXPERT_CALL_URL ||
  "https://calendly.com/naano-expert/10min";
const MICROENTREPRISE_PDF_URL =
  process.env.NEXT_PUBLIC_MICROENTREPRISE_PDF_URL ||
  "/creer-micro-entreprise-15min.pdf";

export default function CreatorOnboardingForm() {
  const t = useTranslations("onboarding");
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const THEMES = [
    { value: "tech", label: t("themeTech") },
    { value: "business", label: t("themeBusiness") },
    { value: "lifestyle", label: t("themeLifestyle") },
  ];
  const [error, setError] = useState<string | null>(null);
  const [legalStatus, setLegalStatus] = useState<"particulier" | "professionnel">("particulier");
  const [theme, setTheme] = useState<string>("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    formData.append("legalStatus", legalStatus);
    formData.append("theme", theme);

    const result = await completeCreatorOnboarding(formData);

    if (result?.error) {
      setError(result.error);
      setIsLoading(false);
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          {error}
        </div>
      )}

      {/* Step 2: Profil & Identification */}
      <div className="space-y-5">
        <h3 className="text-sm font-semibold text-[#0F172A]">
          {t("personalInfo")}
        </h3>
        <p className="text-xs text-[#64748B]">
          {t("contractData")}
        </p>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#475569] mb-2">
              {t("firstName")}
            </label>
            <input
              name="firstName"
              required
              placeholder={t("firstNamePlaceholder")}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[#111827] placeholder:text-gray-400 focus:outline-none focus:border-[#8B5CF6] focus:ring-2 focus:ring-[#8B5CF6]/10 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#475569] mb-2">
              {t("lastName")}
            </label>
            <input
              name="lastName"
              required
              placeholder={t("lastNamePlaceholder")}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[#111827] placeholder:text-gray-400 focus:outline-none focus:border-[#8B5CF6] focus:ring-2 focus:ring-[#8B5CF6]/10 transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#475569] mb-2">
            {t("dateOfBirth")}
          </label>
          <input
            name="dateOfBirth"
            type="date"
            required
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[#111827] focus:outline-none focus:border-[#8B5CF6] focus:ring-2 focus:ring-[#8B5CF6]/10 transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#475569] mb-2">
            {t("fullAddress")}
          </label>
          <input
            name="streetAddress"
            required
            placeholder={t("addressPlaceholder")}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[#111827] placeholder:text-gray-400 focus:outline-none focus:border-[#8B5CF6] focus:ring-2 focus:ring-[#8B5CF6]/10 transition-all mb-3"
          />
          <div className="grid grid-cols-3 gap-3">
            <input
              name="postalCode"
              required
              placeholder={t("postalCode")}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[#111827] placeholder:text-gray-400 focus:outline-none focus:border-[#8B5CF6] focus:ring-2 focus:ring-[#8B5CF6]/10 transition-all"
            />
            <input
              name="city"
              required
              placeholder={t("city")}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[#111827] placeholder:text-gray-400 focus:outline-none focus:border-[#8B5CF6] focus:ring-2 focus:ring-[#8B5CF6]/10 transition-all"
            />
            <input
              name="country"
              required
              placeholder={t("country")}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[#111827] placeholder:text-gray-400 focus:outline-none focus:border-[#8B5CF6] focus:ring-2 focus:ring-[#8B5CF6]/10 transition-all"
            />
          </div>
        </div>

        <h3 className="text-sm font-semibold text-[#0F172A] pt-4">
          {t("socialInfo")}
        </h3>

        <div>
          <label className="block text-sm font-medium text-[#475569] mb-2">
            {t("linkedin")}
          </label>
          <div className="relative">
            <Linkedin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#64748B]" />
            <input
              name="linkedinUrl"
              type="url"
              required
              placeholder={t("linkedinPlaceholder")}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-12 pr-4 py-3 text-[#111827] placeholder:text-gray-400 focus:outline-none focus:border-[#8B5CF6] focus:ring-2 focus:ring-[#8B5CF6]/10 transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#475569] mb-2">
            {t("theme")}
          </label>
          <div className="flex flex-wrap gap-2">
            {THEMES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setTheme(t.value)}
                className={`px-4 py-2 rounded-full text-sm transition-all border ${
                  theme === t.value
                    ? "bg-[#0F172A] text-white border-[#0F172A]"
                    : "bg-gray-50 border-gray-200 text-[#64748B] hover:bg-gray-100"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <input type="hidden" name="theme" value={theme} />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#475569] mb-2">
            {t("bio")}
          </label>
          <textarea
            name="bio"
            rows={3}
            placeholder={t("bioPlaceholder")}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[#111827] placeholder:text-gray-400 focus:outline-none focus:border-[#8B5CF6] focus:ring-2 focus:ring-[#8B5CF6]/10 transition-all resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#475569] mb-2">
            {t("recentPosts")}
          </label>
          <input
            name="recentPostsLinkedin"
            type="url"
            placeholder={t("recentPostsPlaceholder")}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[#111827] placeholder:text-gray-400 focus:outline-none focus:border-[#8B5CF6] focus:ring-2 focus:ring-[#8B5CF6]/10 transition-all"
          />
        </div>

        {/* Choix du Statut */}
        <h3 className="text-sm font-semibold text-[#0F172A] pt-4">
          {t("legalStatus")}
        </h3>
        <div className="space-y-3">
          <label className="flex items-start gap-3 p-4 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors">
            <input
              type="radio"
              name="legalStatus"
              value="particulier"
              checked={legalStatus === "particulier"}
              onChange={() => setLegalStatus("particulier")}
              className="mt-1"
            />
            <div>
              <span className="font-medium text-[#111827]">
                {t("particulier")}
              </span>
              <p className="text-xs text-[#64748B] mt-0.5">
                {t("particulierDesc")}
              </p>
            </div>
          </label>
          <label className="flex items-start gap-3 p-4 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors">
            <input
              type="radio"
              name="legalStatus"
              value="professionnel"
              checked={legalStatus === "professionnel"}
              onChange={() => setLegalStatus("professionnel")}
              className="mt-1"
            />
            <div>
              <span className="font-medium text-[#111827]">
                {t("professionnel")}
              </span>
              <p className="text-xs text-[#64748B] mt-0.5">
                {t("professionnelDesc")}
              </p>
            </div>
          </label>
        </div>

        {legalStatus === "professionnel" && (
          <div>
            <label className="block text-sm font-medium text-[#475569] mb-2">
              {t("siretNumber")}
            </label>
            <input
              name="siretNumber"
              required
              placeholder={t("siretPlaceholder")}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[#111827] placeholder:text-gray-400 focus:outline-none focus:border-[#8B5CF6] focus:ring-2 focus:ring-[#8B5CF6]/10 transition-all"
            />
          </div>
        )}

        {/* Step 3: Bridge for Particulier */}
        {legalStatus === "particulier" && (
          <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
            <p className="text-sm font-medium text-blue-900 mb-2">
              💡 {t("microEntrepriseTip")}
            </p>
            <p className="text-sm text-blue-800 mb-4">
              {t("microEntrepriseDesc")}
            </p>
            <div className="space-y-2">
              <a
                href={MICROENTREPRISE_PDF_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-blue-700 hover:text-blue-900"
              >
                <FileText className="w-4 h-4" />
                {t("downloadGuide")}
              </a>
              <a
                href={CALENDLY_EXPERT_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-blue-700 hover:text-blue-900"
              >
                <Calendar className="w-4 h-4" />
                {t("needHelp")}
              </a>
            </div>
          </div>
        )}

        {/* Step 4: Mandate signature */}
        <h3 className="text-sm font-semibold text-[#0F172A] pt-4">
          {t("mandateSignature")}
        </h3>
        <div className="space-y-3">
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              name="mandateAccepted"
              required
              className="mt-1 rounded border-gray-300"
            />
            <span className="text-sm text-[#475569]">
              {t("acceptMandate")}
            </span>
          </label>
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              name="accuracyCertified"
              required
              className="mt-1 rounded border-gray-300"
            />
            <span className="text-sm text-[#475569]">
              {t("certifyAccuracy")}
            </span>
          </label>
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full h-12 bg-[#0F172A] hover:bg-[#1E293B] text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            {t("saving")}
          </>
        ) : (
          <>
            <Users className="w-5 h-5" />
            {t("createCreatorProfile")}
          </>
        )}
      </button>
    </form>
  );
}
