l**🎟️ EPIC : Écosystème "Naano Pro" & Programme de Fidélité Créateurs**

**Priorité :** 🔥 Critique

**Épique :** Croissance & Rétention Créateurs

**Assigné à :** \[Fullstack Lead / Admin Tooling\]

## **📋 Présentation du Modèle**

Naano introduit un modèle à deux vitesses pour les créateurs afin de valoriser l'expertise et l'engagement envers la plateforme. Le système doit permettre une transition fluide vers le statut **Pro**, soit par abonnement payant, soit par reconnaissance de contribution (Membres Fondateurs ou Promotionnels).

---

## **👤 User Stories**

* **En tant que Créateur :** Je veux souscrire à l'offre Pro pour passer de **0,90 € à 1,10 €** de gain par clic qualifié.  
* **En tant que Membre Fondateur :** Je veux bénéficier du statut Pro gratuitement à vie en reconnaissance de mon arrivée précoce. Je pense qu’on devrait mettre 1 an/6 mois gratuit (Alexis)  
* **En tant qu'Admin Naano :** Je veux pouvoir offrir l'accès Pro à un créateur ayant réalisé un post promotionnel via un simple toggle dans l'interface admin.  
* **En tant que SaaS :** Je veux voir les créateurs "Pro" en priorité lors de mes recherches pour garantir la qualité de mes campagnes.

---

## **⚙️ Spécifications Fonctionnelles**

### **1\. Structure des Comptes Créateurs**

| Avantages | Créateur Standard | Créateur Pro |
| :---- | :---- | :---- |
| **Paiement par clic** | 0,90 € | 1,10 € |
| **Abonnement** | Gratuit | 25 € / mois ou Offert (mettre en avant offert 2 mois si poste promotionnel à propos de naano (offre renouvelable) |
| **Visibilité** | Standard | Prioritaire & Badge "Pro" |
| **Accès Academy** | Inclus (Formations ROI) | Inclus (Formations ROI) |
| **Communauté** | Accès au groupe d'entraide | Accès au groupe d'entraide |

### 

### **2\. Logique d'Accès "Pro Offert"**

L'interface doit gérer trois types d'activation pour le statut Pro :

1. **Stripe Subscription :** Activé automatiquement par paiement mensuel.  
2. **Founding Member Tag :** Activé manuellement pour les 50 premiers créateurs (accès à vie).  
3. **Promo Reward :** Activé par l'admin pour une durée déterminée (ex: 1 mois) suite à un post promotionnel vérifié.

### **3\. Hiérarchie de la Marketplace**

* **Boost de visibilité :** Les profils Pro doivent être remontés par l'algorithme de recommandation SaaS. (pas obligatoire)  
* **Badge UI :** Un badge "Pro" distinctif sur le profil créateur. 

---

## **💻 Spécifications Techniques**

### **1\. Backend (Logiciel & Base de données)**

* **Table Creators :** Ajouter is\_pro (boolean), pro\_status\_source (enum: 'PAYMENT', 'FOUNDING', 'PROMO'), et pro\_expiration\_date (datetime).  
* **Moteur de Payout :**  
  * Vérification systématique du statut is\_pro lors de la validation du "Qualified Click" (\> 3 secondes).  
  * Attribution du gain : **0,90 €** ou **1,10 €**.  
* **Outil Admin :** Création d'un endpoint POST /admin/grant-pro-access pour activer manuellement le statut.

### **2\. Frontend (Dashboard Créateur & SaaS)**

* **Dashboard Créateur :**  
  * *Si Standard :* Bannière d'upgrade vers Pro (25 €/mois).  
  * *Si Pro (Payé) :* Affichage "Membre Pro \- Renouvellement le \[Date\]".  
  * *Si Pro (Offert) :* Affichage "Membre Pro (Offert) 🎁".  
* **Marketplace SaaS :** Tri par is\_pro DESC, puis par score de performance.

---

## **✅ Critères d'Acceptation (QA)**

* \[ \] Un créateur standard gagne 0,90 € par clic qualifié.  
* \[ \] Un créateur identifié comme "Founding Member" gagne 1,10 dès activation manuelle par l'admin.  
* \[ \] Tous les créateurs ont accès aux ressources de formation Naano.

