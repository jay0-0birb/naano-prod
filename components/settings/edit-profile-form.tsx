"use client";

import { useState, useRef } from "react";
import Cropper, { Area } from "react-easy-crop";
import { getCroppedImageBlob } from "@/lib/image-crop";
import { useTranslations } from "next-intl";
import {
  updateProfile,
  fetchAvatarFromWebsite,
} from "@/app/(dashboard)/dashboard/settings/actions";
import {
  Loader2,
  Save,
  X,
  Camera,
  User,
  Sparkles,
  Trash2,
} from "lucide-react";

interface EditProfileFormProps {
  profile: {
    id: string;
    full_name: string | null;
    email: string;
    role: string;
    avatar_url?: string | null;
  };
  websiteUrl?: string | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditProfileForm({ profile, websiteUrl, onClose, onSuccess }: EditProfileFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [fetchingAvatar, setFetchingAvatar] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [removeAvatar, setRemoveAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const websiteInputRef = useRef<HTMLInputElement>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isCropping, setIsCropping] = useState(false);

  const t = useTranslations("forms");
  const tSettings = useTranslations("settings");

  const hasPhoto = !removeAvatar && (previewUrl ?? profile.avatar_url ?? null);
  const displayUrl = removeAvatar ? null : (previewUrl ?? profile.avatar_url ?? null);

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  const handleFetchAvatar = async () => {
    const url = websiteInputRef.current?.value?.trim() || websiteUrl?.trim();
    if (!url) {
      setError(t("provideWebsiteUrl"));
      return;
    }
    setFetchingAvatar(true);
    setError(null);
    setRemoveAvatar(false);
    const result = await fetchAvatarFromWebsite(url);
    setFetchingAvatar(false);
    if (result.error) {
      setError(result.error);
    } else if (result.avatarUrl) {
      setPreviewUrl(result.avatarUrl);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    if (file.size > MAX_FILE_SIZE) {
      setError(t("imageTooLarge"));
      return;
    }
    setError(null);
    setRemoveAvatar(false);

    const objectUrl = URL.createObjectURL(file);
    setCropImageSrc(objectUrl);
    setShowCropper(true);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
  };

  const handleRemoveAvatar = () => {
    setRemoveAvatar(true);
    setPreviewUrl(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCropComplete = (_: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  };

  const applyCroppedImageToInput = async () => {
    if (!cropImageSrc || !fileInputRef.current) return;
    try {
      setIsCropping(true);
      console.log("[avatar] applying crop", {
        hasCropImageSrc: !!cropImageSrc,
        hasCroppedAreaPixels: !!croppedAreaPixels,
      });
      const blob = await getCroppedImageBlob(
        cropImageSrc,
        croppedAreaPixels,
        "image/jpeg",
      );
      const croppedFile = new File([blob], "avatar.jpg", {
        type: "image/jpeg",
      });

      // Update preview
      const previewObjectUrl = URL.createObjectURL(croppedFile);
      setPreviewUrl(previewObjectUrl);

      // Put cropped file into the hidden input so FormData picks it up
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(croppedFile);
      fileInputRef.current.files = dataTransfer.files;
      console.log("[avatar] cropped file set on input", {
        size: croppedFile.size,
        type: croppedFile.type,
      });

      setShowCropper(false);
    } finally {
      setIsCropping(false);
    }
  };

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;

    // If user is still in crop mode, apply the crop first so the cropped file
    // is what gets submitted.
    if (showCropper && cropImageSrc) {
      await applyCroppedImageToInput();
    }

    const avatarFile = (formElement.elements.namedItem("avatar") as HTMLInputElement)?.files?.[0];
    if (avatarFile && avatarFile.size > MAX_FILE_SIZE) {
      setError(t("imageTooLarge"));
      return;
    }
    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData(formElement);
      if (removeAvatar) formData.set("removeAvatar", "true");
      const result = await updateProfile(formData);

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
          : t("errorTryAgain")
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white border border-gray-200 rounded-2xl p-6 max-w-md w-full shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-medium text-[#111827]">
            {t("editProfile")}
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

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Hidden file input always mounted so we can attach cropped file */}
          <input
            id="avatar-upload"
            ref={fileInputRef}
            type="file"
            name="avatar"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleFileChange}
            className="hidden"
          />
          {/* Photo de profil with repositioning */}
          {showCropper && cropImageSrc ? (
            <div className="flex flex-col items-center">
              <label className="block text-sm font-medium text-[#374151] mb-3 w-full text-center">
                {t("profilePhoto")}
              </label>
              <p className="text-xs text-[#64748B] mb-3 text-center">
                {t("adjustPhoto")}
              </p>
              <div className="relative w-full max-w-xs aspect-square bg-black rounded-2xl overflow-hidden">
                <Cropper
                  image={cropImageSrc}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  cropShape="round"
                  showGrid={false}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={handleCropComplete}
                />
              </div>
              <label className="flex items-center gap-3 w-full max-w-xs mt-4">
                <span className="text-xs text-[#6B7280] w-16">
                  {t("zoom")}
                </span>
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.1}
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="flex-1"
                />
              </label>
            </div>
          ) : (
            <>
              <div className="flex flex-col items-center">
                <label className="block text-sm font-medium text-[#374151] mb-3 w-full text-center">
                  {t("profilePhoto")}
                </label>
                <label
                  htmlFor="avatar-upload"
                  className="cursor-pointer shrink-0"
                  style={{
                    width: 160,
                    height: 160,
                    borderRadius: "50%",
                    overflow: "hidden",
                    display: "block",
                    backgroundColor: "#f3f4f6",
                    border: "2px dashed #e5e7eb",
                  }}
                >
                  {displayUrl ? (
                    <img
                      src={displayUrl}
                      alt={t("profilePhoto")}
                      referrerPolicy="no-referrer"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-1 text-[#9CA3AF]">
                      <Camera className="w-12 h-12" />
                      <span className="text-xs font-medium">
                        {t("clickToAddPhoto")}
                      </span>
                    </div>
                  )}
                </label>
                {/* Actions */}
                <div className="flex flex-wrap justify-center gap-2 mt-4">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-[#374151] text-sm font-medium transition-colors"
                  >
                    {hasPhoto ? t("change") : t("addPhoto")}
                  </button>
                  <button
                    type="button"
                    onClick={handleFetchAvatar}
                    disabled={fetchingAvatar}
                    className="px-4 py-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#1D4ED8] text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1.5"
                  >
                    {fetchingAvatar ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {t("detecting")}
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        {t("importFromSite")}
                      </>
                    )}
                  </button>
                  {hasPhoto && (
                    <button
                      type="button"
                      onClick={handleRemoveAvatar}
                      className="px-4 py-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 text-sm font-medium transition-colors inline-flex items-center gap-1.5"
                    >
                      <Trash2 className="w-4 h-4" />
                      {t("removePhoto")}
                    </button>
                  )}
                </div>
                <p className="text-xs text-[#64748B] mt-2 text-center">
                  {t("photoFormatsHint")}
                </p>

                {/* Website URL for import */}
                <div className="w-full mt-4">
                  <input
                    ref={websiteInputRef}
                    type="url"
                    placeholder="https://votre-site.com"
                    defaultValue={websiteUrl || ""}
                    className="w-full text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#1D4ED8] focus:ring-1 focus:ring-[#1D4ED8]/30"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#374151] mb-2">
                  {tSettings("name")}
                </label>
                <input
                  name="fullName"
                  type="text"
                  required
                  defaultValue={profile.full_name || ""}
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#1D4ED8] focus:ring-1 focus:ring-[#1D4ED8]/30 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#374151] mb-2">
                  {tSettings("email")}
                </label>
                <input
                  type="email"
                  disabled
                  value={profile.email}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[#64748B] cursor-not-allowed"
                />
                <p className="text-xs text-[#64748B] mt-1.5">
                  {t("emailNotEditable")}
                </p>
              </div>
            </>
          )}

          <div className="flex gap-3 pt-4">
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
        </form>
      </div>
    </div>
  );
}

