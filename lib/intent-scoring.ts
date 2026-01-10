/**
 * BEHAVIORAL INTENT SCORING
 * 
 * Layer 3: Behavioral Intent Scoring
 * 
 * Calculates intent score based on behavior signals.
 * Works at session level and can be aggregated at company level.
 */

interface IntentSignals {
  // Referrer quality
  referrer: string | null;
  isLinkedInReferrer: boolean;
  isDirectTraffic: boolean;
  
  // Engagement
  timeOnSite: number | null;
  isWorkingHours: boolean;
  
  // Behavioral (requires SaaS-side tracking or UTM parameters)
  pagesViewed: string[];
  viewedPricing: boolean;
  viewedSecurity: boolean;
  viewedDocs: boolean;
  viewedIntegrations: boolean;
  downloadCount: number;
  
  // Repeat visit
  isRepeatVisit: boolean;
  visitCount: number;
  daysSinceFirstVisit: number | null;
  
  // Network quality
  networkType: 'corporate' | 'residential' | 'mobile' | 'hosting' | 'vpn' | 'proxy' | 'unknown';
  isCorporateNetwork: boolean;
}

interface IntentScoreResult {
  sessionIntentScore: number; // 0-100
  intentSignals: {
    referrerQuality: number;
    engagementLevel: number;
    behavioralSignals: number;
    repeatVisitBonus: number;
    networkQuality: number;
    reasons: string[];
  };
}

/**
 * Calculate intent score from signals
 */
export function calculateIntentScore(signals: IntentSignals): IntentScoreResult {
  const reasons: string[] = [];
  let totalScore = 0;
  
  // 1. Referrer Quality (0-25 points)
  let referrerScore = 0;
  if (signals.isLinkedInReferrer) {
    referrerScore = 25;
    reasons.push('LinkedIn referrer (high quality)');
  } else if (signals.referrer && !signals.isDirectTraffic) {
    referrerScore = 10;
    reasons.push('Social/referral traffic');
  } else if (signals.isDirectTraffic) {
    referrerScore = 5;
    reasons.push('Direct traffic');
  }
  totalScore += referrerScore;
  
  // 2. Engagement Level (0-25 points)
  let engagementScore = 0;
  if (signals.timeOnSite !== null) {
    if (signals.timeOnSite >= 300) { // 5+ minutes
      engagementScore = 25;
      reasons.push('High engagement (5+ minutes)');
    } else if (signals.timeOnSite >= 180) { // 3+ minutes
      engagementScore = 20;
      reasons.push('Good engagement (3+ minutes)');
    } else if (signals.timeOnSite >= 60) { // 1+ minute
      engagementScore = 15;
      reasons.push('Moderate engagement (1+ minute)');
    } else if (signals.timeOnSite >= 3) { // 3+ seconds
      engagementScore = 10;
      reasons.push('Basic engagement (3+ seconds)');
    }
  }
  
  if (signals.isWorkingHours) {
    engagementScore += 5;
    reasons.push('Working hours visit');
  }
  totalScore += Math.min(engagementScore, 25);
  
  // 3. Behavioral Signals (0-30 points)
  let behavioralScore = 0;
  if (signals.viewedPricing) {
    behavioralScore += 15;
    reasons.push('Viewed pricing page');
  }
  if (signals.viewedSecurity) {
    behavioralScore += 10;
    reasons.push('Viewed security/compliance');
  }
  if (signals.viewedIntegrations) {
    behavioralScore += 8;
    reasons.push('Viewed integrations');
  }
  if (signals.viewedDocs) {
    behavioralScore += 5;
    reasons.push('Viewed documentation');
  }
  if (signals.downloadCount > 0) {
    behavioralScore += 10;
    reasons.push(`Downloaded ${signals.downloadCount} resource(s)`);
  }
  totalScore += Math.min(behavioralScore, 30);
  
  // 4. Repeat Visit Bonus (0-15 points)
  let repeatScore = 0;
  if (signals.isRepeatVisit) {
    repeatScore = 10;
    reasons.push('Repeat visitor');
    
    if (signals.visitCount >= 3) {
      repeatScore = 15;
      reasons.push('Multiple visits (high intent)');
    }
    
    if (signals.daysSinceFirstVisit !== null && signals.daysSinceFirstVisit <= 7) {
      repeatScore += 5;
      reasons.push('Returned within 7 days');
    }
  }
  totalScore += Math.min(repeatScore, 15);
  
  // 5. Network Quality (0-5 points)
  let networkScore = 0;
  if (signals.isCorporateNetwork) {
    networkScore = 5;
    reasons.push('Corporate network');
  }
  totalScore += networkScore;
  
  // Cap at 100
  totalScore = Math.min(totalScore, 100);
  
  return {
    sessionIntentScore: Math.round(totalScore),
    intentSignals: {
      referrerQuality: referrerScore,
      engagementLevel: Math.min(engagementScore, 25),
      behavioralSignals: Math.min(behavioralScore, 30),
      repeatVisitBonus: Math.min(repeatScore, 15),
      networkQuality: networkScore,
      reasons,
    },
  };
}

