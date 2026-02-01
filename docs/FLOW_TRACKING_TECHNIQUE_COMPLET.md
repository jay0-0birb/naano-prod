# Flow technique complet : liens trackés, clics qualifiés et données SaaS

Document technique détaillé de l'architecture complète du système de tracking, de la génération des liens jusqu'aux données exposées aux SaaS.

---

## 1. Génération et structure des liens trackés

Un lien tracké est créé automatiquement lorsqu'une collaboration devient active entre un créateur et un SaaS. La fonction `getOrCreateTrackingLink` dans `actions-v2.ts` est invoquée lors du chargement de la page de détail d'une collaboration. Si aucun lien n'existe pour cette collaboration, le système en génère un. Le hash du lien suit le format `[creator-slug]-[saas-slug]-[random-6-chars]` où les slugs sont dérivés des noms complets (normalisation NFD, suppression des accents, remplacement des caractères non alphanumériques par des tirets, troncature à 20 caractères). La partie aléatoire est générée via `Math.random().toString(36).substring(2, 8)` et l'unicité est vérifiée contre la table `tracked_links`. Si le SaaS modifie l'URL de destination (via une marque ou le site principal) et que l'utilisateur connecté est le propriétaire SaaS, un nouveau hash est généré pour refléter le nouveau produit promu.

La table `tracked_links` stocke l'identifiant de la collaboration, le hash unique, l'URL de destination, et les flags `track_impressions`, `track_clicks`, `track_revenue` (tous à true par défaut). L'URL complète exposée au créateur est du type `https://[domain]/c/[hash]`, où `/c/` est la route de redirection avancée qui gère impressions, clics, cookie d'attribution et enrichissement. Une route alternative `/t/[hash]` existe mais est plus simple et n'inclut pas l'enrichissement ni la règle des 3 secondes.

---

## 2. Parcours d'une requête sur un lien tracké

Lorsqu'un utilisateur accède à `GET /c/[hash]`, le handler dans `app/c/[hash]/route.ts` récupère d'abord le `tracked_link` correspondant au hash via Supabase, avec les jointures nécessaires pour récupérer les infos de collaboration, créateur et SaaS. En cas d'échec, une redirection vers la homepage est renvoyée. Ensuite, les métadonnées de la requête sont extraites : l'IP via `getClientIP(headers)` qui lit `x-forwarded-for` ou `x-real-ip`, le `user-agent`, et le `referrer` (ou "direct" si absent). Un `session_id` est obtenu soit depuis le cookie `naano_attribution` s'il existe, soit généré via `randomUUID()`.

Le type d'événement est déterminé : si le referrer n'est pas "direct" ou si le header `sec-fetch-dest` vaut "document", c'est considéré comme un clic ; sinon c'est une impression (par exemple prévisualisation de lien, crawl de bot). Si `track_clicks` ou `track_impressions` est activé, l'événement correspondant est retenu. Pour les clics, la géolocalisation est récupérée via `getGeoLocationFast(ipAddress, 1000)` qui appelle ip-api.com avec un timeout d'une seconde et retourne pays (countryCode) et ville.

Un enregistrement est inséré dans `link_events` avec `tracked_link_id`, `event_type`, `ip_address`, `user_agent`, `referrer`, `session_id`, `country`, `city`, et `time_on_site` à null. L'insert retourne l'`event_id`. Pour les clics, un fetch asynchrone (fire-and-forget) est lancé vers `/api/track/enrich` avec cet `eventId` pour déclencher l'enrichissement et le scoring d'intention sans bloquer la réponse.

La création de lead est différée à l'API 3sec : seuls les clics qualifiés (non bot, temps sur site >= 3 secondes, dédoublonnage par lien tracké + IP + heure) déclenchent un lead. Aucun lead n’est créé au moment du clic brut. Les leads ne sont créés que par l’API 3sec après qualification. Lorsque l'API 3sec met à jour `time_on_site` pour un clic ayant passé 3 secondes, elle appelle `create_qualified_lead_from_event` qui vérifie les trois critères de qualification avant de créer le lead, déduire un crédit du wallet SaaS et créditer le créateur (€0.90 ou €1.10 selon tier).

L'URL de destination est construite à partir de `tracked_links.destination_url` avec les paramètres UTM (`utm_source=naano`, `utm_medium=ambassador`, `utm_content=creator_id`, `utm_campaign=collaboration_id`) et le paramètre `naano_session` contenant le `session_id` pour permettre au SaaS de faire du tracking serveur via webhook. Une page HTML intermédiaire est renvoyée au lieu d'une redirection HTTP directe. Cette page définit le cookie `naano_attribution` avec le `session_id` et une durée de 30 jours, puis exécute du JavaScript. Pour les clics, ce script attend 3 secondes, appelle `POST /api/track/3sec` avec `eventId` et `timeOnSite`, puis redirige vers l'URL de destination. En cas de fermeture de l'onglet à tout moment, `beforeunload` envoie le temps via `navigator.sendBeacon` si `timeOnSite >= 3` (pour capturer l'engagement quand l'utilisateur quitte après 3+ secondes sans attendre le setTimeout). Si l'utilisateur ferme avant 3 secondes, aucune requête n'est envoyée et `time_on_site` reste null. L'API 3sec met à jour `link_events.time_on_site` pour l'événement correspondant. Le temps mesuré est donc celui passé sur la page de redirection Naano, pas sur le site du SaaS.

