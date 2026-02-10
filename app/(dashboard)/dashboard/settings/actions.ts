"use server";

import sharp from "sharp";
import { createClient } from "@/lib/supabase/server";
import { normalizeLinkedInProfileUrl } from "@/lib/utils";
import { revalidatePath } from "next/cache";

const AVATAR_MAX_SIZE = 2 * 1024 * 1024; // 2MB

/** Trim padding and ensure square output - logo only, fits in circle */
async function processLogoForAvatar(
  buffer: ArrayBuffer,
  contentType: string,
): Promise<Buffer> {
  const input = Buffer.from(buffer);
  try {
    let pipeline = sharp(input);
    const meta = await pipeline.metadata();
    let width = meta.width ?? 0;
    let height = meta.height ?? 0;

    // 1. Trim transparent/whitespace padding
    const trimmed = await sharp(input).trim({ threshold: 15 }).toBuffer();
    pipeline = sharp(trimmed);
    const trimmedMeta = await pipeline.metadata();
    width = trimmedMeta.width ?? width;
    height = trimmedMeta.height ?? height;

    // 2. If very wide (banner/og:image), center-crop to square - logo is usually in center
    const aspect = width / height;
    if (aspect > 1.3 || aspect < 0.77) {
      const size = Math.min(width, height);
      const left = Math.floor((width - size) / 2);
      const top = Math.floor((height - size) / 2);
      pipeline = sharp(trimmed).extract({
        left,
        top,
        width: size,
        height: size,
      });
    }

    // 3. Resize to 512x512 square (cover = center-crop to fill, upscale small logos)
    return pipeline
      .resize(512, 512, { fit: "cover", position: "center" })
      .png()
      .toBuffer();
  } catch {
    return input;
  }
}
const AVATAR_ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

async function uploadAvatar(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  file: File,
  filename: string,
): Promise<string | null> {
  if (file.size > AVATAR_MAX_SIZE) return null;
  if (!AVATAR_ALLOWED_TYPES.includes(file.type)) return null;

  const ext = file.name.split(".").pop() || "jpg";
  const path = `${userId}/${filename}-${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from("avatars")
    .upload(path, file, { cacheControl: "3600", upsert: true });

  if (error) return null;

  const {
    data: { publicUrl },
  } = supabase.storage.from("avatars").getPublicUrl(path);

  return publicUrl;
}

export async function updateProfile(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Non authentifié" };
  }

  const fullName = formData.get("fullName") as string;
  const avatarFile = formData.get("avatar") as File | null;
  const removeAvatar = formData.get("removeAvatar") === "true";

  let avatarUrl: string | null | undefined = undefined;
  console.log("[updateProfile] received avatar file", {
    size: avatarFile?.size,
    type: avatarFile?.type,
  });
  if (removeAvatar) {
    avatarUrl = null;
  } else if (avatarFile && avatarFile.size > 0) {
    const url = await uploadAvatar(supabase, user.id, avatarFile, "avatar");
    if (url) avatarUrl = url;
  }

  const updateData: Record<string, string | null> = { full_name: fullName };
  if (avatarUrl !== undefined) updateData.avatar_url = avatarUrl;
  console.log("[updateProfile] updating profile with", updateData);

  const { error } = await supabase
    .from("profiles")
    .update(updateData)
    .eq("id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateCreatorProfile(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Non authentifié" };
  }

  const bio = formData.get("bio") as string;
  const linkedinUrl = normalizeLinkedInProfileUrl(
    formData.get("linkedinUrl") as string,
  );
  const followersCount =
    parseInt(formData.get("followersCount") as string) || 0;
  const themesFromForm = formData.getAll("themes") as string[] | null;
  const cleanedThemes =
    themesFromForm
      ?.map((t) => (t || "").toString().trim())
      .filter((t) => t.length > 0) || [];
  const theme =
    (formData.get("theme") as string) || cleanedThemes[0] || null;
  const country = (formData.get("country") as string)?.trim() || null;

  const { error } = await supabase
    .from("creator_profiles")
    .update({
      bio,
      linkedin_url: linkedinUrl,
      followers_count: followersCount,
      theme: theme || null,
      expertise_sectors:
        cleanedThemes.length > 0 ? cleanedThemes.slice(0, 3) : null,
      country: country,
    })
    .eq("profile_id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard/marketplace");
  return { success: true };
}

export async function updateSaasProfile(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Non authentifié" };
  }

  const companyName = formData.get("companyName") as string;
  const description = formData.get("description") as string;
  const website = formData.get("website") as string;
  const industry = formData.get("industry") as string;
  const conditions = formData.get("conditions") as string;
  const country = (formData.get("country") as string)?.trim() || null;
  const logoFile = formData.get("logo") as File | null;
  const removeLogo = formData.get("removeLogo") === "true";

  let logoUrl: string | null | undefined = undefined;
  if (removeLogo) {
    logoUrl = null;
  } else if (logoFile && logoFile.size > 0) {
    const url = await uploadAvatar(supabase, user.id, logoFile, "logo");
    if (url) logoUrl = url;
  }

  const updateData: Record<string, string | number | null> = {
    company_name: companyName,
    description,
    website,
    industry,
    conditions,
    country,
  };
  if (logoUrl !== undefined) updateData.logo_url = logoUrl;

  const { error } = await supabase
    .from("saas_companies")
    .update(updateData)
    .eq("profile_id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard/marketplace");
  return { success: true };
}

/** Get Google Favicon URL for a domain. sz=256 for good quality in circle. */
function getGoogleFaviconUrl(websiteUrl: string): string | null {
  try {
    const url = new URL(
      websiteUrl.startsWith("http") ? websiteUrl : "https://" + websiteUrl,
    );
    const domain = url.hostname.replace(/^www\./, "");
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=256`;
  } catch {
    return null;
  }
}

