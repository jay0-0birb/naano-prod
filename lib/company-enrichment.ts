/**
 * COMPANY ENRICHMENT SERVICE
 * 
 * Layer 2: Company Inference (Probabilistic)
 * 
 * Enriches IP addresses with company information using IP enrichment APIs.
 * Always returns confidence scores and reasons - never claims certainty.
 */

interface CompanyEnrichmentResult {
  // Company data (probabilistic)
  companyName: string | null;
  companyDomain: string | null;
  industry: string | null;
  companySize: string | null;
  location: string | null;
  
  // Network classification
  networkType: 'corporate' | 'residential' | 'mobile' | 'hosting' | 'vpn' | 'proxy' | 'unknown';
  asnNumber: string | null;
  asnOrganization: string | null;
  isHosting: boolean;
  isVpn: boolean;
  isProxy: boolean;
  isMobileIsp: boolean;
  
  // Confidence and reasoning
  confidenceScore: number; // 0.00 to 1.00
  confidenceReasons: string[];
  
  // Ambiguity flag (Issue 1.2)
  isAmbiguous: boolean; // True if multiple companies possible or low confidence
}

/**
 * Enrich IP address with company information
 * Uses IPinfo.io API (free tier: 50k requests/month)
 * Falls back to ip-api.com if needed
 */
export async function enrichCompanyFromIP(ipAddress: string): Promise<CompanyEnrichmentResult> {
  // Skip if IP is invalid, localhost, or private
  if (!ipAddress || 
      ipAddress === 'unknown' || 
      ipAddress === 'local' ||
      ipAddress === '127.0.0.1' || 
      ipAddress === '::1' ||
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
    return getUnknownResult();
  }

  try {
    // Try IPinfo.io first (better for company data)
    const ipinfoKey = process.env.IPINFO_API_KEY; // Optional, works without key but limited
    const ipinfoUrl = ipinfoKey 
      ? `https://ipinfo.io/${ipAddress}?token=${ipinfoKey}`
      : `https://ipinfo.io/${ipAddress}`;
    
    const response = await fetch(ipinfoUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      return parseIPinfoResponse(data);
    }
  } catch (error) {
    console.error('Error fetching from IPinfo:', error);
  }

  // Fallback: Try ip-api.com
  try {
    const response = await fetch(`http://ip-api.com/json/${ipAddress}?fields=status,country,countryCode,city,org,as,query,proxy,hosting,mobile`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      if (data.status === 'success') {
        return parseIPApiResponse(data);
      }
    }
  } catch (error) {
    console.error('Error fetching from ip-api:', error);
  }

  // If all fails, return unknown
  return getUnknownResult();
}

/**
 * Parse IPinfo.io response
 */
function parseIPinfoResponse(data: any): CompanyEnrichmentResult {
  const reasons: string[] = [];
  let confidenceScore = 0.0;
  let networkType: CompanyEnrichmentResult['networkType'] = 'unknown';
  let companyName: string | null = null;
  let companyDomain: string | null = null;
  let industry: string | null = null;
  let companySize: string | null = null;
  
  // Extract ASN and organization
  const org = data.org || '';
  const asn = data.org?.split(' ')[0] || null;
  const asnOrg = org.replace(/^AS\d+\s+/, '') || null;
  
  // Network classification
  if (data.hosting === true || data.hosting === 'true') {
    networkType = 'hosting';
    reasons.push('hosting provider detected');
  } else if (data.proxy === true || data.proxy === 'true') {
    networkType = 'proxy';
    reasons.push('proxy detected');
  } else if (data.vpn === true || data.vpn === 'true') {
    networkType = 'vpn';
    reasons.push('VPN detected');
  } else if (data.mobile === true || data.mobile === 'true') {
    networkType = 'mobile';
    reasons.push('mobile ISP');
  } else if (org && !org.toLowerCase().includes('hosting') && 
             !org.toLowerCase().includes('cloud') &&
             !org.toLowerCase().includes('datacenter')) {
    networkType = 'corporate';
    reasons.push('corporate ASN');
    confidenceScore += 0.3;
  } else {
    networkType = 'residential';
  }
  
  // Extract company name from org
  if (asnOrg && networkType === 'corporate') {
    // Clean up company name
    companyName = asnOrg
      .replace(/Inc\.?/gi, '')
      .replace(/LLC\.?/gi, '')
      .replace(/Ltd\.?/gi, '')
      .replace(/Corp\.?/gi, '')
      .replace(/Corporation/gi, '')
      .trim();
    
    if (companyName) {
      confidenceScore += 0.4;
      reasons.push('corporate organization name');
    }
  }
  
  // Extract domain if available
  if (data.hostname) {
    const domain = data.hostname.replace(/^[^.]+\./, ''); // Remove subdomain
    if (domain && !domain.includes('amazonaws.com') && 
        !domain.includes('cloudfront.net') &&
        !domain.includes('azure.com')) {
      companyDomain = domain;
      confidenceScore += 0.2;
      reasons.push('company domain identified');
    }
  }
  
  // Location
  const location = [data.city, data.region, data.country]
    .filter(Boolean)
    .join(', ') || null;
  
  // Cap confidence at 1.0
  confidenceScore = Math.min(confidenceScore, 1.0);
  
  // Determine ambiguity (Issue 1.2)
  const isAmbiguous = confidenceScore < 0.5 || 
                      networkType === 'hosting' || 
                      networkType === 'vpn' ||
                      networkType === 'proxy';
  
  // If confidence is too low, return unknown
  if (confidenceScore < 0.3 || !companyName) {
    return getUnknownResult();
  }
  
  return {
    companyName,
    companyDomain,
    industry: null, // IPinfo free tier doesn't provide industry
    companySize: null, // Would need paid tier
    location,
    networkType,
    asnNumber: asn,
    asnOrganization: asnOrg,
    isHosting: networkType === 'hosting',
    isVpn: networkType === 'vpn',
    isProxy: networkType === 'proxy',
    isMobileIsp: networkType === 'mobile',
    confidenceScore,
    confidenceReasons: reasons,
    isAmbiguous,
  };
}