---

## 3. Enrichissement asynchrone (couche 1, 2 et 3)

L'endpoint `/api/track/enrich` reçoit l'`eventId` et charge l'événement depuis `link_events`. Il applique trois couches de traitement.

**Couche 1 – Session intelligence (déterministe)** : le `user_agent` est parsé via `parseUserAgent` pour extraire `device_type` (desktop, mobile, tablette), `os` (Windows, macOS, iOS, Android, Linux) et `browser` (Chrome, Safari, Firefox, Edge, Opera). Ces champs sont mis à jour sur le `link_event`.

**Couche 2 – Company inference (probabiliste)** : si l'IP n'est pas unknown ou local, `enrichCompanyFromIPFast` est appelé avec un timeout de 2 secondes. La fonction tente d'abord IPinfo.io (avec ou sans token selon `IPINFO_API_KEY`), puis ip-api.com en fallback. La réponse IPinfo est parsée pour extraire l'organisation ASN, le hostname (pour le domaine), et classifier le réseau : hosting, proxy, vpn, mobile, ou corporate si l'org ne contient pas hosting/cloud/datacenter. Pour un réseau corporate, le nom d'entreprise est nettoyé (suppression de Inc, LLC, Ltd, Corp) et un score de confiance est calculé : +0.3 pour ASN corporate, +0.4 pour nom d'organisation, +0.2 pour domaine identifié. Si le score est >= 0.3 et qu'un nom d'entreprise existe, un enregistrement est créé dans `company_inferences` avec `link_event_id`, `tracked_link_id`, `inferred_company_name`, `inferred_company_domain`, `inferred_industry` (null en tier gratuit), `inferred_company_size` (null), `inferred_location` (ville, région, pays), `confidence_score`, `confidence_reasons`, `network_type`, `asn_number`, `asn_organization`, et les flags `is_hosting`, `is_vpn`, `is_proxy`, `is_mobile_isp`, `is_ambiguous`. Le champ `network_type` est aussi écrit sur le `link_event`.

**Couche 3 – Intent scoring (comportemental)** : le système vérifie s'il existe des clics précédents avec la même IP sur le même `tracked_link_id` pour déterminer `isRepeatVisit` et `visitCount`. Le score d'intention est calculé via `calculateIntentScore` à partir des signaux : qualité du référent (LinkedIn 25 pts, autre social 10 pts, direct 5 pts), niveau d'engagement basé sur `time_on_site` (5+ min 25 pts, 3+ min 20 pts, 1+ min 15 pts, 3+ sec 10 pts), heures de travail (+5 pts si visite en heures de bureau selon le pays), visites répétées (10 pts, 15 si 3+ visites ou retour sous 7 jours), réseau corporate (+5 pts). Les signaux `viewedPricing`, `viewedSecurity`, `viewedIntegrations` sont prévus mais restent à false sans intégration SaaS. Le résultat est stocké dans `intent_scores` avec `link_event_id`, `tracked_link_id`, `company_inference_id` (si une inférence a été créée), `session_intent_score`, `time_on_site_seconds`, `is_working_hours`, `is_repeat_visit`, `visit_count`, `days_since_first_visit`, et `intent_signals` (JSON détaillé). Noter que l'enrichissement est déclenché immédiatement après l'insert du clic, donc `time_on_site` est souvent encore null au moment du calcul ; le champ est mis à jour plus tard par l'API 3sec, mais le score d'intention n'est pas recalculé.

---

## 4. Clics qualifiés : définition et calcul

Les clics qualifiés sont un sous-ensemble des clics bruts, filtré pour obtenir des métriques plus fiables. La fonction SQL `get_qualified_clicks(collab_id)` dans `analytics-qualified-clicks.sql` implémente ce filtrage en trois étapes. D'abord, elle exclut les bots via `is_bot_user_agent(user_agent)` qui détecte les patterns courants : bot, crawler, spider, scraper, headless, phantom, selenium, webdriver, curl, wget, python-requests, go-http-client, Googlebot, Bingbot, etc. Ensuite, elle applique la règle des 3 secondes : seuls les clics où `time_on_site >= 3` sont retenus (temps passé sur la page de redirection Naano). Une exception : les clics très récents (moins de 5 minutes) avec `time_on_site` null sont inclus, car l'API 3sec peut ne pas avoir encore mis à jour le champ. Les anciens clics (avant la règle des 3 sec) avec `time_on_site` null sont exclus. Enfin, elle déduplique par IP et heure : `DISTINCT ON (ip_address, DATE_TRUNC('hour', occurred_at))` en gardant le clic le plus récent dans chaque fenêtre d'une heure, par collaboration. Le compte final est le nombre de lignes après ces trois filtres.

