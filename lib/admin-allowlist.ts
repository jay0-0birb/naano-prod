/**
 * Admin access is gated by an allowlist of emails (env ADMIN_EMAILS).
 * Comma-separated, case-insensitive. Used for admin-only signup and (optional) checks.
 */

function getAdminEmails(): string[] {
  const raw = process.env.ADMIN_EMAILS;
  if (!raw || typeof raw !== "string") return [];
  return raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email: string): boolean {
  if (!email || typeof email !== "string") return false;
  const normalized = email.trim().toLowerCase();
  return getAdminEmails().includes(normalized);
}
