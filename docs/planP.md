#  **Implémentation du Modèle "Performance-Only" (SaaS Credits & Creator Tiers)**

Status : 📝 To Do

Lead : Product Manager / CTO

Complexité : ◼️◼️◼️◼️◻️ (High)

## **1\. Résumé Exécutif**

Nous basculons Naano d'un modèle d'abonnement SaaS classique vers un modèle à la performance basé sur des **Crédits Prépayés**.

* **Le SaaS** s'abonne à un volume mensuel de crédits (1 crédit \= 1 clic qualifié) avec un prix dégressif granulaire.  
* **Le Créateur** est rémunéré au clic validé, avec un tarif différencié selon son statut (Standard vs Pro).  
* **La Marketplace** affiche en temps réel le budget restant du SaaS pour que les créateurs sachent s'ils peuvent poster (principe du "Global Pool").

## **👤 User Stories**

1. **En tant que Client SaaS**, je veux choisir un pack de crédits (ex: 500 clics) qui se renouvelle automatiquement chaque mois, avec report des crédits non utilisés (Roll-over), pour piloter mon budget.  
2. **En tant que Créateur**, en visitant le profil d'une campagne, je veux voir :  
   * Le nombre exact de **crédits restants** (le pot).  
   * Le nombre de **jours avant le renouvellement** (la recharge).  
   * *Ceci afin de ne pas poster si le budget est à 10 crédits et que la recharge est dans 15 jours.*  
3. **En tant que Système**, je dois refuser de payer tout clic survenant après que le solde `wallet_credits` a atteint 0\.

Au niveau UI un sldier based pricing serait interessant.

---

## **2\. Spécifications : Côté SaaS (Achat & Budget)**

### **A. Le Slider d'Abonnement "Granulaire"**

Le client définit son volume de crédits mensuels via un slider.

* **Step (Pas) :** 50 crédits.  
* **Min / Max :** 100 à 5000+ crédits.  
* **Logique Tarifaire :** Le prix unitaire s'applique à l'ensemble du volume (Volume Pricing).

| Volume (Clics) | Prix Unitaire | Coût Total SaaS |
| :---- | :---- | :---- |
| **50** | **2,60 €** | **130 €** |
| **250** | **2,55 €** | **637,50 €** |
| **500** | **2,45 €** | **1 225,00 €** |
| **750** | **2,35 €** | **1 762,50 €** |
| **1 000** | **2,25 €** | **2 250,00 €** |
| **1 250** | **2,20 €** | **2 750,00 €** |
| **1 500** | **2,15 €** | **3 225,00 €** |
| **1 750** | **2,10 €** | **3 675,00 €** |
| **2 000** | **2,05 €** | **4 100,00 €** |
| **2 500** | **1,95 €** | **4 875,00 €** |
| **3 000** | **1,85 €** | **5 550,00 €** |
| **4 000** | **1,75 €** | **7 000,00 €** |
| **5 000 \+** | **1,60 €** | **8 000,00 €** |

**B. Gestion du Wallet (Crédits)**

* **Facturation :** Mensuelle récurrente (Stripe Subscription).  
* **Roll-over :** Les crédits non consommés sont reportés au mois suivant.  
  * *Formule :* Solde\_Mois\_Suivant \= Solde\_Restant \+ Nouveaux\_Crédits\_Abo

---

## **3\. Spécifications : Côté Créateur (Transparence & Payout)**

### **A. Transparencia du Budget (Risk Management)**

Sur la fiche de mission du SaaS, le créateur voit le "Pot Commun" en temps réel.

* **Jauge de Santé :**  
  * 🟢 **Safe :** \> 200 crédits.  
  * 🟠 **Risky :** \< 50 crédits (Alerte visuelle).  
  * 🔴 **Empty :** 0 crédit (Action bloquée).  
* **Info Renouvellement :** Afficher *"Se renouvelle dans X jours"* (Calculé par rapport à la date de facturation du SaaS).  
* **Message UX :** *"Attention, budget partagé. Premier arrivé, premier servi."*

### **B. Rémunération Différenciée (Tiered Payout)**

Le montant crédité au créateur pour un clic validé dépend de son statut :

* **Statut STANDARD (Gratuit) :** Touche **0,90 €** / clic.  
* **Statut PRO (Abo payant) :** Touche **1,10 €** / clic

---

**6\. Liste des Tâches Techniques (Sub-tasks)**

1. **\[Backend\] Database Update :** Ajouter wallet\_credits (SaaS) et subscription\_tier (Creator).  
2. **\[Backend\] Stripe Logic :** Configurer les produits Stripe avec "Transform Quantity" pour gérer les paliers de prix SaaS.  
3. **\[Frontend\] SaaS Slider :** Développer le slider React avec step=100 et affichage dynamique du prix unitaire.  
4. **\[Frontend\] SaaS Budget Widget :** Créer le composant visuel (Jauge \+ Date renouvellement) visible par les créateurs.  
5. **\[Core\] Payout Engine :** Implémenter la logique IF Pro THEN 1.10 ELSE 0.90.  
6. **\[Core\] Hard Cap :** Implémenter le "Kill Switch" qui empêche le débit quand le solde SaaS est à 0\.

---

## **7\. Critères d'Acceptation (QA)**

* \[ \] Un SaaS peut acheter précisément 1 200 crédits et payer 2 640 € (2,20€/u).  
* \[ \] Un Créateur voit "Il reste 10 crédits" sur le profil du SaaS.  
* \[ \] Un Créateur Standard reçoit 0,90€ sur son wallet après un clic qualifié.  
* \[ \] Un Créateur Pro reçoit 1,10€ sur son wallet après un clic qualifié.  
* \[ \] Si le solde SaaS tombe à 0, le clic suivant est redirigé mais ne génère aucun mouvement d'argent. (le créateur était au courant)

