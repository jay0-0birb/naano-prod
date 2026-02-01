# Explication du système de tracking Konex — Guide client

*Document conceptuel pour présenter le fonctionnement du tracking à vos clients.*

---

## 1. Comment fonctionne le tracking des liens ?

### Le principe

Chaque créateur reçoit un **lien unique** lorsqu’il collabore avec une entreprise SaaS. Ce lien :

- **Redirige** le visiteur vers le site du SaaS
- **Enregistre** chaque clic avec des informations utiles
- **Permet** d’attribuer le trafic au bon créateur

### Le parcours du visiteur

1. **Le créateur partage le lien**  
   Il publie le lien (ex. `konex.app/c/abc123`) sur LinkedIn, dans sa bio, en message privé, etc.

2. **Le visiteur clique**  
   Il arrive d’abord sur Konex, qui enregistre le clic.

3. **Redirection immédiate**  
   Le visiteur est redirigé vers le site du SaaS, sans interruption visible.

4. **Attribution**  
   Le SaaS sait que ce visiteur vient du créateur grâce aux paramètres UTM ajoutés à l’URL.

### Ce qui est enregistré à chaque clic

- **Date et heure**
- **Origine** (LinkedIn, message direct, etc.)
- **Localisation** (pays, ville)
- **Appareil** (mobile, desktop, navigateur)
- **Temps passé sur le site** (si le SaaS a installé le script de suivi)

---

## 2. Les « clics qualifiés » — Qu’est-ce que c’est ?

### Pourquoi filtrer les clics ?

Tous les clics ne sont pas pertinents. Certains viennent de :

- **Robots** (crawlers, scrapers)
- **Doublons** (même personne qui clique plusieurs fois)
- **Clics accidentels** (rebond immédiat)

Les **clics qualifiés** sont ceux qui restent après ces filtres.

### Comment sont calculés les clics qualifiés ?

1. **Exclusion des robots**  
   Les clics identifiés comme provenant de bots (Googlebot, outils automatisés, etc.) sont exclus.

2. **Dédoublonnage par IP**  
   Si la même adresse IP clique plusieurs fois dans la même heure, seul le premier clic compte. Cela évite de gonfler les chiffres avec des clics répétés.

3. **Règle des 3 secondes** (optionnelle)  
   Si le SaaS installe un petit script sur son site, on peut ne compter que les visites où le visiteur reste au moins 3 secondes. Cela filtre les rebonds immédiats.

### À quoi servent les clics qualifiés ?

- **Métriques fiables** pour mesurer la performance des créateurs
- **Comparaison** avec les coûts publicitaires (ex. LinkedIn Ads à ~8 €/clic)
- **Calcul des économies** réalisées par rapport à la publicité payante

---

## 3. Les leads enrichis — Le « Lead Feed »

### Qu’est-ce qu’un lead enrichi ?

Un **lead enrichi** est un clic qui a été **identifié** : on a pu associer le visiteur à une entreprise (nom, secteur, taille, localisation, etc.).

### Comment l’identification fonctionne-t-elle ?

À partir de l’adresse IP et d’autres données techniques, le système tente d’identifier l’entreprise du visiteur. Par exemple :

- **Réseau d’entreprise** : IP typique d’une entreprise
- **Confiance** : score de fiabilité de l’identification (ex. 30 %, 70 %, 100 %)
- **État** : inféré (automatique) ou confirmé (vérifié par le SaaS)

### Ce que vous voyez dans le Lead Feed

Pour chaque lead enrichi, vous avez accès à :

- **Informations de session** : date, heure, pays, ville, appareil, temps sur le site
- **Entreprise identifiée** : nom, domaine, secteur, taille, localisation
- **Score de confiance** : fiabilité de l’identification
- **Score d’intention** : probabilité d’intérêt (visites répétées, pages vues, etc.)

### Pourquoi c’est utile

- **Priorisation** : identifier les prospects les plus pertinents
- **Qualification** : filtrer par secteur, taille d’entreprise, intention
- **Suivi** : voir quelles entreprises visitent votre site via les créateurs

---

## 4. L’export CSV — Contenu et usage

### Qu’est-ce que le CSV ?

Le CSV est un **export de tous vos leads enrichis** au format tableur (Excel, Google Sheets). Il contient une ligne par lead avec toutes les informations disponibles.

### Colonnes principales du CSV

#### Informations de base
- **Date** et **Heure** du clic
- **Créateur** à l’origine du trafic

#### Session (couche 1)
- **Pays** et **Ville**
- **Type d’appareil** (mobile, desktop)
- **OS** et **Navigateur**
- **Temps sur site** (en secondes)
- **Référent** (LinkedIn, direct, etc.)

#### Entreprise (couche 2)
- **Nom entreprise**
- **Domaine** (ex. acme.com)
- **Industrie**
- **Taille** (petite, moyenne, grande)
- **Localisation**
- **Score de confiance** (fiabilité de l’identification)
- **État d’attribution** (inféré ou confirmé)

#### Intention (couche 3)
- **Score intention** de la session
- **Score intention entreprise** (moyen et max)
- **Tendance** (en hausse, stable, en baisse)
- **Visite répétée** (oui/non)
- **Nombre de visites**
- **Heures de travail** (clic pendant les heures de bureau)
- **Pages vues** (tarifs, sécurité, intégrations)

### À quoi sert l’export CSV ?

- **Intégration CRM** : importer les leads dans Salesforce, HubSpot, etc.
- **Analyse** : tableaux croisés, graphiques, rapports
- **Équipe commerciale** : liste de prospects à contacter
- **Reporting** : partage avec la direction ou les investisseurs

---

## 5. Résumé visuel du flux

```
Créateur partage le lien
         ↓
Visiteur clique → Konex enregistre le clic
         ↓
Redirection vers le site SaaS (avec UTM)
         ↓
Si script installé : mesure du temps sur site (règle des 3 sec)
         ↓
Enrichissement : identification de l’entreprise (IP, etc.)
         ↓
Lead enrichi visible dans le Lead Feed
         ↓
Export CSV disponible pour votre CRM
```

---

## 6. Points clés à retenir

| Concept | En bref |
|--------|---------|
| **Lien de tracking** | Lien unique par créateur qui redirige vers votre site et enregistre chaque clic |
| **Clics qualifiés** | Clics réels, sans bots ni doublons, pour des métriques fiables |
| **Leads enrichis** | Clics avec identification d’entreprise (nom, secteur, intention) |
| **Export CSV** | Liste complète de vos leads avec toutes les données pour CRM et analyse |

---

*Document préparé pour les présentations clients — version conceptuelle, sans détails techniques.*
