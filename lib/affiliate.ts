/**
 * Affiliate (apporteur d'affaires) cookie and constants.
 * See docs/AFFILIATE_SYSTEM_SPEC.md
 */

export const AFFILIATE_COOKIE_NAME = "naano_affiliate_ref";
export const AFFILIATE_COOKIE_MAX_AGE_DAYS = 30;

/** Form field name sent with onboarding so server can attribute. */
export const AFFILIATE_FORM_FIELD = "affiliateCode";

/**
 * Read affiliate code from cookie (client-side only).
 * Returns uppercase code or null if missing/invalid.
 */
export function getAffiliateCodeFromCookie(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp(`(?:^|; )\\s*${AFFILIATE_COOKIE_NAME}=([^;]*)`)
  );
  const value = match ? decodeURIComponent(match[1].trim()) : null;
  return value && value.length > 0 ? value.toUpperCase() : null;
}
