# Authority Metrics System - Technical Specification

## Overview

This document describes the complete authority/brand awareness measurement system for Konex. All metrics are calculated using **Naano-side data only** - no SaaS integration required.

The system measures how influencer campaigns build brand awareness beyond direct clicks, capturing the "I saw this brand everywhere" effect that leads to delayed conversions and organic brand recall.

---

## Core Concepts

### Authority vs Intent

- **Intent**: Immediate action (clicks within 24h) = user is actively looking
- **Authority**: Delayed action, repeat visits, brand recall = brand awareness building

### Data Sources (All Naano-Side)

1. `publication_proofs` - LinkedIn post submissions with timestamps
2. `link_events` - All clicks with timestamps, IPs, referrers
3. `tracked_links` - Links per collaboration
4. `collaborations` - Links influencers to SaaS
5. `leads` - Conversions (for ratio analysis)

---

## Metric Categories

### Category 1: Post Engagement Metrics

#### 1.1 Post-to-Click Correlation & Velocity

**Purpose**: Measure how posts drive immediate vs. delayed engagement

**Calculation**:

```
When post submitted at time T:
- Track all clicks on that influencer's tracking link in next 7 days
- Group clicks into time buckets:
  * Immediate: 0-24 hours
  * Short-term: 24-72 hours
  * Medium-term: 3-7 days

Velocity Metrics:
- First click delay: time between post submission and first click
- Click velocity: clicks per hour in first 24h
- Peak engagement window: hour of day with most clicks
- Delayed engagement ratio: (clicks days 2-7) / (clicks day 1)
```

**Authority Score Formula**:

```
authority_score = (delayed_clicks / immediate_clicks) × 100
High score (>50%) = strong brand awareness (people remember later)
Low score (<20%) = weak awareness (only immediate interest)
```

**Implementation**:

- Join `publication_proofs` with `link_events` by `collaboration_id`
- Filter clicks within 7 days of post submission
- Group by time buckets
- Calculate ratios

**Output Example**:

```
Post submitted: 2025-01-15 10:00
- Immediate clicks (0-24h): 12
- Delayed clicks (1-7d): 8
- Authority ratio: 67% (strong delayed engagement)
- First click: 2.5 hours after post
- Peak window: 14:00-16:00 (afternoon)
```

---

#### 1.2 Post Frequency & Consistency

**Purpose**: Measure posting cadence and consistency (regular posting = higher awareness)

**Calculation**:

```
Per SaaS:
- Count posts in last 30 days
- Count unique influencers posting
- Calculate posts per week: total_posts / 4.33
- Calculate consistency score:
  * Regular posting (2+ posts/week): 1.0
  * Irregular (1 post/week): 0.7
  * Sporadic (<1 post/week): 0.4

Consistency = (weeks_with_posts / total_weeks) × posting_frequency_factor
```

**Implementation**:

- Query `publication_proofs` grouped by `saas_id`
- Count posts per week
- Calculate variance in posting frequency
- Assign consistency score

**Output Example**:

```
SaaS: HubSpot
- Posts last 30 days: 24
- Active influencers: 8
- Posts per week: 5.5
- Consistency: High (regular posting)
- Authority boost: +15% (consistent exposure)
```

---

### Category 2: Exposure & Reach Metrics

#### 2.1 Multi-Influencer Reach Estimation

**Purpose**: Estimate total brand exposure across all influencers

**Calculation**:

```
Per SaaS:
- Count active collaborations (status = 'active')
- Count posts submitted in last 30 days
- Estimate reach per influencer:
  * If follower count available: use it
  * Else: use average (e.g., 5,000 followers)
  * Apply engagement rate (e.g., 3% for LinkedIn)

Brand Exposure = Σ(influencer_reach × engagement_rate × posts_count)
```

**Implementation**:

- Query `collaborations` where `status = 'active'`
- Join with `publication_proofs` to count posts
- If `creator_profiles` has follower data, use it
- Otherwise use platform averages

**Output Example**:

```
SaaS: Notion
- Active influencers: 30
- Posts last 30 days: 45
- Estimated total reach: 675,000 impressions
- Estimated views: 20,250 (3% engagement)
- Authority metric: "30 influencers = 675K impressions"
```

---

#### 2.2 Exposure Pressure Score

