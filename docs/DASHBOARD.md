### **DASHBOARD NAANO**

### **1\. Section KPIs (Le "Header" de Performance)**

Le but est de montrer immédiatement l'économie réalisée par rapport aux LinkedIn Ads.

- **Total Impressions :** Volume de visibilité brut généré par le pool de créateurs.
- **Total Clicks (Brut) :** Tous les clics enregistrés sur les liens trackés.
- **Qualified Clicks (Billable) :** La métrique d'or. Filtre basé sur :
  - _Règle des 3 secondes_ (élimination des clics accidentels).
  - _Anti-Bot & IP_ (filtrage des fermes à clics et doublons).
  - _Géo-targeting_ (si applicable).
- **Conversions / Leads :** Nombre de sign-ups ou démos (via tracking pixel Naano ou intégration UTM). si possible (serait top) sinon v2
- **Savings vs LinkedIn Ads :** Calcul dynamique : `(Nombre de clics x 8€) - Coût Naano`.

---

### **2\. Onglet "Lead Feed" (L'intelligence LLM)**

On ne se contente pas de donner un chiffre, on qualifie l'humain derrière le clic.

- **Tableau de bord des visiteurs :**
  - **Identité :** Nom, Prénom, Photo (via enrichissement d'IP ou cookies tiers).
  - **Profil :** Job Title, Entreprise, Lien LinkedIn. Ajouter secteurs d’activités et expertise.
  - **Source :** Nom du micro-créateur qui a généré la visite.
  - **LLM Lead Score**

---

### **3\. Onglet "Social Insights" (Le Hub de Commentaires)**

C'est ici qu'on extrait la "chaleur" de l'organique. C'est de l'or pour les SDR (Sales Dev Reps).

- **Comment Scraper & Map :** Extraction automatique de tous les commentaires sous les posts des ambassadeurs. Ou a la main pour la V1.
- **Actionability :**
  - Affichage du profil LinkedIn de celui qui commente.
  - Bouton "Ajouter au CRM" ou "Ouvrir sur LinkedIn". Si possible
  - _Brainstorming extrapolé :_ Suggestion de réponse générée par l'IA pour que le SaaS puisse rebondir sur le commentaire.

---

## 📋 IMPLEMENTATION PLAN

### **Phase 1: Basic Analytics Dashboard (KPIs)**

**Goal:** Add analytics tab to collaboration detail page showing key performance metrics.

**Scope:**

- Add tab navigation to collaboration detail page (SaaS-only view)
- Create "Analytics" tab with KPI cards
- Display metrics from existing `link_events` and `leads` tables

**Features:**

1. **Total Impressions**

   - Count from `link_events` where `event_type = 'impression'` for collaboration
   - Use existing `get_collaboration_metrics()` function

2. **Total Clicks (Brut)**

   - Count from `link_events` where `event_type = 'click'` for collaboration
   - Use existing `get_collaboration_metrics()` function

3. **Qualified Clicks (Billable) - Basic Version**

   - Initial filtering:
     - Filter out known bot user agents (basic regex patterns)
     - Filter duplicate IPs within same session (optional, can be Phase 2)
   - Note: 3-second rule requires SaaS-side integration (Phase 2+)
   - Note: Geo-targeting requires IP geolocation (Phase 2+)

4. **Conversions / Leads**

   - Count from `leads` table for collaboration
   - Show count of validated/billed leads

5. **Savings vs LinkedIn Ads**
   - Formula: `(Qualified Clicks × 8€) - (Total Lead Cost)`
   - Lead cost = sum of `lead_value` from `leads` table
   - Display as: "Vous avez économisé X€ vs LinkedIn Ads"

**Technical Implementation:**

- Create new server action: `getCollaborationAnalytics(collaborationId)`
- Create client component: `AnalyticsTab` with KPI cards
- Add tab navigation similar to finances page pattern
- Use existing `get_collaboration_metrics()` RPC function
- Query `leads` table for lead count and total cost

**Database Queries Needed:**

- Extend `get_collaboration_metrics()` or create new function for qualified clicks
- Query leads: `SELECT COUNT(*), SUM(lead_value) FROM leads WHERE tracked_link_id IN (...)`

---

### **Phase 2: Lead Feed with Basic Scoring**

**Goal:** Display lead feed with available visitor data and basic lead scoring.

**Scope:**

- Create "Lead Feed" tab in collaboration detail page
- Display leads with available metadata
- Implement regex-based lead scoring

**Features:**

1. **Lead Feed Table**

   - Display all leads for collaboration
   - Columns:
     - Date/Time (from `leads.created_at`)
     - IP Address (masked, e.g., `192.168.x.x`)
     - User Agent (browser/device info)
     - Referrer (where they came from)
     - Creator Source (creator name from collaboration)
     - Lead Score (0-100%, calculated)
     - Status (pending/validated/billed)

2. **Basic Lead Scoring (Regex-based)**

   - LinkedIn referrer: +20 points
   - Corporate IP pattern: +15 points (if we can detect)
   - Mobile device: +5 points
   - Known bot user agent: -100 points (filter out)
   - Desktop browser: +10 points
   - Direct traffic: +5 points
   - Base score: 50 points
   - Final score: min(100, max(0, sum of all points))

3. **Database Schema Updates**
   - Add `lead_score` column to `leads` table (DECIMAL 0-100)
   - Add `enrichment_data` JSONB column for future data
   - Create function to calculate and update lead scores

**Technical Implementation:**

- Create server action: `getCollaborationLeads(collaborationId)`
- Create client component: `LeadFeedTab` with table
- Create utility function: `calculateLeadScore(ip, userAgent, referrer)`
- Add database migration for new columns
- Create trigger or function to auto-calculate scores on lead creation

**Future Enhancements (Phase 3):**

- IP enrichment API integration
- LLM-based scoring
- Export to CSV
- Filtering and sorting

---

### **Phase 3: Enhanced Enrichment & LLM Scoring**

**Goal:** Add advanced lead enrichment and LLM-based scoring.

**Scope:**

- Integrate IP enrichment API
- Implement LLM lead scoring
- Add enriched data display

**Features:**

1. **IP Enrichment**

   - Integrate IP enrichment API (Clearbit, IPinfo, or MaxMind)
   - Store enriched data in `enrichment_data` JSONB column
   - Display: Company name, Industry, Location (if available)

2. **LLM Lead Scoring**

   - Use OpenAI/Anthropic API to analyze:
     - User agent patterns
     - Referrer quality
     - IP characteristics
     - Behavioral signals
   - Generate score (0-100%) with reasoning
   - Store reasoning in `enrichment_data`

3. **Enhanced Lead Feed**
   - Display enriched company data
   - Show LLM reasoning for score
   - Add filters: Score range, Date range, Creator
   - Export functionality

**Technical Implementation:**

- Create API route: `/api/leads/enrich`
- Create API route: `/api/leads/score` (LLM)
- Add background job/queue for async enrichment
- Update `LeadFeedTab` to show enriched data
- Add filtering UI

**Cost Considerations:**

- IP enrichment: ~$0.001-0.01 per lookup
- LLM scoring: ~$0.0001-0.001 per lead
- Consider rate limiting and caching

---

## 🎯 IMPLEMENTATION PRIORITY

**Recommended Order:**

1. ✅ **Phase 1** - Immediate value, uses existing data
2. ⏳ **Phase 2** - Adds lead visibility, basic scoring
3. 🔮 **Phase 3** - Advanced features, requires API integrations

**Dependencies:**

- Phase 1: No dependencies, can start immediately
- Phase 2: Requires Phase 1 (tab structure)
- Phase 3: Requires Phase 2 (lead feed structure)

---

## 📊 DATA AVAILABILITY MATRIX

| Feature           | Current Data               | Phase 1 | Phase 2 | Phase 3    |
| ----------------- | -------------------------- | ------- | ------- | ---------- |
| Impressions       | ✅ `link_events`           | ✅      | ✅      | ✅         |
| Total Clicks      | ✅ `link_events`           | ✅      | ✅      | ✅         |
| Qualified Clicks  | ⚠️ Basic filters           | ✅      | ✅      | ✅         |
| Leads Count       | ✅ `leads` table           | ✅      | ✅      | ✅         |
| Savings Calc      | ✅ `leads.lead_value`      | ✅      | ✅      | ✅         |
| Lead Feed         | ✅ `leads` + `link_events` | ❌      | ✅      | ✅         |
| Basic Scoring     | ⚠️ Regex patterns          | ❌      | ✅      | ✅         |
| IP Enrichment     | ❌                         | ❌      | ❌      | ✅         |
| LLM Scoring       | ❌                         | ❌      | ❌      | ✅         |
| Name/Photo        | ❌                         | ❌      | ❌      | ⚠️ Via API |
| Job Title/Company | ❌                         | ❌      | ❌      | ⚠️ Via API |
| LinkedIn Link     | ❌                         | ❌      | ❌      | ❌         |
