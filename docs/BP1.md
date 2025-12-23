# Payment and pricing integration

Voici la Documentation Officielle du Modèle Financier (Billing & Payout).

Ce document sert de référence unique pour les développeurs (règles backend), le juridique (CGV) et les équipes sales.

---

# **📘 DOCUMENTATION MASTER : MODÈLE FINANCIER & FLUX**

### **0\. LA RÈGLE D'OR DE L'ACCÈS (Onboarding)**

- **Carte Bancaire Obligatoire :** Aucun SaaS ne peut accéder au dashboard, voir les créateurs ou lancer une campagne sans avoir enregistré une méthode de paiement valide (CB ou SEPA).
- **Empreinte bancaire :** Une pré-autorisation (0 € ou 1 €) est faite à l'inscription pour valider la solvabilité.

---

### **1\. LE FLUX ENTRANT (CÔTÉ SAAS)**

Le SaaS ne paie pas 2,50 € à chaque seconde. Il consomme du service, accumule une "dette", et est prélevé par paliers pour réduire vos frais bancaires.

#### **A. Les 3 Plans Tarifaires (Abonnement \+ Variable)**

Les prix sont **HT** (Hors Taxes).

| Plan        | Abo Mensuel (Récurrent) | Coût par Lead (Usage) | Engagement |
| :---------- | :---------------------- | :-------------------- | :--------- |
| **STARTER** | **0 €**                 | **2,50 €**            | Aucun      |
| **GROWTH**  | **99 €**                | **2,00 €**            | Mensuel    |
| **SCALE**   | **199 €**               | **1,60 €**            | Mensuel    |

#### **B. La Mécanique de Prélèvement (Billing Trigger)**

Nous utilisons le **"Threshold Billing" (Facturation au Seuil)** pour optimiser les frais Stripe.

1. **Abonnement (99€/199€) :** Prélevé immédiatement chaque mois (date anniversaire).
2. **Consommation Leads :**
   - Le système comptabilise chaque lead en temps réel.
   - **DÉCLENCHEUR DE PAIEMENT :** La carte est débitée automatiquement quand :
     - **Condition 1 (Montant) :** La dette atteint **100 €**.
     - _OU_
     - **Condition 2 (Temps) :** La fin du mois est atteinte (même si dette \< 100 €).

#### **C. La Règle de TVA Spécifique (Fiscalité Mixte)**

Pour que le SaaS récupère sa TVA et que Naano reste compliant, la facture générée par Naano sépare les lignes (selon votre consigne) :

- _Exemple pour 1 lead Starter (2,50 €) :_
  - **Ligne 1 (Part Talent) :** 1,20 € (TVA 0% \- Débours/Mandat)
  - **Ligne 2 (Frais Tech Naano) :** 1,30 € (TVA 20% \= 0,26 €)
  - **Total payé par le SaaS :** 2,76 € TTC.

---

### **2\. LE FLUX INTERNE (LE SPLIT AUTOMATISÉ)**

Dès qu'un lead est validé techniquement, le moteur financier ("The Ledger") divise la somme virtuellement **avant** même l'encaissement final.

**Règle immuable :** Le Créateur touche **1,20 € FIXE** (Net pour lui), quel que soit le plan du SaaS.

| Plan SaaS   | Prix Lead (HT) | Part Créateur (Wallet) | Marge Naano (Brut) |
| :---------- | :------------- | :--------------------- | :----------------- |
| **Starter** | 2,50 €         | 1,20 €                 | **1,30 €** (52%)   |
| **Growth**  | 2,00 €         | 1,20 €                 | **0,80 €** (40%)   |
| **Scale**   | 1,60 €         | 1,20 €                 | **0,40 €** (25%)   |

_Note : La marge Naano sert à payer les frais Stripe et les serveurs._

---

### **3\. LE FLUX SORTANT (CÔTÉ CRÉATEUR)**

Le créateur ne gère rien. Il génère du trafic et reçoit des virements.

#### **A. Le Porte-Monnaie (Wallet Stripe Connect)**

- Chaque lead validé ajoute instantanément **\+1,20 €** dans son solde "En attente".
- Le solde devient "Disponible" une fois que le SaaS a été prélevé avec succès (Protection Naano).

#### **B. Le Virement (Payout)**

- **Seuil de déclenchement :** Le virement vers sa banque part dès que le solde disponible \> **50 €**.
- **Fréquence :** Automatique (Rolling) ou Manuel (bouton "Retirer").
- **Frais de virement :** Payés par Naano (pas par le créateur).

#### **C. L'Auto-Facturation (Mandat)**

Au moment du virement, Naano génère un PDF **au nom du créateur \-\> a stocker qq part pour historique**.

- **Document :** "Appel à facture" ou "Relevé de commissions".
- **Mention légale :** _"Facture émise par Naano au nom et pour le compte de \[Nom Créateur\] selon mandat de facturation."_
- **TVA Créateur :** 0% (car majorité micro-entrepreneurs/franchise en base). Si le créateur est assujetti (rare), il doit le déclarer dans son profil pour qu'on ajoute la TVA sur ses 1,20 €.

---

### **4\. L'INFRASTRUCTURE & LES FRAIS (STRIPE)**