**Purpose**: Measure brand "pressure" - how much the brand appears in people's feeds

**Calculation**:

```
Rolling 30-day window:
- active_influencers = count of influencers who posted in last 30 days
- avg_posts_per_week = total_posts / 4.33
- weeks_active = how many weeks brand had activity

pressure_score = active_influencers × avg_posts_per_week × weeks_active

Post Overlap:
- Cluster posts by time (within 24h = same "wave")
- Count distinct waves
- High overlap = concentrated pressure
- Low overlap = sustained pressure
```

**Implementation**:

- Query posts in rolling window
- Group posts by time clusters (within 24h = same wave)
- Calculate active influencers per week
- Multiply factors

**Output Example**:

```
SaaS: Stripe
- Active influencers (30d): 25
- Avg posts/week: 8
- Weeks active: 6
- Pressure score: 1,200
- Post waves: 12 distinct waves
- Interpretation: "High brand pressure for 6 weeks"
```

---

#### 2.3 Cross-Wave Reinforcement

**Purpose**: Detect "I've seen this everywhere" effect across time

**Calculation**:

```
Track temporal waves:
- Wave = period of activity (posts within 2 weeks)
- Gap > 2 weeks = new wave
- Count distinct waves over time period

Reinforcement Score:
- Multiple waves = brand reappears in feeds
- Formula: waves_count × avg_influencers_per_wave × time_span_months
```

**Implementation**:

- Group posts by time
- Identify gaps > 2 weeks (new wave)
- Count waves in last 90 days
- Calculate reinforcement score

**Output Example**:

```
SaaS: Figma
- Waves in last 3 months: 4
- Avg influencers per wave: 8
- Reinforcement score: 32
- Interpretation: "Brand appeared in 4 distinct waves = high reinforcement"
```

---

### Category 3: Behavioral Pattern Metrics

#### 3.1 Click Pattern Analysis

**Purpose**: Identify patterns that indicate brand awareness vs. intent

**Pattern 1: Repeat Visitors**

```
Same IP clicks same SaaS multiple times over weeks:
- First click: Day 0
- Return click: Day 7, Day 21, etc.
- Pattern: "Saw brand, remembered it, came back later"

Repeat Visitor Score = count(unique_IPs with 2+ clicks) / total_unique_IPs
```

**Pattern 2: Direct Referrer Spikes**

```
Track referrer = 'direct' (user typed URL):
- Baseline: normal direct traffic
- Spike: increase after campaigns
- Suggests: "People remembered brand name"

Direct Traffic Lift = (direct_clicks_after_campaign / direct_clicks_before) - 1
```

**Pattern 3: Time-Delayed Clicks**

```
Clicks happening days/weeks after post:
- Post submitted: Day 0
- First click: Day 0 (intent)
- Delayed clicks: Day 3, Day 7, Day 14 (authority)

Delayed Click Ratio = clicks_after_24h / total_clicks
```

**Implementation**:

- Query `link_events` grouped by IP and SaaS
- Identify repeat visitors (same IP, same SaaS, different dates)
- Track referrer patterns over time
- Correlate delayed clicks with post dates

**Output Example**:

```
SaaS: Linear
- Repeat visitors: 15 (12% of total)
- Direct traffic lift: +45% after campaign
- Delayed clicks: 28% of total
- Pattern: Strong brand recall signals
```

---

#### 3.2 Cross-Influencer Click Overlap

**Purpose**: Measure if same people see brand from multiple influencers

**Calculation**:

```
For each SaaS:
- Group all clicks by IP address
- For each IP, count how many different influencers they clicked
- Overlap = IPs that clicked 2+ different influencers

Overlap Score = (IPs_with_2+_influencers / total_unique_IPs) × 100
```

**Implementation**:

- Query `link_events` joined with `tracked_links` and `collaborations`
- Group by `ip_address` and `saas_id`
- Count distinct `creator_id` per IP
- Calculate overlap percentage

**Output Example**:

```
SaaS: Vercel
- Total unique visitors: 500
- Visitors who clicked 2+ influencers: 45
- Overlap score: 9%
- Interpretation: "45 people saw brand from multiple sources = awareness building"
```

---

#### 3.3 Geographic Brand Spread

**Purpose**: Measure geographic diversity of brand awareness

**Calculation**:

```
If geo data available from clicks:
- Count unique countries
- Count unique cities
- Calculate geographic diversity index

Diversity = (unique_countries / total_clicks) × (unique_cities / total_clicks)
```

**Implementation**:

- Use `country` and `city` from `link_events` (if geo-enriched)
- Count distinct locations
- Calculate diversity metrics

**Output Example**:

```
SaaS: Supabase
- Countries reached: 12
- Cities reached: 45
- Geographic spread: High
- Authority: Global brand awareness
```

---

### Category 4: Advanced Modeling Metrics

#### 4.1 Memory Curve Modeling

**Purpose**: Model how brand awareness decays and refreshes over time

**Mathematical Model**:

```
Each post adds memory weight: +1.0
Memory decays daily: decay_rate = 0.95 (5% per day)

Formula:
memory(t) = memory(t-1) × 0.95 + new_exposures(t)

Where:
- memory(t-1) = previous day's memory
- new_exposures(t) = posts submitted today

Example:
Day 0: Post submitted → memory = 1.0
Day 1: No posts → memory = 1.0 × 0.95 = 0.95
Day 2: No posts → memory = 0.95 × 0.95 = 0.90
Day 3: New post → memory = 0.90 × 0.95 + 1.0 = 1.86
```

**Implementation**:

- Daily cron job calculates memory for each SaaS
- Query posts per day
- Apply decay formula
- Store in `authority_scores` table

**Output Example**:

```
SaaS: Notion
- Current memory weight: 7.3
- Last week: 5.2
- Trend: Increasing (new posts refreshing memory)
- Peak memory: 12.5 (3 weeks ago, high activity)
```

---

#### 4.2 Authority vs Intent Separation

**Purpose**: Clearly separate immediate intent from brand awareness

**Classification**:

```
Intent Signals (immediate action):
- Clicks within 24h of post
- High intent score from click analysis
- Direct conversions

Authority Signals (delayed/awareness):
- Clicks 24h-7d after post
- Repeat clicks (same IP, different dates)
- Cross-influencer overlap clicks
- Direct referrer clicks (after campaign)

Authority Points Calculation:
authority_points =
  (delayed_clicks × 1.0) +
  (repeat_clicks × 1.5) +
  (overlap_clicks × 2.0) +
  (direct_lift_clicks × 1.2)
```

**Implementation**:

- Classify each click as intent or authority
- Sum authority signals with weights
- Display both metrics separately

**Output Example**:

```
SaaS: Stripe
Intent Metrics:
- Immediate clicks: 45
- High-intent leads: 12
- Intent score: 8.2/10

Authority Metrics:
- Delayed clicks: 12
- Repeat visitors: 8
- Cross-overlap: 5
- Authority points: 28.5
- Authority score: 7.1/10

Interpretation: "Strong intent + building authority"
```

---

### Category 5: Normalization & Comparison Metrics

#### 5.1 Baseline Normalization

**Purpose**: Allow fair comparison between small and large SaaS

**Normalized Metrics**:

```
1. Clicks per Influencer:
   normalized_clicks = total_clicks / active_influencers

2. Clicks per Post:
   normalized_clicks = total_clicks / total_posts

3. Repeat Clicks per 1,000 Exposures:
   estimated_exposures = active_influencers × avg_followers × posts
   repeat_rate = (repeat_clicks / estimated_exposures) × 1000

4. Percentile Ranking:
   Compare SaaS to all other SaaS in platform
   Rank by authority score
   Show: "Top 20% for authority"
```

**Implementation**:

- Calculate normalized metrics per SaaS
- Compare against platform averages
- Calculate percentiles

**Output Example**:

```
SaaS: SmallCo (5 influencers)
- Raw clicks: 50
- Clicks per influencer: 10 (above average: 7)
- Clicks per post: 2.5 (above average: 2.0)
- Percentile: Top 25% for authority

SaaS: BigCo (50 influencers)
- Raw clicks: 500
- Clicks per influencer: 10 (same as SmallCo!)
- Clicks per post: 2.0 (average)
- Percentile: Top 30% for authority

Fair comparison: Both performing similarly per influencer
```

---

#### 5.2 Click-to-Lead Ratio Trends

**Purpose**: Identify when brand awareness grows faster than conversions

**Calculation**:

```
Per SaaS, over time:
- Calculate clicks per week
- Calculate leads per week
- Calculate ratio: leads / clicks

Trend Analysis:
- Decreasing ratio = more awareness, less intent
- Increasing ratio = better targeting or higher intent
- Stable ratio = consistent performance
```

**Implementation**:

- Group clicks and leads by week
- Calculate weekly ratios
- Track trend over time

**Output Example**:

```
SaaS: Linear
Week 1: 100 clicks, 10 leads (10% ratio)
Week 2: 120 clicks, 11 leads (9% ratio)
Week 3: 150 clicks, 12 leads (8% ratio)

Trend: Decreasing ratio
Interpretation: "Brand awareness growing faster than conversions = authority building"
```

---

### Category 6: Confidence & Reliability Metrics

#### 6.1 Authority Confidence Bands

**Purpose**: Provide honest uncertainty ranges instead of fake precision

**Confidence Calculation**:

```
Factors affecting confidence:
1. Sample size: more data = higher confidence
2. Consistency: consistent patterns = higher confidence
3. Time span: longer history = higher confidence

Confidence Bands:
- Low: Small sample (<50 clicks), short time (<2 weeks), inconsistent
- Medium: Moderate sample (50-200 clicks), 2-4 weeks, somewhat consistent
- High: Large sample (>200 clicks), >4 weeks, consistent patterns

Score Range:
- Low confidence: ±40% range (e.g., 6-10)
- Medium confidence: ±25% range (e.g., 7-9)
- High confidence: ±15% range (e.g., 7.5-8.5)
```

**Implementation**:

- Calculate confidence factors
- Assign confidence level
- Calculate range based on confidence
- Display as band, not single number

**Output Example**:

```
SaaS: Notion
Authority Score: Medium (7-9 range)
Confidence: Medium
Reasoning:
- Sample: 120 clicks (moderate)
- Time span: 3 weeks (good)
- Consistency: Somewhat consistent

SaaS: Stripe
Authority Score: High (12-15 range)
Confidence: High
Reasoning:
- Sample: 450 clicks (large)
- Time span: 8 weeks (excellent)
- Consistency: Very consistent patterns
```

---

## Database Schema

### New Tables

```sql
-- Authority scores (calculated daily)
CREATE TABLE authority_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  saas_id UUID NOT NULL REFERENCES saas_companies(id),
  calculated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Exposure metrics
  active_influencers_count INTEGER,
  posts_last_30_days INTEGER,
  pressure_score DECIMAL,
  memory_weight DECIMAL,
  last_memory_update TIMESTAMPTZ,

  -- Intent vs Authority
  intent_clicks INTEGER,           -- 0-24h clicks
  authority_clicks INTEGER,         -- delayed + repeats
  authority_points DECIMAL,

  -- Pattern metrics
  repeat_visitor_count INTEGER,
  cross_overlap_count INTEGER,
  direct_traffic_lift DECIMAL,

  -- Normalized metrics
  clicks_per_influencer DECIMAL,
  clicks_per_post DECIMAL,
  percentile_rank INTEGER,

  -- Confidence
  confidence_band TEXT,            -- 'low' | 'medium' | 'high'
  score_range_min DECIMAL,
  score_range_max DECIMAL,

  -- Trends
  click_to_lead_ratio DECIMAL,
  ratio_trend TEXT,                -- 'increasing' | 'decreasing' | 'stable'

  UNIQUE(saas_id, calculated_at)
);

-- Post velocity tracking
CREATE TABLE post_velocity_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  publication_proof_id UUID REFERENCES publication_proofs(id),
  collaboration_id UUID REFERENCES collaborations(id),

  post_submitted_at TIMESTAMPTZ,
  first_click_at TIMESTAMPTZ,
  first_click_delay_hours DECIMAL,

  clicks_0_24h INTEGER,
  clicks_24_72h INTEGER,
  clicks_3_7d INTEGER,
  total_clicks INTEGER,

  authority_ratio DECIMAL,        -- delayed / immediate
  peak_engagement_hour INTEGER,

  calculated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cross-influencer overlap tracking
CREATE TABLE cross_influencer_overlap (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  saas_id UUID REFERENCES saas_companies(id),
  ip_address TEXT,

  influencers_clicked INTEGER,     -- How many different influencers
  first_click_at TIMESTAMPTZ,
  last_click_at TIMESTAMPTZ,
  total_clicks INTEGER,

  UNIQUE(saas_id, ip_address)
);

-- Temporal waves tracking
CREATE TABLE brand_waves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  saas_id UUID REFERENCES saas_companies(id),

  wave_number INTEGER,
  wave_start_date DATE,
  wave_end_date DATE,
  influencers_in_wave INTEGER,
  posts_in_wave INTEGER,

  days_since_previous_wave INTEGER,

  UNIQUE(saas_id, wave_number)
);
```

