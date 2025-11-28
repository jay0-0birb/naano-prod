# Description du produit initial

**📋 PRODUCT SPECIFICATION DOCUMENT (PSD) - Le code du MVP développé sur cursor peut servir de base du produit aussi.**

**Version** : 1.1

**Date** : 28 Novembre 2025

**Status** : Ready for Development

---

## **1. EXECUTIVE SUMMARY**

marketplace long terme où :

- Les **SaaS** recrutent des créateurs LinkedIn comme "Ambassadeurs".
- Les **Créateurs** monétisent leur audience en devenant ambassadeurs de produits qu'ils aiment.

**2. PRODUCT OVERVIEW & VISION**

## **2.1 Le Problème**

- **Créateurs** : Ont une audience LinkedIn (2k-10k followers) mais ne gagnent rien dessus.
- **SaaS** : Veulent du lead gen authentique mais :
    - LinkedIn Ads = cher (€5-10 CPL).
    - Influenceurs pro = inaccessibles.
    - Pas de solution middle-ground.

## **3. FEATURE LIST & PRIORITÉS**

## **PRIORITY 1 : Core (Absolument nécessaire)**

| **Feature** | **Description** | **Criticality** |
| --- | --- | --- |
| **Profil Créateur** | Bio, lien LinkedIn, stats, taux d’engagements, secteurs, "Best Posts". | MUST |
| **Profil SaaS** | Logo, pitch, lien site, "Who we look for", Media Pack. | MUST |
| **Marketplace/Discovery** | Liste des SaaS. Créateur peut voir détails + postuler. Le saas accède aussi à une market place des ambasadeur | MUST |
| **Candidature "Ambassadeur"** | Créateur postule → SaaS accepte/refuse → Relation active. | MUST |
| **Espace de Travail Partagé** | Chat privé + Historique posts + Lien tracké. | MUST |
| **Lien Tracké Unique** | Génération auto d'URL unique par couple (SaaS, Créateur). | MUST |
| **Upload Post** | Créateur colle URL de son post → Validation. | MUST |
| **Dashboard Créateur** | Vue stats : Clics générés, posts validés, gains. | MUST |
| **Dashboard SaaS** | Vue stats : Ambassadeurs actifs, clics, historique posts. | MUST |
| **Subscription Limits** | Free = 3 ambassadeurs, Pro = Illimité. Blocage si limit atteint. | MUST |
| **Academy** | Section éducative avec guides + templates. | MUST |

## **PRIORITY 2 : Nice-to-Have (MVP + 2-4 semaines)**

| **Feature** | **Description** |
| --- | --- |
| **Messagerie Avancée** | Chat temps réel (vs simple forum). |
| **Auto-tagging** | Suggestion auto d'ambassadeurs pour un SaaS. |
| **Validation post** | Le createut peut nous demander gratuitement de valider le post |

## **PRIORITY 3 : Pas pour le MVP**

| **Feature** | **Raison** |
| --- | --- |
| **Campagnes Ponctuelles** | Complexe. Post-MVP (Phase 2). |
| **IA Post Generator (API-based)** | Intégration API simple. |
| **Matching Algo Avancé** | Trop lourd.. |
| **Co-création de Contenu** | Webinaires, témoignages, cas clients. Phase 3. |

---

## **5. DETAILED USER FLOWS**

## **5.1 FLOW : Créateur Onboarding**

**Titre** : "Deviens Ambassadeur et Gagne"

1. [SIGNUP - Choix Rôle]
    - Je suis créateur
    - Je suis SaaS
        
        → Créateur choisi
        
2. [FORM - Info Créateur]
    
    Champs :
    
    - Prénom / Nom
    - Email
    - Password
    - Lien LinkedIn (ex: linkedin.com/in/sofia-x)
    - Secteurs (Checkboxes : Sales, Marketing, ProductMgmt, HR, Tech)
    - Bio courte (200 char)
    - Photo profil (Upload)
3. Validation :
    - Vérif que lien LinkedIn valide (Regex basique)
    - Au moins 1 secteur sélectionné
4. Action : "Créer mon Compte"
5. [POST-SIGNUP - Confirmation Email]
    
    "Bienvenue Sofia ! Ton profil est en attente de validation (24-48h)"
    
    Lien : "Voir ma page profil"
    