export async function fetchLogoFromWebsite(websiteUrl: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié" };

  const faviconUrl = getGoogleFaviconUrl(websiteUrl);
  if (!faviconUrl) return { error: "URL du site web invalide" };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const imgRes = await fetch(faviconUrl, {
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0 (compatible; Naano/1.0)" },
    });
    clearTimeout(timeout);
    if (!imgRes.ok)
      return { error: "Impossible de récupérer le favicon. Vérifiez l'URL." };
    const contentType = imgRes.headers.get("content-type") || "";
    if (!contentType.startsWith("image/"))
      return { error: "Aucun favicon trouvé pour ce site." };

    const arrayBuffer = await imgRes.arrayBuffer();
    if (arrayBuffer.byteLength > AVATAR_MAX_SIZE)
      return { error: "L'image est trop volumineuse (max 2 Mo)" };

    const trimmedBuffer = await processLogoForAvatar(arrayBuffer, contentType);
    if (trimmedBuffer.length > AVATAR_MAX_SIZE)
      return { error: "L'image est trop volumineuse (max 2 Mo)" };

    const path = `${user.id}/logo-${Date.now()}.png`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, trimmedBuffer, {
        contentType: "image/png",
        cacheControl: "3600",
        upsert: true,
      });

    if (uploadError)
      return { error: "Erreur lors de l'enregistrement du logo" };

    const {
      data: { publicUrl },
    } = supabase.storage.from("avatars").getPublicUrl(path);

    const { error: updateError } = await supabase
      .from("saas_companies")
      .update({ logo_url: publicUrl })
      .eq("profile_id", user.id);

    if (updateError) return { error: updateError.message };

    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard/marketplace");
    return { success: true, logoUrl: publicUrl };
  } catch (e) {
    clearTimeout(timeout);
    if (e instanceof Error) {
      if (e.name === "AbortError")
        return { error: "Délai dépassé. Vérifiez l'URL." };
      return { error: e.message };
    }
    return { error: "Une erreur est survenue" };
  }
}

/** Fetch avatar/logo from website and set as profile avatar_url */
export async function fetchAvatarFromWebsite(websiteUrl: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié" };

  const faviconUrl = getGoogleFaviconUrl(websiteUrl);
  if (!faviconUrl) return { error: "URL du site web invalide" };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const imgRes = await fetch(faviconUrl, {
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0 (compatible; Naano/1.0)" },
    });
    clearTimeout(timeout);
    if (!imgRes.ok)
      return { error: "Impossible de récupérer le favicon. Vérifiez l'URL." };
    const contentType = imgRes.headers.get("content-type") || "";
    if (!contentType.startsWith("image/"))
      return { error: "Aucun favicon trouvé pour ce site." };

    const arrayBuffer = await imgRes.arrayBuffer();
    if (arrayBuffer.byteLength > AVATAR_MAX_SIZE)
      return { error: "L'image est trop volumineuse (max 2 Mo)" };

    const trimmedBuffer = await processLogoForAvatar(arrayBuffer, contentType);
    if (trimmedBuffer.length > AVATAR_MAX_SIZE)
      return { error: "L'image est trop volumineuse (max 2 Mo)" };

    const path = `${user.id}/avatar-${Date.now()}.png`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, trimmedBuffer, {
        contentType: "image/png",
        cacheControl: "3600",
        upsert: true,
      });

    if (uploadError) return { error: "Erreur lors de l'enregistrement" };

    const {
      data: { publicUrl },
    } = supabase.storage.from("avatars").getPublicUrl(path);

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ avatar_url: publicUrl })
      .eq("id", user.id);

    if (updateError) return { error: updateError.message };

    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard");
    return { success: true, avatarUrl: publicUrl };
  } catch (e) {
    clearTimeout(timeout);
    if (e instanceof Error) {
      if (e.name === "AbortError")
        return { error: "Délai dépassé. Vérifiez l'URL." };
      return { error: e.message };
    }
    return { error: "Une erreur est survenue" };
  }
}
