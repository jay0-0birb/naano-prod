/**
 * IP Geolocation Utility
 * Uses free ip-api.com service (no API key required, 45 req/min limit)
 * Fallback to ipapi.co if needed
 */

interface GeoLocation {
  country: string | null;
  city: string | null;
}

/**
 * Get geolocation from IP address
 * Uses free ip-api.com service
 */
export async function getGeoLocation(ipAddress: string): Promise<GeoLocation> {
  // Skip if IP is unknown, localhost, or private
  if (!ipAddress || 
      ipAddress === 'unknown' || 
      ipAddress === '127.0.0.1' || 
      ipAddress.startsWith('192.168.') ||
      ipAddress.startsWith('10.') ||
      ipAddress.startsWith('172.16.') ||
      ipAddress.startsWith('172.17.') ||
      ipAddress.startsWith('172.18.') ||
      ipAddress.startsWith('172.19.') ||
      ipAddress.startsWith('172.20.') ||
      ipAddress.startsWith('172.21.') ||
      ipAddress.startsWith('172.22.') ||
      ipAddress.startsWith('172.23.') ||
      ipAddress.startsWith('172.24.') ||
      ipAddress.startsWith('172.25.') ||
      ipAddress.startsWith('172.26.') ||
      ipAddress.startsWith('172.27.') ||
      ipAddress.startsWith('172.28.') ||
      ipAddress.startsWith('172.29.') ||
      ipAddress.startsWith('172.30.') ||
      ipAddress.startsWith('172.31.')) {
    return { country: null, city: null };
  }

  try {
    // Try ip-api.com first (free, no API key, 45 req/min)
    const response = await fetch(`http://ip-api.com/json/${ipAddress}?fields=status,country,countryCode,city`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      if (data.status === 'success') {
        return {
          country: data.countryCode || data.country || null,
          city: data.city || null,
        };
      }
    }
  } catch (error) {
    console.error('Error fetching geolocation from ip-api.com:', error);
  }

  // Fallback: return null (geo will be unknown)
  return { country: null, city: null };
}

/**
 * Get geolocation synchronously (for non-blocking use)
 * Returns a promise that resolves quickly or times out
 */
export async function getGeoLocationFast(ipAddress: string, timeoutMs: number = 1000): Promise<GeoLocation> {
  return Promise.race([
    getGeoLocation(ipAddress),
    new Promise<GeoLocation>((resolve) => 
      setTimeout(() => resolve({ country: null, city: null }), timeoutMs)
    ),
  ]);
}

