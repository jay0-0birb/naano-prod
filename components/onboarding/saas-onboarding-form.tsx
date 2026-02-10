"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import {
  completeSaasOnboarding,
  uploadMediaPack,
} from "@/app/(dashboard)/actions";
import { fetchAvatarFromWebsite } from "@/app/(dashboard)/dashboard/settings/actions";
import {
  Loader2,
  AlertCircle,
  Upload,
  CheckCircle2,
  Building2,
  Camera,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { COUNTRIES } from "@/lib/countries";

const INDUSTRIES = [
  "SaaS / Software",
  "Fintech",
  "E-commerce",
  "Marketing",
  "Human Resources",
  "Productivity",
  "Cybersecurity",
  "AI / Machine Learning",
  "EdTech",
  "HealthTech",
  "Other",
];

type MediaItem = {
  label: string;
  url: string;
};

export default function SaasOnboardingForm() {
  const t = useTranslations("onboarding");
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [mediaLabelInput, setMediaLabelInput] = useState("");
  const [mediaUrlInput, setMediaUrlInput] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isVatRegistered, setIsVatRegistered] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [isDetectingAvatar, setIsDetectingAvatar] = useState(false);
  const AVATAR_MAX_SIZE = 2 * 1024 * 1024; // 2MB
  const websiteInputRef = useRef<HTMLInputElement | null>(null);

  async function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const result = await uploadMediaPack(formData);

      if (!result) {
        setError(t("genericError"));
        return;
      }

      if ("error" in result && result.error) {
        setError(result.error);
        return;
      }

      if ("url" in result && result.url) {
        const url = result.url as string;
        const label = event.target.files?.[0]?.name || t("mediaPack");
        setMediaItems((prev) => {
          // Avoid duplicates by URL
          if (prev.some((item) => item.url === url)) return prev;
          return [...prev, { label, url }];
        });
      }
    } catch (err) {
      console.error(err);
      setError(t("genericError"));
    } finally {
      setIsUploading(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    if (mediaItems.length > 0) {
      formData.append("mediaPackUrl", JSON.stringify(mediaItems));
    }

    const result = await completeSaasOnboarding(formData);

    if (result?.error) {
      setError(result.error);
      setIsLoading(false);
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  }

  function handleAvatarChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setAvatarError(t("profilePhotoInvalidType"));
      event.target.value = "";
      setAvatarPreview(null);
      return;
    }

    if (file.size > AVATAR_MAX_SIZE) {
      setAvatarError(t("profilePhotoTooLarge"));
      event.target.value = "";
      setAvatarPreview(null);
      return;
    }

    setAvatarError(null);
    setAvatarPreview(URL.createObjectURL(file));
  }

  async function handleDetectAvatar() {
    const website = websiteInputRef.current?.value?.trim();
    if (!website) {
      setAvatarError(t("profilePhotoInvalidWebsite"));
      return;
    }

    setIsDetectingAvatar(true);
    setAvatarError(null);
    try {
      const result = await fetchAvatarFromWebsite(website);
      if (result.error) {
        setAvatarError(result.error);
      } else if (result.avatarUrl) {
        setAvatarPreview(result.avatarUrl);
      }
    } finally {
      setIsDetectingAvatar(false);
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

      <div className="space-y-5">
        {/* Profile photo */}
        <div className="space-y-2">
          <div className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 bg-gray-50/60">
            <label
              htmlFor="avatar"
              className="cursor-pointer shrink-0"
            >
              <div className="w-16 h-16 rounded-full overflow-hidden bg-white border border-dashed border-gray-300 flex items-center justify-center">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt={t("profilePhotoTitle")}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-[#9CA3AF] gap-1 w-full h-full">
                    <Camera className="w-6 h-6" />
                    <span className="text-[11px] font-medium">
                      {t("profilePhotoCta")}
                    </span>
                  </div>
                )}
              </div>
              <input
                id="avatar"
                name="avatar"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </label>
            <div className="space-y-1">
              <p className="text-sm font-medium text-[#111827]">
                {t("profilePhotoTitle")}
              </p>
              <p className="text-xs text-[#64748B]">
                {t("profilePhotoTrustText")}
              </p>
              <button
                type="button"
                onClick={handleDetectAvatar}
                disabled={isDetectingAvatar}
                className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-medium text-[#1D4ED8] hover:text-[#1D4ED8] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDetectingAvatar ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>{t("profilePhotoDetecting")}</span>
                  </>
                ) : (
                  <span>{t("profilePhotoDetectCta")}</span>
                )}
              </button>
            </div>
          </div>
          {avatarError && (
            <p className="text-xs text-red-600 px-1">{avatarError}</p>
          )}
        </div>

        {/* Company Name */}
        <div>
          <label className="block text-sm font-medium text-[#475569] mb-2">
            {t("companyName")}
          </label>
          <input
            name="companyName"
            type="text"
            required
            placeholder={t("companyPlaceholder")}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[#111827] placeholder:text-gray-400 focus:outline-none focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/10 transition-all"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-[#475569] mb-2">
            {t("productDescription")}
          </label>
          <textarea
            name="description"
            required
            rows={4}
            placeholder={t("productPlaceholder")}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[#111827] placeholder:text-gray-400 focus:outline-none focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/10 transition-all resize-none"
          />
        </div>

        {/* Website */}
        <div>
          <label className="block text-sm font-medium text-[#475569] mb-2">
            {t("website")}
          </label>
          <input
            ref={websiteInputRef}
            name="website"
            type="url"
            placeholder={t("websitePlaceholder")}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[#111827] placeholder:text-gray-400 focus:outline-none focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/10 transition-all"
          />
        </div>

        {/* Industry */}
        <div>
          <label className="block text-sm font-medium text-[#475569] mb-2">
            {t("industry")}
          </label>
          <select
            name="industry"
            required
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[#111827] focus:outline-none focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/10 transition-all"
          >
            <option value="">{t("selectIndustry")}</option>
            {INDUSTRIES.map((industry) => (
              <option key={industry} value={industry}>
                {industry}
              </option>
            ))}
          </select>
        </div>

        {/* Country */}
        <div>
          <label className="block text-sm font-medium text-[#475569] mb-2">
            {t("country")} *
          </label>
          <select
            name="country"
            required
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[#111827] focus:outline-none focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/10 transition-all"
          >
            <option value="">{t("selectCountry")}</option>
            {COUNTRIES.map((country) => (
              <option key={country.code} value={country.code}>
                {country.name}
              </option>
            ))}
          </select>
          <p className="text-xs text-[#64748B] mt-1.5">{t("billingNote")}</p>
        </div>

        {/* VAT Registration */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              name="isVatRegistered"
              id="isVatRegistered"
              checked={isVatRegistered}
              onChange={(e) => setIsVatRegistered(e.target.checked)}
              className="w-4 h-4 text-[#3B82F6] border-gray-300 rounded focus:ring-[#3B82F6]"
            />
            <label htmlFor="isVatRegistered" className="text-sm text-[#475569]">
              {t("vatRegistered")}
            </label>
          </div>
          {isVatRegistered && (
            <div>
              <label className="block text-sm font-medium text-[#475569] mb-2">
                {t("vatNumber")}
              </label>
              <input
                name="vatNumber"
                type="text"
                placeholder={t("vatPlaceholder")}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[#111827] placeholder:text-gray-400 focus:outline-none focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/10 transition-all"
              />
              <p className="text-xs text-[#64748B] mt-1.5">{t("vatNote")}</p>
            </div>
          )}
        </div>

        {/* Media Pack Upload + Links */}
        <div>
          <label className="block text-sm font-medium text-[#475569] mb-2">
            {t("mediaPack")}
          </label>
          <div className="relative">
            <input
              type="file"
              accept=".pdf,.zip,.png,.jpg,.jpeg"
              onChange={handleFileUpload}
              className="hidden"
              id="media-pack-upload"
            />
            <label
              htmlFor="media-pack-upload"
              className={`flex items-center justify-center gap-3 w-full py-4 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
                mediaItems.length > 0
                  ? "border-green-200 bg-green-50"
                  : "border-gray-200 hover:border-gray-300 bg-gray-50"
              }`}
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin text-[#3B82F6]" />
                  <span className="text-[#64748B]">{t("uploading")}</span>
                </>
              ) : mediaItems.length > 0 ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <span className="text-green-700 font-medium">
                    {t("fileUploaded")}
                  </span>
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5 text-[#64748B]" />
                  <span className="text-[#64748B]">{t("clickToUpload")}</span>
                </>
              )}
            </label>
          </div>

          {/* Manual links */}
          <p className="mt-2 text-xs text-[#64748B]">
            {t("mediaPackMultipleHint")}
          </p>

          <div className="mt-3 space-y-2">
            <div className="grid grid-cols-1 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)_auto] gap-2">
              <input
                type="text"
                value={mediaLabelInput}
                onChange={(e) => setMediaLabelInput(e.target.value)}
                placeholder={t("mediaPackLabelPlaceholder")}
                className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-[#111827] placeholder:text-gray-400 focus:outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]/20"
              />
              <input
                type="url"
                value={mediaUrlInput}
                onChange={(e) => setMediaUrlInput(e.target.value)}
                placeholder={t("mediaPackUrlPlaceholder")}
                className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-[#111827] placeholder:text-gray-400 focus:outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]/20"
              />
              <button
                type="button"
                onClick={() => {
                  const url = mediaUrlInput.trim();
                  if (!url) return;
                  const label =
                    mediaLabelInput.trim() || t("mediaPackDefaultLabel");
                  setMediaItems((prev) => [
                    ...prev,
                    {
                      label,
                      url,
                    },
                  ]);
                  setMediaLabelInput("");
                  setMediaUrlInput("");
                }}
                disabled={mediaUrlInput.trim().length === 0}
                className="px-3 py-2 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t("addMediaLink")}
              </button>
            </div>
            <p className="text-[11px] text-[#9CA3AF]">
              {t("mediaPackUrlHelper")}
            </p>

            {mediaItems.length > 0 && (
              <ul className="mt-2 space-y-1">
                {mediaItems.map((item, index) => (
                  <li
                    key={`${item.url}-${index}`}
                    className="flex items-center justify-between gap-3 px-3 py-2 bg-white border border-gray-200 rounded-xl"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-[#111827] truncate">
                        {item.label}
                      </p>
                      <p className="text-[11px] text-[#6B7280] break-all">
                        {item.url}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setMediaItems((prev) =>
                          prev.filter((_, i) => i !== index),
                        )
                      }
                      className="text-[11px] text-[#6B7280] hover:text-red-600"
                    >
                      {t("removeMediaLink")}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Terms and certification */}
      <h3 className="text-sm font-semibold text-[#0F172A] pt-2">
        {t("mandateSignature")}
      </h3>
      <div className="space-y-3">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            name="mandateAccepted"
            required
            className="mt-1 rounded border-gray-300"
          />
          <span className="text-sm text-[#475569]">
            {t.rich("acceptTermsAndPrivacy", {
              terms: (chunks) => (
                <a
                  href="/Terms.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#3B82F6] hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  {chunks}
                </a>
              ),
              privacy: (chunks) => (
                <a
                  href="/PRIVACY.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#3B82F6] hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  {chunks}
                </a>
              ),
            })}
          </span>
        </label>
        <label className="flex items-start gap-3 cursor-pointer">
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
            <Building2 className="w-5 h-5" />
            {t("createCompanyProfile")}
          </>
        )}
      </button>
    </form>
  );
}
