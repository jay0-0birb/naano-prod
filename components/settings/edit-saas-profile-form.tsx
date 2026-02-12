"use client";

import { useState, useRef } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import {
  updateSaasProfile,
  fetchLogoFromWebsite,
} from "@/app/(dashboard)/dashboard/settings/actions";
import {
  Loader2,
  Save,
  X,
  Building2,
  Globe,
  Camera,
  Sparkles,
  Trash2,
} from "lucide-react";
import { COUNTRIES } from "@/lib/countries";

interface EditSaasProfileFormProps {
  saasCompany: {
    id: string;
    company_name: string;
    description: string | null;
    website: string | null;
    industry: string | null;
    conditions: string | null;
    country: string | null;
    logo_url?: string | null;
    media_pack_url?: string | null;
  };
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditSaasProfileForm({
  saasCompany,
  onClose,
  onSuccess,
}: EditSaasProfileFormProps) {
  const t = useTranslations("forms");
  const tSettings = useTranslations("settings");
  const tOnboarding = useTranslations("onboarding");
  const [isLoading, setIsLoading] = useState(false);
  const [fetchingLogo, setFetchingLogo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [removeLogo, setRemoveLogo] = useState(false);
  const [imageLoadError, setImageLoadError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const hasLogo = !removeLogo && (previewUrl ?? saasCompany.logo_url ?? null);
  const displayUrl = removeLogo
    ? null
    : (previewUrl ?? saasCompany.logo_url ?? null);
  const showImage = displayUrl && !imageLoadError;
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  type MediaItem = {
    label: string;
    url: string;
  };

  const parseInitialMediaItems = (): MediaItem[] => {
    const raw = saasCompany.media_pack_url;
    if (!raw) return [];
    const trimmed = raw.trim();
    if (!trimmed) return [];

    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed
          .map((item) => {
            const url = typeof item?.url === "string" ? item.url.trim() : "";
            if (!url) return null;
            const labelRaw =
              typeof item?.label === "string" ? item.label.trim() : "";
            return {
              label: labelRaw || tOnboarding("mediaPackDefaultLabel"),
              url,
            };
          })
          .filter((i): i is MediaItem => i !== null);
      }
    } catch {
      // ignore and fall back
    }

    return [
      {
        label: tOnboarding("mediaPack"),
        url: trimmed,
      },
    ];
  };

  const [mediaItems, setMediaItems] = useState<MediaItem[]>(
    parseInitialMediaItems(),
  );
  const [mediaLabelInput, setMediaLabelInput] = useState("");
  const [mediaUrlInput, setMediaUrlInput] = useState("");

  const handleFetchLogo = async () => {
    const website =
      (
        formRef.current?.elements.namedItem("website") as HTMLInputElement
      )?.value?.trim() || saasCompany.website?.trim();
    if (!website) {
      setError(t("provideWebsiteUrl"));
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
    if (!file || !file.type.startsWith("image/")) return;
    if (file.size > MAX_FILE_SIZE) {
      setError(t("imageTooLarge"));
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
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const logoFile = (
      event.currentTarget.elements.namedItem("logo") as HTMLInputElement
    )?.files?.[0];
    if (logoFile && logoFile.size > MAX_FILE_SIZE) {
      setError(t("imageTooLarge"));
      return;
    }
    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData(event.currentTarget);
      if (removeLogo) formData.set("removeLogo", "true");
      if (mediaItems.length > 0) {
        formData.set("mediaPackUrl", JSON.stringify(mediaItems));
      } else {
        formData.set("mediaPackUrl", "");
      }
      const result = await updateSaasProfile(formData);

      if (result?.error) {
        setError(result.error);
        return;
      }
      onSuccess();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(
        msg.includes("1 MB") || msg.includes("body size")
          ? t("imageTooLarge")
          : t("errorTryAgain"),
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex flex-col items-center justify-center z-50 overflow-y-auto py-6 px-4">
      <div className="bg-white border border-gray-200 rounded-2xl max-w-2xl w-full shadow-xl flex flex-col max-h-[calc(100vh-3rem)] my-auto">
        {/* En-tête : titre centré pour symétrie des espaces */}
        <div className="relative flex items-center justify-center p-4 sm:p-5 pb-0 shrink-0">
          <h3 className="text-xl font-medium text-[#111827] text-center">
            {t("editCompanyProfile")}
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

        {/* Zone scrollable : tout centré sur le même axe qu’Annuler / Enregistrer */}
        <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 min-h-0 overflow-y-auto pt-4 pb-6 space-y-4">
          <div className="max-w-lg mx-auto w-full px-4 sm:px-6 space-y-4">
            {/* Logo entreprise – centré */}
            <div className="flex flex-col items-center">
              <label className="block text-sm font-medium text-[#374151] mb-2 w-full text-center">
                {t("companyLogo")}
              </label>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="relative w-32 h-32 min-w-32 min-h-32 aspect-square rounded-full overflow-hidden bg-[#f3f4f6] border-2 border-dashed border-gray-200 flex items-center justify-center hover:border-[#1D4ED8]/50 hover:bg-gray-50 transition-all group"
              >
                {showImage ? (
                  <>
                    {/* Cercle de rendu : l’image est bien clipée dans le cercle */}
                    <span className="absolute inset-0 rounded-full overflow-hidden z-[1]">
                      <Image
                        key={displayUrl}
                        src={displayUrl}
                        alt={t("companyLogo")}
                        fill
                        className="object-cover"
                        sizes="128px"
                        priority
                        unoptimized={displayUrl.startsWith("blob:")}
                        onError={() => setImageLoadError(true)}
                      />
                    </span>
                    <div className="absolute inset-0 rounded-full ring-2 ring-gray-200/80 ring-inset z-[2] pointer-events-none" aria-hidden />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity z-[3] pointer-events-none">
                      <Camera className="w-10 h-10 text-white" />
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-0.5 text-[#9CA3AF]">
                    <Camera className="w-10 h-10" />
                    <span className="text-[11px] font-medium">
                      {t("clickToAddPhoto")}
                    </span>
                  </div>
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                name="logo"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="flex flex-wrap justify-center gap-1.5 mt-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-2.5 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-[#374151] text-xs font-medium transition-colors"
                >
                  {hasLogo ? t("change") : t("addLogo")}
                </button>
                <button
                  type="button"
                  onClick={handleFetchLogo}
                  disabled={fetchingLogo}
                  className="px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#1D4ED8] text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1"
                >
                  {fetchingLogo ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      {t("importFromSite")}
                    </>
                  )}
                </button>
                {hasLogo && (
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    className="px-2.5 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 text-xs font-medium transition-colors inline-flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    {t("removeLogo")}
                  </button>
                )}
              </div>
              <p className="text-[11px] text-[#64748B] mt-1 text-center">
                {t("photoFormatsHint")}
              </p>
            </div>

            {/* Champs : Nom, Description, Site web, Secteur, Pays – même colonne centrée */}
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-[#374151] mb-1 text-left">
                  {tSettings("companyName")} *
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF] pointer-events-none" />
                  <input
                    name="companyName"
                    type="text"
                    required
                    defaultValue={saasCompany.company_name}
                    placeholder="Acme Inc."
                    className="w-full bg-white border border-gray-200 rounded-lg pl-10 pr-3 py-2.5 text-sm text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#1D4ED8] focus:ring-1 focus:ring-[#1D4ED8]/30 transition-all min-h-[2.5rem]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#374151] mb-1 text-left">
                  {tSettings("description")} *
                </label>
                <textarea
                  name="description"
                  required
                  rows={3}
                  defaultValue={saasCompany.description || ""}
                  placeholder={t("companyDescriptionPlaceholder")}
                  className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#1D4ED8] focus:ring-1 focus:ring-[#1D4ED8]/30 transition-all resize-none min-h-[4.5rem]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#374151] mb-1 text-left">
                  {tSettings("website")} *
                </label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF] pointer-events-none" />
                  <input
                    name="website"
                    type="url"
                    required
                    defaultValue={saasCompany.website || ""}
                    placeholder={t("websitePlaceholder")}
                    className="w-full bg-white border border-gray-200 rounded-lg pl-10 pr-3 py-2.5 text-sm text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#1D4ED8] focus:ring-1 focus:ring-[#1D4ED8]/30 transition-all min-h-[2.5rem]"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-[#374151] mb-1 text-left">
                    {tSettings("industry")} *
                  </label>
                  <select
                    name="industry"
                    required
                    defaultValue={saasCompany.industry || ""}
                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-[#111827] focus:outline-none focus:border-[#1D4ED8] focus:ring-1 focus:ring-[#1D4ED8]/30 transition-all"
                  >
                    <option value="">{t("selectIndustry")}</option>
                    <option value="SaaS">SaaS</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Finance">Finance</option>
                    <option value="E-commerce">E-commerce</option>
                    <option value="Productivité">Productivité</option>
                    <option value="RH">Ressources Humaines</option>
                    <option value="Ventes">Ventes</option>
                    <option value="Sales">Sales</option>
                    <option value="Growth">Growth</option>
                    <option value="GTM">GTM</option>
                    <option value="Autre">Autre</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#374151] mb-1 text-left">
                    {tSettings("country")}
                  </label>
                  <select
                    name="country"
                    defaultValue={saasCompany.country || ""}
                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-[#111827] focus:outline-none focus:border-[#1D4ED8] focus:ring-1 focus:ring-[#1D4ED8]/30 transition-all"
                  >
                    <option value="">{t("selectCountry")}</option>
                    {COUNTRIES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

          {/* Media pack (links & files) – titres alignés à gauche */}
          <div>
            <label className="block text-sm font-medium text-[#374151] mb-1 text-left">
              {tOnboarding("mediaPack")}
            </label>
            <p className="text-[11px] text-[#6B7280] mb-1.5 text-left">
              {tOnboarding("mediaPackMultipleHint")}
            </p>

            <div className="space-y-1.5">
              <div className="grid grid-cols-1 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)_auto] gap-2">
                <input
                  type="text"
                  value={mediaLabelInput}
                  onChange={(e) => setMediaLabelInput(e.target.value)}
                  placeholder={tOnboarding("mediaPackLabelPlaceholder")}
                  className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#1D4ED8] focus:ring-1 focus:ring-[#1D4ED8]/40"
                />
                <input
                  type="url"
                  value={mediaUrlInput}
                  onChange={(e) => setMediaUrlInput(e.target.value)}
                  placeholder={tOnboarding("mediaPackUrlPlaceholder")}
                  className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#1D4ED8] focus:ring-1 focus:ring-[#1D4ED8]/40"
                />
                <button
                  type="button"
                  onClick={() => {
                    const url = mediaUrlInput.trim();
                    if (!url) return;
                    const label =
                      mediaLabelInput.trim() ||
                      tOnboarding("mediaPackDefaultLabel");
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
                  className="px-3 py-2 rounded-lg bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {tOnboarding("addMediaLink")}
                </button>
              </div>
              {/* Existing items */}
              {mediaItems.length > 0 && (
                <ul className="mt-1.5 space-y-1 max-h-24 overflow-y-auto">
                  {mediaItems.map((item, index) => (
                    <li
                      key={`${item.url}-${index}`}
                      className="flex items-center justify-between gap-2 px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg"
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
                        className="text-[11px] text-[#6B7280] hover:text-red-600 shrink-0"
                      >
                        {tOnboarding("removeMediaLink")}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          </div>
          </div>

          {/* Pied : même largeur et centrage qu’au-dessus (pile au milieu) */}
          <div className="border-t border-gray-100 shrink-0 px-4 sm:px-6 py-4">
            <div className="max-w-lg mx-auto w-full flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-gray-100 border border-gray-200 rounded-xl text-sm text-[#374151] hover:bg-gray-200 transition-all disabled:opacity-50"
            >
              {t("cancel")}
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[#0F172A] hover:bg-[#1E293B] rounded-xl text-sm text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
