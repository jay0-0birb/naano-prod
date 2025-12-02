// Academy content for creators and SaaS companies

export interface AcademyModule {
  id: string;
  title: string;
  description: string;
  icon: string;
  items: AcademyItem[];
}

export interface AcademyItem {
  id: string;
  type: 'video' | 'text' | 'template' | 'checklist' | 'faq';
  title: string;
  content: string;
  videoUrl?: string;
  copyable?: boolean;
}

// Creator modules
export const creatorModules: AcademyModule[] = [
  {
    id: 'viral-posts',
    title: 'Les Bases du Post Viral',
    description: 'Apprends à créer des posts LinkedIn qui captent l\'attention',
    icon: '🚀',
    items: [
      {
        id: 'hook-structure',
        type: 'video',
        title: 'Comment structurer ton hook',
        content: 'Le hook est la première ligne de ton post. C\'est ce qui détermine si les gens vont lire la suite ou non. Un bon hook doit être court, intrigant et donner envie d\'en savoir plus.',
        videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', // Replace with actual video
      },
      {
        id: 'post-structure',
        type: 'text',
        title: 'La structure parfaite d\'un post',
        content: `**1. Le Hook (1-2 lignes)**
Accroche ton lecteur avec une phrase choc, une question, ou une statistique surprenante.

**2. Le Contexte (2-3 lignes)**
Pose le problème ou la situation. Fais en sorte que ton audience se reconnaisse.

**3. Le Corps (5-10 lignes)**
Développe ton idée principale. Utilise des bullet points pour faciliter la lecture.

**4. La Conclusion (1-2 lignes)**
Termine par un appel à l'action ou une question pour engager la conversation.

**5. Le Premier Commentaire**
Ajoute ton lien tracké et une question pour booster l'engagement.`,
      },
    ],
  },
  {
    id: 'templates',
    title: 'Templates Prêts à l\'Emploi',
    description: 'Des modèles de posts à copier et adapter',
    icon: '📝',
    items: [
      {
        id: 'template-comparatif',
        type: 'template',
        title: 'Template Comparatif',
        content: `[HOOK CHOC]
J'ai testé [PRODUIT A] vs [PRODUIT B] pendant 30 jours.

Voici ce que j'ai découvert 👇

[PRODUIT A] :
✅ Avantage 1
✅ Avantage 2
❌ Inconvénient

[PRODUIT B] :
✅ Avantage 1
❌ Inconvénient 1
❌ Inconvénient 2

Mon verdict ?

[PRODUIT B] a changé ma façon de [ACTIVITÉ].

Tu veux tester ? Lien en commentaire 🔗`,
        copyable: true,
      },
      {
        id: 'template-storytelling',
        type: 'template',
        title: 'Template Storytelling',
        content: `Il y a 6 mois, j'étais [SITUATION NÉGATIVE].

Je passais [TEMPS] à [ACTIVITÉ PÉNIBLE].
Je [FRUSTRATION].
Je [AUTRE PROBLÈME].

Puis j'ai découvert [SOLUTION].

En [DURÉE], j'ai :
→ [RÉSULTAT 1]
→ [RÉSULTAT 2]
→ [RÉSULTAT 3]

Le meilleur ? [BÉNÉFICE PRINCIPAL].

Si tu veux le même résultat, teste [PRODUIT].

(Lien en commentaire)`,
        copyable: true,
      },
      {
        id: 'template-liste',
        type: 'template',
        title: 'Template Liste',
        content: `[NOMBRE] outils que j'utilise tous les jours en [DOMAINE] :

1️⃣ [OUTIL 1]
→ Pour [USAGE]
→ Ce que j'aime : [AVANTAGE]

2️⃣ [OUTIL 2]
→ Pour [USAGE]
→ Ce que j'aime : [AVANTAGE]

3️⃣ [OUTIL 3]
→ Pour [USAGE]
→ Ce que j'aime : [AVANTAGE]

Mon préféré ? [OUTIL X] parce que [RAISON].

Tu utilises lesquels ? 👇`,
        copyable: true,
      },
    ],
  },
  {
    id: 'checklist',
    title: 'Checklist Avant de Poster',
    description: 'Vérifie tout avant de publier',
    icon: '✅',
    items: [
      {
        id: 'pre-post-checklist',
        type: 'checklist',
        title: 'Ma checklist pré-publication',
        content: `□ Mon hook est accrocheur (moins de 2 lignes)
□ Mon post fait entre 800 et 1500 caractères
□ J'ai utilisé des emojis avec modération
□ J'ai des sauts de ligne pour aérer
□ Mon appel à l'action est clair
□ Mon premier commentaire est prêt avec le lien tracké
□ J'ai une image/visuel de qualité (si applicable)
□ J'ai relu pour les fautes d'orthographe
□ Je poste à une heure optimale (8h-9h ou 17h-18h)
□ Je suis prêt à répondre aux commentaires dans l'heure`,
      },
    ],
  },
  {
    id: 'faq-creator',
    title: 'FAQ Créateurs',
    description: 'Réponses aux questions fréquentes',
    icon: '❓',
    items: [
      {
        id: 'faq-1',
        type: 'faq',
        title: 'Combien de temps avant d\'être payé ?',
        content: 'Les paiements sont effectués mensuellement, le 15 de chaque mois, pour les commissions du mois précédent. Tu dois avoir atteint un minimum de 50€ de commissions pour recevoir un paiement.',
      },
      {
        id: 'faq-2',
        type: 'faq',
        title: 'Puis-je être ambassadeur de plusieurs SaaS ?',
        content: 'Oui ! Tu peux être ambassadeur de jusqu\'à 3 SaaS en même temps. Assure-toi simplement qu\'ils ne sont pas en concurrence directe pour garder ta crédibilité.',
      },
      {
        id: 'faq-3',
        type: 'faq',
        title: 'Comment fonctionne le lien tracké ?',
        content: 'Ton lien tracké est unique. Quand quelqu\'un clique dessus et achète dans les 30 jours, tu reçois ta commission. Le cookie de 30 jours permet d\'attribuer la vente même si l\'achat n\'est pas immédiat.',
      },
      {
        id: 'faq-4',
        type: 'faq',
        title: 'Que se passe-t-il si mon post est refusé ?',
        content: 'Si ton post est refusé, tu recevras un message du SaaS expliquant pourquoi. Tu pourras alors modifier ton post et le resoumettre. La plupart des refus sont dus à des erreurs mineures facilement corrigeables.',
      },
    ],
  },
];