---

## Calculation Schedule

### Real-time (on event)

- Post submission → trigger velocity calculation
- Click event → update overlap tracking, classify intent vs authority

### Daily Cron Job

- Memory curve decay and refresh
- Authority score calculation
- Confidence band updates
- Normalized metrics recalculation

### Weekly Analysis

- Wave detection (identify new waves)
- Trend analysis (click-to-lead ratios)
- Percentile ranking updates

---

## API Endpoints

### GET `/api/authority/:saasId`

Returns current authority metrics for a SaaS

**Response**:

```json
{
  "exposure": {
    "active_influencers": 25,
    "posts_last_30_days": 45,
    "pressure_score": 1200,
    "estimated_reach": 675000
  },
  "memory": {
    "current_weight": 7.3,
    "trend": "increasing",
    "last_update": "2025-01-20T10:00:00Z"
  },
  "intent_vs_authority": {
    "intent_clicks": 45,
    "authority_clicks": 28,
    "authority_points": 28.5,
    "intent_score": 8.2,
    "authority_score": 7.1
  },
  "patterns": {
    "repeat_visitors": 15,
    "cross_overlap": 9,
    "direct_traffic_lift": 0.45
  },
  "normalized": {
    "clicks_per_influencer": 10.2,
    "clicks_per_post": 2.5,
    "percentile_rank": 25
  },
  "confidence": {
    "band": "medium",
    "score_range": [7, 9],
    "factors": {
      "sample_size": "moderate",
      "time_span": "good",
      "consistency": "somewhat_consistent"
    }
  }
}
```

---

## UI Display Recommendations

### Dashboard Widget

```
┌─────────────────────────────────────┐
│ Brand Authority Score                │
│                                      │
│  🎯 Authority: 7.1/10 (Medium)      │
│  Range: 7-9                          │
│                                      │
│  Intent: 45 clicks                   │
│  Authority: 28 points                │
│                                      │
│  📊 Exposure Pressure: High          │
│  25 influencers, 45 posts/30d        │
│                                      │
│  💭 Memory Weight: 7.3 ↑             │
│  (was 5.2 last week)                 │
└─────────────────────────────────────┘
```

### Detailed View

- Time series charts for memory curve
- Post velocity breakdown
- Cross-influencer overlap visualization
- Geographic spread map (if available)
- Confidence indicators throughout

---

## Implementation Priority

### Phase 1 (MVP - 2 weeks)

1. Post-to-click velocity tracking
2. Multi-influencer exposure count
3. Authority vs intent separation (basic)
4. Exposure pressure score

### Phase 2 (Core - 3 weeks)

5. Memory curve modeling
6. Cross-influencer overlap
7. Repeat visitor tracking
8. Baseline normalization

### Phase 3 (Advanced - 2 weeks)

9. Cross-wave reinforcement
10. Click-to-lead ratio trends
11. Authority confidence bands
12. Geographic spread (if geo data available)

---

## Success Metrics

### For SaaS

- Understand brand awareness beyond clicks
- See long-term value of influencer campaigns
- Compare performance fairly (normalized)

### For Konex

- Differentiate from competitors (most only track clicks)
- Show value of sustained campaigns
- Build trust with honest confidence bands
- Enable better campaign optimization

---

## Technical Notes

### Performance Considerations

- Pre-calculate metrics in daily cron (avoid real-time heavy queries)
- Index on `saas_id`, `calculated_at`, `ip_address`
- Cache authority scores for dashboard display

### Privacy

- IP addresses used only for pattern detection
- No PII stored
- Aggregate metrics only

### Accuracy Limitations

- Memory curve is a model (not perfect)
- Reach estimation uses averages (not exact)
- Confidence bands acknowledge uncertainty

---

**Last Updated**: January 2025  
**Version**: 1.0  
**Status**: Specification (Implementation Pending)