6. [ADMIN CHECK]
    
    Admin voit profil, le score (qualité heuristique).
    
    Si OK → "Approuver"
    
    Si Spam → "Rejeter"
    
7. [CRÉATEUR ACTIVÉ]
    
    Email : "Tu es validé ! Explore les SaaS qui te cherchent."
    
    Bouton : "Voir la Marketplace"
    
- Validation des profils nécessaire - fonctionnalité pour prendre un calle de découverte à l’inscription

---

## **5.2 FLOW : SaaS Onboarding**

**Titre** : "Trouve tes Ambassadeurs"

1. [SIGNUP - Choix Rôle]
    - Je suis créateur
    - Je suis SaaS
        
        → SaaS choisi
        
2. [FORM - Info SaaS]
    
    Champs :
    
    - Nom de l'entreprise
    - Email professionnel
    - Password
    - Lien site web
    - Description (500 char)
    - Logo (Upload) : Carré, min 200x200
    - Lien Media Kit (Upload ou Google Drive)
3. Validation :
    - Email entreprise obligatoire (domain.com, pas gmail)
    - Logo téléchargé
4. Action : "Créer mon Compte"
5. [AJOUTER CARTE BANCAIRE]
    
    "Pour activer tes ambassadeurs, ajoute une CB Stripe"
    
    (Pas besoin de paiement immédiat, juste token Stripe)
    
    Plan par défaut : Free (3 ambassadeurs max)
    
6. [EMAIL CONFIRMATION]
    
    "Tu es inscrit ! Commence à chercher tes ambassadeurs."
    
    Bouton : "Voir les Ambassadeurs"
    
7. fonctionnalité pour prendre un calle de découverte à l’inscription

---

## **5.3 FLOW : Créateur Postule pour Ambassadeur**

**Titre** : "Rejoindre un SAAS"

[CRÉATEUR LOGGED IN]

1. [MARKETPLACE]
    
    Liste de tous les SaaS actifs.
    
    Filtres : Secteur, Statut (Qui recrute).
    
    Chaque carte :
    
    - Logo SaaS
    - Nom
    - "Postuler"
2. [CLIC SUR SAAS]
    
    Page détail :
    
    - Logo large
    - Pitch (500 char)
    - "Who we look for"
    - Button : "Devenir Ambassadeur"
3. [MODAL CANDIDATURE]
    
    Message optionnel (100 char) : "Pourquoi tu veux être ambassadeur ?"
    
    Button : "Envoyer Candidature"
    
4. [CONFIRMATION]
    
    Message : "Candidature envoyée ! [NomSaaS] y répondra dans 24-48h."
    
5. [SaaS Reçoit Notification]
    
    Dashboard SaaS → Onglet "Candidatures"
    
    Card : Sofia (Stats + Bio + Link vers Profil)
    
    Buttons : "Accepter" / "Refuser"
    
6. [Si Accepté]
    
    Créateur reçoit email : "[NomSaaS] t'a accepté comme ambassadeur !"
    
    Button : "Accéder à l'Espace de Travail"
    
    Status passe à "Active"
    
7. [Si Refusé]
    
    Créateur reçoit email : "Merci pour ta candidature, [NomSaaS] ne peut pas continuer cette fois."
    

---

## **5.4 FLOW : Créateur Utilise Espace de Travail**

**Titre** : "Mon Espace [NomSaaS]"

[CRÉATEUR LOGGED IN]

1. [DASHBOARD CRÉATEUR]
    
    Onglet : "Mes Partenariats"
    
    Liste :
    
    - Logo SaaS + Nom
    - "Ambassadeur depuis le 12/11"
    - Button : "Accéder à l'Espace"
2. [CLIC "Accéder à l'Espace"]
    
    → Espace Travail Partagé
    