/**
 * Parse ip-api.com response
 */
function parseIPApiResponse(data: any): CompanyEnrichmentResult {
  const reasons: string[] = [];
  let confidenceScore = 0.0;
  let networkType: CompanyEnrichmentResult['networkType'] = 'unknown';
  let companyName: string | null = null;
  
  // Network classification
  if (data.hosting === true) {
    networkType = 'hosting';
    reasons.push('hosting provider detected');
  } else if (data.proxy === true) {
    networkType = 'proxy';
    reasons.push('proxy detected');
  } else if (data.mobile === true) {
    networkType = 'mobile';
    reasons.push('mobile ISP');
  } else if (data.org && !data.org.toLowerCase().includes('hosting') &&
             !data.org.toLowerCase().includes('cloud')) {
    networkType = 'corporate';
    reasons.push('corporate ASN');
    confidenceScore += 0.3;
    
    // Extract company name
    companyName = data.org
      .replace(/Inc\.?/gi, '')
      .replace(/LLC\.?/gi, '')
      .replace(/Ltd\.?/gi, '')
      .trim();
    
    if (companyName) {
      confidenceScore += 0.4;
      reasons.push('corporate organization name');
    }
  } else {
    networkType = 'residential';
  }
  
  // Location
  const location = [data.city, data.country]
    .filter(Boolean)
    .join(', ') || null;
  
  // Extract ASN
  const asnMatch = data.as?.match(/AS(\d+)/);
  const asnNumber = asnMatch ? asnMatch[1] : null;
  const asnOrganization = data.as?.replace(/^AS\d+\s+/, '') || null;
  
  confidenceScore = Math.min(confidenceScore, 1.0);
  
  // Determine ambiguity (Issue 1.2)
  const isAmbiguous = confidenceScore < 0.5 || 
                      networkType === 'hosting' || 
                      networkType === 'proxy';
  
  // If confidence is too low, return unknown
  if (confidenceScore < 0.3 || !companyName) {
    return getUnknownResult();
  }
  
  return {
    companyName,
    companyDomain: null, // ip-api.com doesn't provide domain
    industry: null,
    companySize: null,
    location,
    networkType,
    asnNumber,
    asnOrganization,
    isHosting: networkType === 'hosting',
    isVpn: false, // ip-api.com doesn't detect VPN
    isProxy: networkType === 'proxy',
    isMobileIsp: networkType === 'mobile',
    confidenceScore,
    confidenceReasons: reasons,
    isAmbiguous,
  };
}

/**
 * Return unknown result (low confidence or no data)
 */
function getUnknownResult(): CompanyEnrichmentResult {
  return {
    companyName: null,
    companyDomain: null,
    industry: null,
    companySize: null,
    location: null,
    networkType: 'unknown',
    asnNumber: null,
    asnOrganization: null,
    isHosting: false,
    isVpn: false,
    isProxy: false,
    isMobileIsp: false,
    confidenceScore: 0.0,
    confidenceReasons: [],
    isAmbiguous: true,
  };
}

/**
 * Fast enrichment with timeout (non-blocking)
 */
export async function enrichCompanyFromIPFast(
  ipAddress: string, 
  timeoutMs: number = 2000
): Promise<CompanyEnrichmentResult> {
  return Promise.race([
    enrichCompanyFromIP(ipAddress),
    new Promise<CompanyEnrichmentResult>((resolve) => 
      setTimeout(() => resolve(getUnknownResult()), timeoutMs)
    ),
  ]);
}