Cette métrique est utilisée dans `get_collaboration_analytics` qui retourne aussi les impressions totales, les clics totaux, le nombre de leads (table `leads` avec status validated ou billed), le coût total des leads, et les économies vs LinkedIn calculées comme `(qualified_clicks * 8) - total_lead_cost` (8€ par clic qualifié comme référence LinkedIn Ads). Les leads sont créés uniquement pour les clics qualifiés (via `create_qualified_lead_from_event` appelée par l'API 3sec), donc le nombre de leads correspond au nombre de clics qualifiés (sous réserve de crédits SaaS disponibles). La déduplication pour la création de leads est par (lien tracké, IP, heure) : au plus un lead par combinaison. Il n'existe pas de champ `is_qualified` sur les `link_events` : la qualification est calculée dynamiquement par `get_qualified_clicks` ou par `create_qualified_lead_from_event` selon le même algorithme.

---

## 5. Données exposées aux SaaS : Lead Feed et export CSV

Le Lead Feed affiché aux SaaS n'est pas la table `leads` (facturation) mais les `link_events` de type click enrichis avec une `company_inference`. La fonction `getCollaborationLeads` interroge `link_events` avec jointures sur `company_inferences` et `intent_scores`, filtrée par `event_type = 'click'` et `tracked_link_id` de la collaboration. Les événements sans inférence entreprise (ou avec confiance < 30%) sont exclus côté mapping. Seuls les clics ayant une `company_inference` avec `inferred_company_name` sont affichés.

Pour chaque entreprise unique, une RPC `get_company_aggregated_intent` est appelée pour obtenir l'intention agrégée au niveau entreprise : score moyen, score max, nombre total de sessions, visites répétées, tendance (increasing, stable, decreasing), date de dernière haute intention.

Les données retournées pour chaque lead incluent : l'identifiant de l'événement, la date/heure, le créateur source, et trois couches. Couche 1 (session) : session_id, IP, pays, ville, type d'appareil, OS, navigateur, référent, temps sur site, type de réseau. Couche 2 (entreprise) : nom, domaine, industrie, taille, localisation, score de confiance, raisons de confiance, état d'attribution (inferred/confirmed), organisation ASN, flag ambiguïté, dates de création et confirmation, et intention agrégée au niveau entreprise. Couche 3 (intention) : score de session, visite répétée, nombre de visites, pages vues (tarifs, sécurité, intégrations), signaux détaillés, poids de récence, jours depuis la session.

L'export CSV généré côté client reprend ces champs en anglais : date, time, creator, IP (masked), country, city, device type, OS, browser, network type, **lead type** (Corporate / Individual / Mobile / Hosting / VPN / Proxy / Unknown), time on site, referrer, session ID, company name, domain, industry, company size, company location, confidence score, effective confidence, attribution state, confidence reasons, ASN organization, ambiguous, enrichment date, confirmation date, intent scores, trend, repeat visit, visit count, working hours, recency weight, days since session, viewed pricing/security/integrations, company aggregates. L'IP est masquée (dernier octet en .x) pour la conformité RGPD.

---

## 6. Flux de données résumé

Le flux complet est le suivant : le créateur partage le lien `/c/[hash]` ; au clic, la requête arrive sur Naano qui extrait IP, user-agent, referrer, crée ou récupère le session_id, récupère la géo via ip-api, insère un `link_event` de type click, déclenche l'enrichissement asynchrone, affiche la page de redirection 3 secondes pendant laquelle le script appelle l'API 3sec pour mettre à jour `time_on_site`, puis redirige vers le site SaaS avec UTM et naano_session. L'enrichissement parse le user-agent, appelle IPinfo/ip-api pour l'entreprise, crée une `company_inference` si confiance >= 30%, calcule l'intention à partir des signaux disponibles, et stocke le tout dans `intent_scores`. Lorsque l'API 3sec reçoit `timeOnSite >= 3`, elle appelle `create_qualified_lead_from_event` : seuls les clics qualifiés (non bot, temps >= 3 sec, pas de doublon par lien tracké + IP + heure) créent un lead, déduisent un crédit et paient le créateur. Les clics qualifiés sont calculés via `get_qualified_clicks` (même logique : anti-bot, règle des 3 sec, déduplication par IP + heure par collaboration). Le Lead Feed agrège les clics avec inférence entreprise et les expose au SaaS avec les trois couches de données, et l'export CSV permet une extraction complète pour CRM ou analyse.

---

## 7. Architecture : exigences et conformité

### 7.1 Enrichissement : cache et résilience

**Cache IP → entreprise (24h)** : Non implémenté. Prévoir un cache Redis ou Vercel KV avec TTL 24h pour éviter les appels répétés à IPinfo/ip-api sur les mêmes IP. Réduirait la latence et les risques de rate limit.

**Retry et backoff** : Implémenté dans `company-enrichment.ts`. La fonction `fetchWithRetry` réessaie jusqu'à 2 fois avec backoff exponentiel (500ms base pour IPinfo, 300ms pour ip-api) en cas de 429 (rate limit) ou 5xx. Les erreurs réseau déclenchent aussi un retry.

**Redirection jamais bloquée** : Confirmé. L'enrichissement est déclenché en fire-and-forget via `fetch()` sans await. La réponse HTML est renvoyée immédiatement. En cas d'échec total de l'enrichissement, la redirection et le clic restent enregistrés.

### 7.2 Score d'intention

**Calcul unique** : Le score est calculé une seule fois lors de l'appel à `/api/track/enrich`, juste après l'insert du clic. Il n'est pas recalculé quand `time_on_site` est mis à jour par l'API 3sec (problème de timing : l'enrichissement s'exécute avant la mise à jour).

**Évolution prévue** : Prévoir un re-scoring incrémental quand de nouveaux signaux arrivent (ex. `time_on_site` mis à jour, pages vues côté SaaS).

### 7.3 Fraude et signaux de faible confiance

**Détection** : Hosting, VPN, proxy et mobile ISP sont détectés par IPinfo/ip-api et stockés dans `company_inferences` (`is_hosting`, `is_vpn`, `is_proxy`, `is_mobile_isp`) et sur `link_events` (`network_type`). Le flag `is_ambiguous` est à true pour hosting, VPN et proxy.

**Downgrade de confiance** : Pour hosting/VPN/proxy, `confidence_score` reste à 0 ou on ne crée pas de `company_inference` (seuil 30%). Ces types de réseau sont exclus du Lead Feed car sans inférence entreprise fiable.

**Leads qualifiés uniquement (Option A)** : Implémenté. Les leads sont créés uniquement pour les clics qualifiés via `create_qualified_lead_from_event` (critères : non bot, `time_on_site >= 3`, dédoublonnage par lien tracké + IP + heure). La table `leads` a un champ `link_event_id` pour lier chaque lead au clic source. La fonction retourne `NULL` (sans erreur) lorsque le clic est filtré (bot, temps &lt; 3 sec, doublon IP/heure) ou lorsque le SaaS n'a plus de crédits. Nécessiterait un enrichissement synchrone avant la création du lead, ou un traitement asynchrone pour annuler les leads issus d’IP hosting.

### 7.4 Fallback JavaScript (règle des 3 secondes)

**Noscript** : Implémenté. Un bloc `<noscript>` avec `<meta http-equiv="refresh" content="0;url=...">` redirige immédiatement si JavaScript est désactivé ou bloqué. Dans ce cas, `time_on_site` reste null (équivalent à &lt;3 secondes).

### 7.5 RGPD et masquage des IP

**Export CSV** : Les IP sont masquées via `maskIPAddress()` (dernier octet en .x pour IPv4, dernier segment en x pour IPv6).

**Stockage interne** : L’IP complète est conservée dans `link_events` pour la prévention de fraude, la déduplication et la classification entreprise.

**Inférence entreprise** : Probabiliste uniquement (ASN, organisation). Aucune donnée personnelle (nom, email, etc.) n’est inférée ni stockée.

### 7.6 Politique de rétention

**Non implémentée.** Politique cible : `link_events` 12 mois, `company_inferences` 24 mois, `intent_scores` alignés sur la durée de vie des `link_events`. À mettre en place via pg_cron ou jobs périodiques.

### 7.7 Monitoring et fiabilité

**Logs** : Les erreurs d’enrichissement sont loguées via `console.error`. Sentry (ou équivalent) n’est pas encore intégré.

**Redirection** : La redirection réussit même si l’enrichissement ou le scoring échouent. Le handler principal ne dépend pas du résultat de l’enrichissement.

### 7.8 Navigation privée

**Comportement** : Le système repose sur IP, headers HTTP et la page de redirection Naano. L’enrichissement et l’identification entreprise n’utilisent pas les cookies. La répétition des visites est basée sur l’IP, pas sur le cookie. En navigation privée : IP, user-agent, referrer et géolocalisation fonctionnent. Le cookie `naano_attribution` peut ne pas persister entre sessions, mais un nouveau `session_id` est généré à chaque visite. L’enrichissement et le Lead Feed restent opérationnels.
