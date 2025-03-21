# Cahier des Charges

## 1. Description des tâches et opérations effectuées

J'ai choisi de développer une application pour recenser les plats du jour des restaurants autour de moi selon le rayon defini.

Je penses faire une architecture client/serveur, avec un backend en node.js et odm mongoose. J'aurais donc besoin d' une base de donnée mongo db (que nous créérons via container docker) et le front end en flutter.


### Identification des besoins :

- **Interface Utilisateur (UI)** :
  - Accès aux restaurants et plats du jour sans connexion (mode offline).
  
- **Interface Professionnelle (Pro)** :
  - Enregistrement des plats avec prix, photos, descriptions, et options diététiques.
  - Programmation des plats pour la semaine.
  - Notifications pour l'enregistrement des plats.
  - Gestion des stocks disponibles.
  
- **Géolocalisation** :
  - Autorisation de l'utilisateur pour la géolocalisation.
  - Affichage des restaurants ayant enregistré un plat avant 12h00.
  - Affichage des restaurants dans un rayon déterminé.
  
- **Options de tri** :
  - Tri par distance, prix, et options diététiques.
  
- **Réinitialisation quotidienne** :
  - Remise à zéro des données des plats chaque matin.

---

## 2. Système Design et Fonctionnalités Principales

### Interface Utilisateur (User Interface)

- Affichage des restaurants et des plats du jour sans connexion (mode offline).
- Interface conviviale et intuitive pour une navigation facile.

### Interface Professionnelle (Pro/Restaurant Interface)

- Enregistrement des plats avec détails complets (prix, photos, description, options diététiques).
- Programmation des plats pour la semaine à l'avance.
- Notifications pour rappeler aux restaurateurs d'enregistrer leurs plats du jour.
- Gestion des stocks disponibles.

### Géolocalisation

- Autorisation de l'utilisateur pour la géolocalisation.
- Affichage des restaurants dans un rayon déterminé autour de la position de l'utilisateur.
- Mise à jour en temps réel des restaurants disponibles.

### Filtres et Tri

- Tri par distance, prix, régimes alimentaires (sans gluten, sans lactose, végétarien, etc.).
- Filtres par type de cuisine (italienne, japonaise, etc.) et par note/avis des utilisateurs.

### Mise à Jour Quotidienne

- Réinitialisation des données des plats du jour chaque matin.
- Notification des utilisateurs concernant les nouveaux plats disponibles.