/**
 * Determine if visit is during working hours
 * Based on timezone from country (rough estimate)
 */
export function isWorkingHours(timestamp: Date, countryCode: string | null): boolean {
  const hour = timestamp.getUTCHours();
  
  // Rough timezone offsets (UTC)
  // Europe: UTC+0 to UTC+2 (8-18 UTC = working hours)
  // US: UTC-5 to UTC-8 (13-23 UTC = working hours)
  // Asia: UTC+5 to UTC+9 (1-11 UTC = working hours)
  
  if (!countryCode) {
    // Default: assume European timezone
    return hour >= 8 && hour <= 18;
  }
  
  // European countries
  const europeanCountries = ['FR', 'DE', 'GB', 'IT', 'ES', 'NL', 'BE', 'CH', 'AT', 'SE', 'NO', 'DK'];
  if (europeanCountries.includes(countryCode)) {
    return hour >= 8 && hour <= 18;
  }
  
  // US/Canada
  const northAmericanCountries = ['US', 'CA'];
  if (northAmericanCountries.includes(countryCode)) {
    return hour >= 13 && hour <= 23;
  }
  
  // Default: assume European timezone
  return hour >= 8 && hour <= 18;
}

/**
 * Parse user agent to extract device/OS/browser info
 */
export function parseUserAgent(userAgent: string | null): {
  deviceType: 'desktop' | 'mobile' | 'tablet' | 'unknown';
  os: string | null;
  browser: string | null;
} {
  if (!userAgent || userAgent === 'unknown') {
    return { deviceType: 'unknown', os: null, browser: null };
  }
  
  const ua = userAgent.toLowerCase();
  
  // Device type
  let deviceType: 'desktop' | 'mobile' | 'tablet' | 'unknown' = 'desktop';
  if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
    deviceType = 'mobile';
  } else if (ua.includes('tablet') || ua.includes('ipad')) {
    deviceType = 'tablet';
  }
  
  // OS - Check iOS/iPhone FIRST (before macOS) because iPhone UA contains "Mac OS X"
  let os: string | null = null;
  if (ua.includes('ios') || ua.includes('iphone') || ua.includes('ipad')) os = 'iOS';
  else if (ua.includes('windows')) os = 'Windows';
  else if (ua.includes('mac os') || ua.includes('macos')) os = 'macOS';
  else if (ua.includes('linux')) os = 'Linux';
  else if (ua.includes('android')) os = 'Android';
  
  // Browser
  let browser: string | null = null;
  if (ua.includes('chrome') && !ua.includes('edg')) browser = 'Chrome';
  else if (ua.includes('safari') && !ua.includes('chrome')) browser = 'Safari';
  else if (ua.includes('firefox')) browser = 'Firefox';
  else if (ua.includes('edg')) browser = 'Edge';
  else if (ua.includes('opera')) browser = 'Opera';
  
  return { deviceType, os, browser };
}

