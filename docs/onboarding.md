## **📋 La Philosophie Naano**

On ne se contente pas de demander un SIRET, on aide à le créer. On affiche clairement que **devenir Pro prend 15 minutes** et qu'on est là pour tenir la main du créateur via un appel dédié.

---

## **🏗️ Détail du Tunnel d'Onboarding**

### **Étape 1 : Création de compte (Standard)**

* **Action :** Email \+ Mot de passe (ou Google Auth).  
* **Vérification :** Email de confirmation standard pour valider la boîte.

### **Étape 2 : Profil & Identification (Le formulaire détaillé)**

Le créateur remplit ses informations de base. Ces données serviront à la génération automatique des contrats.

* **Infos Personnelles :** Nom, Prénom, Date de naissance, Adresse postale complète (Ville, CP, Pays).  
* **Infos Sociales :** lien linkedin, thématique (Tech, Business, Lifestyle), optionnel présentation optionnel derniers posts linkedin  
* **Choix du Statut :**  
  * **Option A : Particulier (Occasionnel)** \-\> "Je débute sans SIRET. Retraits limités à 500 € cumulés."  
  * **Option B : Professionnel (Freelance/AE)** \-\> "J'ai déjà un SIRET. Retraits illimités."

### **Étape 3 : Le "Pont" vers le statut Pro**

Si l'utilisateur choisit **"Particulier"**, une section d'aide apparaît immédiatement :

💡 **Le saviez-vous ?** Créer votre micro-entreprise prend exactement **15 minutes** et vous permet de générer des revenus illimités sur Naano.

* Section avec fichier pdf qui explique les démarches à suivre.  
* \[ \] **Besoin d'aide ?** \[Réserver un call de 10 min avec un expert Naano\] *(Lien Calendly)*.

### **Étape 4 : Signature du Mandat**

Génération d'un contrat dynamique basé sur les infos de l'étape 2\.

* **Case à cocher 1 :** "J'accepte le Mandat d'Apport d'Affaires Digital."  
* **Case à cocher 2 :** "Je certifie sur l'honneur l'exactitude des informations fournies." 

(je rédigerai ces docs)

---

## **⚙️ Logique de Blocage & Support**

### **1\. Seuil de Retrait (Wallet Logic)**

* **Cumul \< 500 € :** Le bouton "Demander un virement" est actif.  
* **Cumul \>= 500 € :** \* Le bouton de retrait se grise.  
  * **Message UI :** "Félicitations pour vos 500 € de gains \! Pour débloquer votre virement et continuer l'aventure, vous devez renseigner un SIRET. Pas de panique, on peut vous aider à le créer en 15 min."  
  * **CTA :** "Prendre RDV pour créer mon Auto-Entreprise" \+ "Saisir mon SIRET".

### **2\. Validation SIRET**

* Champ de saisie   
* Dès validation, le compte bascule en **Statut Pro** et débloque tous les fonds en attente.

---

## **💻 Spécifications Techniques**

* **Database :** Ajouter un champ `siret_number` (string).  
* **Backend :** Script de vérification du cumul des gains `total_withdrawable` vs `total_earned`.  
* **Frontend :** \* Bandeau persistant pour les particuliers arrivant à 400 € de gains : *"Plus que 100 € avant le palier Pro. Anticipez votre création d'entreprise \!"*  
  * Intégration d'un widget Calendly directement dans le dashboard.

---

## **✅ Critères d'Acceptation (QA)**

* \[ \] Un utilisateur peut s'inscrire et commencer à gagner de l'argent en moins de 2 minutes.  
* \[ \] Le formulaire d'adresse est obligatoire pour générer le contrat légal.  
* \[ \] Le lien de réservation de call est visible pour tous les profils "Particulier".  
* \[ \] Le retrait est techniquement impossible au-delà de 500 € sans modification du profil vers "Pro".  
* \[ \] L'UI affiche clairement la simplicité de la démarche (Mention "15 minutes").  
+ Limite de 25 posts par an   
+ Sans validation pour les posts