3. [ESPACE TRAVAIL - SECTION 1 : MON LIEN TRACKÉ]
    
    En GROS :
    
    "📎 TON LIEN UNIQUE (COPIE-LE PARTOUT)"
    
    [https://tracking.relayn.com/c/sofia-hubspot-001](https://tracking.relayn.com/c/sofia-hubspot-001) [COPIER]
    
    "Utilise ce lien quand tu parles de [SaaS].
    
    Dans tes commentaires, ta bio, tes DMs.
    
4. [SECTION 2 : DÉCLARER UN POST]
    
    "Tu as publié ? Colle le lien ici :"
    
    [Champ URL : [https://linkedin.com/feed/update/](https://linkedin.com/feed/update/)...]
    
    Button : "ENVOYER"
    
    Validation Regex : Doit commencer par "linkedin.com/posts/" ou "linkedin.com/feed/update/"
    
5. [APRÈS ENVOI]
    
    Email envoyée au SaaS : "Sofia a publié ! [Lien]" reagissez à son post pour maximisezr l’engagement
    
6. [SECTION 3 : HISTORIQUE & STATS] si possible
    
    Tableau :
    
    - Post du 24/11 (Validé) | 124 Clics | 12 Leads | €150 (commission)
    - Post du 10/11 (Validé) | 89 Clics | 8 Leads | €100
7. Total mois : 3 posts, 213 clics, €250
8. [SECTION 4 : RESSOURCES]
    
    Button : "Télécharger Logo [NomSaaS]"
    
    Button : "Voir Guidelines"
    
    Link : "Lien Media Kit complet"
    
9. [SECTION 5 : CHAT (Nice-to-Have)]
    
    Messages simples avec SaaS pour Q&A.
    

---

## **5.5 FLOW : SaaS Gère ses Ambassadeurs**

**Titre** : "Mon Dashboard"

[SAAS LOGGED IN]

1. [DASHBOARD - VUE OVERVIEW]
    
    KPIs Globaux :
    
    - Ambassadeurs Actifs : 3 / 3 (Plan Free)
    - Clics Ce Mois : 523
    - Leads Générés : 42
    - CPL Moyen : €28
2. [ONGLET "CANDIDATURES"]
    
    Liste des créateurs qui postulent :
    
    - Sofia | 3.2k followers, 3.5% engagement, Sales
    - Marc | 5.1k followers, 2.8% engagement, Marketing
    - Lena | 4.3k followers, 4.1% engagement, Sales
3. Buttons : "Accepter" / "Voir Profil" / "Refuser"
4. [ONGLET "MES AMBASSADEURS"]
    
    Liste active :
    
    - Sofia | Depuis 15j | 245 clics | 15 leads | €450 commission due
    - Marc | Depuis 8j | 278 clics | 22 leads | €550 commission due
5. Button par ambassadeur : "Voir Espace" / "Arrêter Partenariat"
6. [CLIC "Voir Espace"]
    
    → Espace Travail Partagé (View SaaS)
    
7. [ESPACE TRAVAIL - VUE SAAS]
    
    SECTION 1 : STATS DE CET AMBASSADEUR
    
    - Clics : 245
    - Leads : 15
    - Conversion : 6%
    - Earning Dû : €450
8. SECTION 2 : HISTORIQUE POSTS
    - Post du 24/11 | 124 clics | [Voir sur LinkedIn]
    - Post du 10/11 | 89 clics | [Voir sur LinkedIn]
9. SECTION 3 : CHAT
    
    Messages avec Sofia
    
10. [ONGLET "ANALYTICS"]
    
    Graphe simple : Clics par jour (7 derniers jours)
    
    Table : Top 3 ambassadeurs par clics
    
11. [ONGLET "SETTINGS"]
    - Plan actuel : Free (Passer à Pro ?)
    - Infos Entreprise : Editable
    - Stripe Status : "CB ajoutée le 15/11"

---

## **5.6 FLOW : Academy (Section Éducation)**

**Titre** : "Apprendre à Réussir"

[CRÉATEUR OU SAAS LOGGED IN]

1. [MENU PRINCIPAL]
    
    Lien : "Academy" (en top nav ou side nav)
    
2. [PAGE ACADEMY]
    
    Hero Section :
    
    "Maîtrise le Personal Branding B2B"
    
    "Des guides, des templates, des checklists pour réussir"
    
3. [MODULES CRÉATEUR]
    
    (Sections expandables)
    
    Module 1 : "Les Bases du Post Viral"
    
    - Video YT embeddée : "Comment structurer ton hook"
    - Texte : Explications + exemples
4. Module 2 : "Templates Prêts à l'Emploi"
    - Carousel 1 : "Template Comparatif"
        
        [COPIER TEXTE]
        
    - Carousel 2 : "Template Storytelling"
        
        [COPIER TEXTE]
        
5. Module 3 : "Checklist Avant Post"
    - J'ai inclus mon lien tracké en commentaire ?
    - J'ai une image de bonne qualité ?
    - Mon premier commentaire est prêt ?
6. Module 4 : "FAQ"
    - Q: Combien de temps avant paiement ?
    - A: ...
    - Q: Puis-je vendre le même produit partout ?
    - A: Oui, max 3 SaaS en même temps.
7. [MODULES SAAS]
    
    Module 1 : "Comment Recruter des Ambassadeurs"
    
    - Texte guide
8. Module 2 : "Mesurer le ROI"
    - Chart exemple
9. Module 3 : "Templates de Brief"
    - Texte copiable
10. [EMBED NOTION OPTIONNEL]
    
    Si tu veux une structure plus riche :
    
    Page Academy affiche une embed Notion (lien iframe)
    
    Pour faciliter maintenance du contenu post-launch
    

---

## **6. BUSINESS RULES & CONSTRAINTS**

## **6.1 Limites Abonnement (Critical Business Logic)**

**FREE Plan** :

- Max 3 ambassadeurs actifs simultanés.
- Impossible d'accepter un 4ème.
- Pop-up : "Upgrade to Pro to work with unlimited creators".

**PRO Plan** :

- Ambassadeurs illimités.
- Pricing : €99/mois (à confirmer).

**Créateurs** :

- Junior level : Max 3 SaaS en même temps.
- Expert level : Illimité (validation manuelle).

## **6.2 Tracking & Revenue Calculation**

**Le Lien Tracké** :

- Format : [https://tracking.relayn.com/c/[CREATOR_ID]-[SAAS_ID]-[UNIQUE_HASH](https://tracking.relayn.com/c/%5BCREATOR_ID%5D-%5BSAAS_ID%5D-%5BUNIQUE_HASH)]
- Redirects vers : [https://saas-website.com/?utm_source=relayn&utm_content=[CREATOR_ID](https://saas-website.com/?utm_source=relayn&utm_content=%5BCREATOR_ID)]
- Chaque interaction loggée en base

**Métriques Trackées** (Au choix du SaaS) :

1. **Impressions** : Nombre de fois où lien est vu.
2. **Clics** : Nombre de clics sur le lien.
3. **CA Généré** : CA direct attribué via cookie de 30 jours.

**Commission Relayn** :

- 15% prélevé sur les gains du créateur.
- 15% prélevé en sus sur le SaaS (si performance-based).
- Exemple : SaaS paye créateur €100 → Relayn prend €15 (créateur) + €15 (SaaS).

---

## **7. SUBSCRIPTION TIERS & MONETIZATION**

## **7.1 Pricing Tiers à voir**

## **7.2 Revenu Model**

1. **Subscription** : Pro plan (€99/mois × N SaaS).
2. **Commission** : 15% créateur + 15% SaaS sur leads/clics.
3. **Credits** (Future, Phase 2) : SaaS achète boosts supplémentaires.

---

## **8. THE TRACKING SYSTEM (CRITICAL)**

## **8.2 Options de Tracking (SaaS Choisit)**

**Option 1 : Tracking Impressions**

- Facile, avec les vues linkedin
- Paiement : €X par 1000 impressions.

**Option 2 : Tracking Clics**

- Créateur utilise lien tracké.
- Chaque clic redirects via notre domaine (lnk.relayn.com).
- Paiement : €X par clic (ou per 100 clics).

**Option 3 : Tracking CA Généré**

- SaaS installe cookie Relayn (ou pixel). (si qqn achète le saas en ayant utilsié le lien deux semaines à l’avance ça vient de l’influ)
- On track conversions directes : "Sofia a généré 15 signups".
- Paiement : €X par signup (ou % du CA).

---

## **9. ACADEMY SECTION (LEARNING PATH)**

- Page HTML avec sections expandables (simplifié pour MVP).
- Embed Notion (pour contenu riche post-launch).