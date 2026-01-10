/**
 * CLIENT IP EXTRACTION UTILITY
 * 
 * Extracts client IP address from request headers ONLY (no socket IP).
 * Order of priority:
 * 1. x-forwarded-for (first IP in the comma-separated list)
 * 2. x-real-ip
 * 3. cf-connecting-ip (Cloudflare)
 * 
 * Invalid IPs (::1, 127.0.0.1, unknown) are treated as "local"
 * and should not be used for enrichment.
 */

export function getClientIP(headers: Headers): string {
  // Helper to check if IP is valid (not localhost or invalid)
  const isValidIP = (ip: string | null): boolean => {
    if (!ip) return false;
    const trimmed = ip.trim();
    // Treat these as invalid
    if (trimmed === '::1' || 
        trimmed === '127.0.0.1' || 
        trimmed === 'unknown' ||
        trimmed === 'localhost' ||
        trimmed.length === 0) {
      return false;
    }
    return true;
  };

  // 1. x-forwarded-for (first IP in the list, as it may contain multiple IPs)
  // Format: "client, proxy1, proxy2" - we want the first one (original client)
  const xForwardedFor = headers.get('x-forwarded-for');
  if (xForwardedFor) {
    const firstIP = xForwardedFor.split(',')[0]?.trim();
    if (isValidIP(firstIP)) {
      return firstIP!;
    }
  }

  // 2. x-real-ip
  const xRealIP = headers.get('x-real-ip');
  if (isValidIP(xRealIP)) {
    return xRealIP!;
  }

  // 3. cf-connecting-ip (Cloudflare)
  const cfConnectingIP = headers.get('cf-connecting-ip');
  if (isValidIP(cfConnectingIP)) {
    return cfConnectingIP!;
  }

  // No valid IP found in headers - return "local" (not "unknown")
  // This indicates localhost/testing and should NOT be enriched
  return 'local';
}

