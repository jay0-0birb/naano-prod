/**
 * SIMPLE TEST SCRIPT: Part A - Click Logging and Session Intelligence
 *
 * This makes real HTTP requests to your tracking link.
 * Everything happens automatically:
 * - Click is logged
 * - Device/OS/Browser parsed
 * - Geolocation fetched
 * - Enrichment triggered (async)
 * - Intent score calculated
 *
 * NOTE: time_on_site will be NULL in automated tests because fetch() doesn't
 * execute JavaScript. In real browsers, the 3-second rule tracking works correctly.
 * To test time_on_site, manually visit the tracking link in a browser and wait 3+ seconds.
 *
 * Usage: npx tsx scripts/test-part-a.ts
 */

const trackingLink =
  "http://localhost:3002/c/sarah-reynolds-super-cool-company-d56sqt";

interface TestCase {
  name: string;
  userAgent: string;
  referrer?: string;
  ip: string; // Simulated IP address to send in x-forwarded-for header
}

const testCases: TestCase[] = [
  {
    name: "Corporate Office - Windows Chrome from LinkedIn",
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    referrer: "https://www.linkedin.com/feed/",
    ip: "203.0.113.45", // Simulated corporate IP (RFC 5737 test range)
  },
  {
    name: "Home WiFi - macOS Safari Direct",
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
    referrer: undefined, // Direct traffic
    ip: "198.51.100.23", // Simulated residential IP (RFC 5737 test range)
  },
  {
    name: "Mobile - iPhone Safari from Twitter",
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    referrer: "https://twitter.com/",
    ip: "192.0.2.78", // Simulated mobile IP (RFC 5737 test range)
  },
  {
    name: "High-Intent Corporate - Windows Chrome from LinkedIn",
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    referrer: "https://www.linkedin.com/feed/",
    ip: "203.0.113.100", // Another corporate IP
  },
];

async function testClick(testCase: TestCase, index: number) {
  console.log(`\n${index + 1}. Testing: ${testCase.name}`);

  try {
    const headers: HeadersInit = {
      "User-Agent": testCase.userAgent,
      // Send simulated IP in x-forwarded-for header
      "x-forwarded-for": testCase.ip,
    };

    if (testCase.referrer) {
      headers["Referer"] = testCase.referrer;
    }

    const startTime = Date.now();
    const response = await fetch(trackingLink, {
      method: "GET",
      headers,
      redirect: "follow", // Follow redirect to destination
    });

    const duration = Date.now() - startTime;

    console.log(`   ✅ Click registered (${duration}ms)`);
    console.log(`   📍 Redirected to: ${response.url.substring(0, 80)}...`);

    // Wait for async enrichment and 3-second rule
    // - 3 seconds for time_on_site tracking (redirect delay)
    // - 2-3 seconds for enrichment API to complete
    console.log(
      `   ⏳ Waiting 6 seconds for async enrichment and 3-second rule...`
    );
    await new Promise((resolve) => setTimeout(resolve, 6000));

    console.log(`   ✅ Test complete`);
  } catch (error: any) {
    console.log(`   ❌ Error: ${error.message}`);
  }
}

async function runTests() {
  console.log("🚀 Testing Part A: Click Logging and Session Intelligence");
  console.log(`📎 Tracking Link: ${trackingLink}\n`);
  console.log("This will:");
  console.log("  ✅ Log clicks automatically");
  console.log("  ✅ Parse device/OS/browser automatically");
  console.log("  ✅ Fetch geolocation automatically");
  console.log("  ✅ Trigger enrichment automatically (async)");
  console.log("  ✅ Calculate intent scores automatically\n");

  for (let i = 0; i < testCases.length; i++) {
    await testClick(testCases[i], i);

    // Wait between tests
    if (i < testCases.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  console.log("\n✅ All tests complete!");
  console.log("\n📊 Next: Check results in Supabase SQL Editor:");
  console.log(`
SELECT 
  id,
  occurred_at,
  ip_address,
  user_agent,
  referrer,
  device_type,
  os,
  browser,
  country,
  city,
  time_on_site
FROM link_events
WHERE event_type = 'click'
ORDER BY occurred_at DESC
LIMIT 5;
  `);
}

runTests().catch(console.error);
