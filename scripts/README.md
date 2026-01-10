# Testing Scripts

Simple scripts to test the attribution system.

## Quick Start

Just run one script - everything happens automatically:

```bash
npx tsx scripts/test-part-a.ts
```

This makes real HTTP requests to your tracking link. **Everything is automatic:**
- ✅ Click is logged
- ✅ Device/OS/Browser parsed
- ✅ Geolocation fetched
- ✅ Enrichment triggered (async)
- ✅ Intent score calculated

## Scripts

### `test-part-a.ts` - Click Logging Test

Makes 3 HTTP requests with different user agents to test Part A.

**Usage:**
```bash
npx tsx scripts/test-part-a.ts
```

**What it tests:**
- Corporate office user (Windows Chrome from LinkedIn)
- Home WiFi user (macOS Safari, direct)
- Mobile user (iPhone Safari from Twitter)

**After running:**
Wait 5-10 seconds, then check results in Supabase with the query shown at the end.

## SQL Test Data (Optional)

If you want to create test data directly in the database (bypassing the normal flow):

1. Run `supabase/test-simulations.sql` in Supabase SQL Editor
2. This creates test events, but **enrichment won't run automatically**
3. You'd need to manually trigger enrichment (not recommended - just use the script above)

## Why Only One Script?

**Real clicks = automatic everything.** When you make an HTTP request to the tracking link:
1. Click is logged immediately
2. Enrichment API is called automatically (async, non-blocking)
3. Intent scoring happens automatically

**SQL inserts = manual enrichment needed.** If you insert events directly via SQL, they bypass the normal flow, so enrichment doesn't trigger automatically.

**Solution:** Just use `test-part-a.ts` - it makes real HTTP requests, so everything works automatically!