// SaaS modules
export const saasModules: AcademyModule[] = [
  {
    id: 'recruit-ambassadors',
    title: 'Comment Recruter des Ambassadeurs',
    description: 'Attire les meilleurs créateurs pour ta marque',
    icon: '🎯',
    items: [
      {
        id: 'profile-optimization',
        type: 'text',
        title: 'Optimise ton profil SaaS',
        content: `Pour attirer les meilleurs créateurs, ton profil doit être impeccable :

**1. Logo professionnel**
Un logo de qualité inspire confiance.

**2. Description claire**
Explique en 2-3 phrases ce que fait ton produit et pourquoi il est unique.

**3. Commission attractive**
Les créateurs comparent. Une commission de 15-20% est standard, 25%+ attire les meilleurs.

**4. "Who we look for"**
Décris le profil idéal d'ambassadeur. Ça aide les créateurs à se projeter.

**5. Ressources disponibles**
Mentionne si tu fournis des visuels, des briefs, ou un support dédié.`,
      },
      {
        id: 'outreach-tips',
        type: 'text',
        title: 'Approcher les créateurs',
        content: `Ne reste pas passif ! Voici comment approcher les créateurs :

**1. Personnalise ton message**
Mentionne un de leurs posts récents. Montre que tu connais leur travail.

**2. Explique le "Why"**
Pourquoi eux spécifiquement ? Qu'est-ce qui te plaît dans leur audience ?

**3. Sois transparent**
Commission, attentes, durée de collaboration. Pas de surprise.

**4. Facilite la décision**
Propose un essai gratuit de ton produit. Ils doivent l'aimer pour en parler.`,
      },
    ],
  },
  {
    id: 'measure-roi',
    title: 'Mesurer le ROI',
    description: 'Comprends et optimise tes résultats',
    icon: '📊',
    items: [
      {
        id: 'key-metrics',
        type: 'text',
        title: 'Les métriques clés',
        content: `**Impressions**
Nombre de fois où le lien a été vu (previews LinkedIn, etc.)
→ Indicateur de visibilité

**Clics**
Nombre de personnes qui ont cliqué sur le lien
→ Indicateur d'intérêt

**Taux de clic (CTR)**
Clics / Impressions × 100
→ Un bon CTR est > 2%

**Conversions**
Nombre de ventes attribuées
→ L'indicateur final

**CA Généré**
Chiffre d'affaires total des conversions
→ Ce qui compte vraiment

**ROI**
(CA Généré - Commissions payées) / Commissions payées × 100
→ Un bon ROI est > 300%`,
      },
      {
        id: 'optimization',
        type: 'text',
        title: 'Optimiser tes résultats',
        content: `**Si peu de clics :**
→ Le créateur n'a peut-être pas la bonne audience
→ Le message n'est pas assez convaincant
→ Solution : Brief plus détaillé, autre créateur

**Si clics mais pas de conversions :**
→ Ta landing page ne convertit pas
→ Le prix est un frein
→ Solution : Optimise ta page, propose un essai gratuit

**Si bon ROI :**
→ Augmente la collaboration avec ce créateur
→ Cherche des profils similaires
→ Propose une exclusivité`,
      },
    ],
  },
  {
    id: 'brief-templates',
    title: 'Templates de Brief',
    description: 'Des briefs prêts à envoyer à tes ambassadeurs',
    icon: '📋',
    items: [
      {
        id: 'brief-standard',
        type: 'template',
        title: 'Brief Standard',
        content: `## Brief Ambassadeur - [NOM DU PRODUIT]

### À propos de nous
[2-3 phrases sur ton produit et sa valeur]

### Ton audience cible
[Décris qui tu veux atteindre]

### Messages clés
- [Point 1 à mettre en avant]
- [Point 2 à mettre en avant]
- [Point 3 à mettre en avant]

### À éviter
- [Ce qu'il ne faut PAS dire]
- [Concurrents à ne pas mentionner]

### Ressources
- Lien vers les visuels : [URL]
- Landing page : [URL]
- FAQ produit : [URL]

### Timeline
- Date souhaitée de publication : [DATE]
- Deadline pour validation : [DATE]

### Contact
Pour toute question : [EMAIL/CHAT]`,
        copyable: true,
      },
    ],
  },
  {
    id: 'faq-saas',
    title: 'FAQ SaaS',
    description: 'Réponses aux questions fréquentes',
    icon: '❓',
    items: [
      {
        id: 'faq-saas-1',
        type: 'faq',
        title: 'Combien d\'ambassadeurs puis-je avoir ?',
        content: 'En plan Free, tu peux avoir jusqu\'à 3 ambassadeurs actifs. En plan Pro, c\'est illimité ! Tu peux upgrader à tout moment depuis les paramètres.',
      },
      {
        id: 'faq-saas-2',
        type: 'faq',
        title: 'Comment fonctionne le tracking des ventes ?',
        content: 'Chaque ambassadeur a un lien unique. Quand quelqu\'un clique et achète dans les 30 jours, la vente est attribuée automatiquement. Tu peux voir les stats en temps réel dans le dashboard.',
      },
      {
        id: 'faq-saas-3',
        type: 'faq',
        title: 'Quand dois-je payer les commissions ?',
        content: 'Les commissions sont calculées mensuellement. Tu recevras une facture le 1er de chaque mois pour les commissions du mois précédent, payable sous 15 jours.',
      },
    ],
  },
];

