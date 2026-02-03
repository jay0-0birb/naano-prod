import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * UTILITY FUNCTIONS
 * Various helper functions for the attribution system
 */

/**
 * App base URL with scheme. Use for redirects and Stripe callbacks.
 * Ensures NEXT_PUBLIC_APP_URL has https:// so new URL() never throws.
 */
export function getAppUrl(): string {
  const url = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3002";
  return url.startsWith("http") ? url : `https://${url}`;
}

/**
 * Merge Tailwind CSS classes with proper conflict resolution
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Mask IP address for privacy (Issue 6.1)
 * Returns format: "192.168.x.x" or "2001:db8::x"
 */
export function maskIPAddress(ip: string | null): string {
  if (!ip || ip === "unknown") {
    return "Unknown";
  }

  // IPv4: mask last octet
  if (ip.includes(".")) {
    const parts = ip.split(".");
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.${parts[2]}.x`;
    }
  }

  // IPv6: mask last segment
  if (ip.includes(":")) {
    const parts = ip.split(":");
    if (parts.length > 0) {
      parts[parts.length - 1] = "x";
      return parts.join(":");
    }
  }

  return ip;
}

/**
 * Format confidence score as percentage
 */
export function formatConfidence(score: number | null): string {
  if (score === null || score === undefined) {
    return "N/A";
  }
  return `${Math.round(score * 100)}%`;
}

/**
 * Get confidence badge color
 */
export function getConfidenceColor(score: number): string {
  if (score >= 0.8) return "green";
  if (score >= 0.6) return "yellow";
  if (score >= 0.4) return "orange";
  return "red";
}

/**
 * Map network_type to human-friendly Lead type label (for CSV export)
 */
export function getLeadTypeLabel(networkType: string | null): string {
  if (!networkType) return "Unknown";
  const map: Record<string, string> = {
    corporate: "Corporate",
    residential: "Individual",
    mobile: "Mobile",
    hosting: "Hosting",
    vpn: "VPN",
    proxy: "Proxy",
    unknown: "Unknown",
  };
  return map[networkType.toLowerCase()] ?? networkType;
}

/**
 * Format days ago
 */
export function formatDaysAgo(days: number | null): string {
  if (days === null || days === undefined) {
    return "N/A";
  }
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  if (days < 365) return `${Math.floor(days / 30)} months ago`;
  return `${Math.floor(days / 365)} years ago`;
}