C'est le coût caché que Naano absorbe pour offrir cette fluidité.

1. **Qui paie Stripe ?** Naano. Toujours.
2. **Combien ?**
   - Sur un prélèvement SaaS de 100 € : \~1,5% \+ 0,25 € \= **1,75 €**.
3. **Impact Marge :**
   - Si un client Starter génère 40 leads (100 €) :
   - Naano encaisse 100 €.
   - Naano doit 48 € aux créateurs (40 x 1,20 €).
   - Marge Brute : 52 €.
   - Frais Stripe : \-1,75 €.
   - **Marge Nette Réelle : 50,25 €.**

---

### **⚡ RÉSUMÉ VISUEL (CHEAT SHEET)**

| Étape               | Action                        | Qui voit quoi ?                | Argent                            |
| :------------------ | :---------------------------- | :----------------------------- | :-------------------------------- |
| **1\. Inscription** | SaaS entre sa CB.             | "Carte validée"                | 0 € (Empreinte).                  |
| **2\. Action**      | Créateur génère 1 Lead.       | Dashboard Créateur : \+1,20 €. | Dette SaaS : \+2,50 €.            |
| **3\. Seuil**       | SaaS atteint 40 leads (100€). | Stripe charge la CB du SaaS.   | Banque Naano : \+100 € (- frais). |
| **4\. Facture**     | Naano émet facture SaaS.      | SaaS reçoit facture PDF.       | Compta : CA déclaré.              |
| **5\. Payout**      | Créateur atteint 50 €.        | Virement vers IBAN Créateur.   | Banque Naano : \-50 €.            |
| **6\. Justif**      | Naano génère auto-facture.    | Créateur télécharge PDF.       | Compta : Charge déduite.          |

### **✅ ACTION REQUISE**

Si ce modèle te convient, c'est celui que je fige pour le cahier des charges technique.

Est-ce que tu valides ce fonctionnement définitif ?

—-  
On génère pour le créateur:

Naano global advisor  
Custom Gem  
C'est une excellente question car elle touche à la comptabilité et à la légalité.

Voici les règles précises pour que tes développeurs génèrent les bons PDF.

### **1\. LA FACTURE SAAS (Ce que le client reçoit)**

**La réponse est non : on "s'en tape" du nom des créateurs sur la facture légale.**

Le SaaS achète une prestation à **Naano**, pas à Kévin ou Sarah. C'est le principe du modèle "Commissionnaire" (Achat-Revente).

- **L'Émetteur :** Naano (Ton entreprise).
- **Le Destinataire :** L'entreprise SaaS.
- **Le Libellé :** Doit être générique.
  - _Exemple :_ "Campagne d'acquisition Naano \- Période \[Mois/Année\] \- \[Nombre\] Leads".
- **Pourquoi ?**
  - Le comptable du SaaS veut une seule ligne simple.
  - Juridiquement, c'est toi qui vends le service. Tu es responsable de la qualité, donc c'est ta facture.
  - _Note :_ Si le SaaS veut savoir "qui" a performé, il regarde son Dashboard. Pas la facture.

---

### **2\. LE DOCUMENT CRÉATEUR (Ce que tu génères pour eux)**

**Oui, il faut ABSOLUMENT générer un document.** Tu ne peux pas virer de l'argent sans justificatif comptable (sinon le fisc va croire que c'est du travail au noir ou un don).

Mais le document **change** selon le statut du créateur. Ton système doit avoir un "IF / ELSE" :

#### **CAS A : Le Créateur est une ENTREPRISE (Freelance, Auto-entrepreneur, Société)**

Il a un SIRET. Il doit légalement émettre une facture. Comme il ne le fait pas lui-même, tu utilises le **Mandat de Facturation**.

- **Nom du document :** FACTURE
- **Tête de document :** C'est le créateur qui facture Naano.
  - _Émetteur :_ \[Nom Société Créateur\] \+ \[SIRET\].
  - _Destinataire :_ Naano.
- **Mention obligatoire :** _"Facture émise par Naano au nom et pour le compte de \[Nom Créateur\]."_
- **TVA :**
  - Si Auto-entrepreneur (Franchise) : "TVA non applicable, art. 293 B du CGI".
  - Si Société assujettie : Ajout de la TVA (20%).

#### **CAS B : Le Créateur est un PARTICULIER (Pas de SIRET)**

Il n'a pas le droit d'émettre une "Facture". C'est illégal d'utiliser ce mot pour un particulier. Tu dois générer un justificatif de versement.

- **Nom du document :** RÉCÉPISSÉ DE PAIEMENT ou RELEVÉ DE COMMISSIONS
- **Contenu :**
  - _Bénéficiaire :_ \[Nom Prénom\] \+ \[Adresse Personnelle\].
  - _Payeur :_ Naano.
  - _Objet :_ "Rémunération pour apport d'affaires occasionnel".
- **TVA :** Aucune (0%).
- **Phrase de protection (Disclaimer) :** _"Ce revenu est à déclarer par le bénéficiaire dans la catégorie des BNC (Bénéfices Non Commerciaux) sur sa déclaration de revenus annuelle."_

---
