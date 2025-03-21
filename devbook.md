# DailyMeal - Devbook

Ce document détaille les étapes de développement du projet DailyMeal, une application pour recenser les plats du jour des restaurants à proximité. Nous suivrons une méthodologie TDD (Test Driven Development) en commençant par le backend.

## Architecture du Projet

- **Backend**: Node.js avec Express et Mongoose ODM
- **Base de données**: MongoDB (via Docker)
- **Frontend**: Flutter

## Phase 1: Mise en place de l'environnement de développement

- [x] Initialiser le projet Node.js
- [x] Configurer Docker et créer un container MongoDB
- [x] Configurer l'environnement de test (Jest/Mocha)
- [x] Mettre en place le système de versionnage (Git)
- [x] Créer la structure de base du projet

## Phase 2: Développement du Backend (TDD)

### Modèles de données

- [x] Définir et tester le modèle Restaurant
  - [x] Écrire les tests pour le modèle Restaurant
  - [x] Implémenter le modèle Restaurant
  - [x] Valider les tests

- [x] Définir et tester le modèle Plat
  - [x] Écrire les tests pour le modèle Plat
  - [x] Implémenter le modèle Plat
  - [x] Valider les tests

- [x] Définir et tester le modèle Utilisateur
  - [x] Écrire les tests pour le modèle Utilisateur
  - [x] Implémenter le modèle Utilisateur
  - [x] Valider les tests

### API RESTful

- [x] Développer et tester les routes pour les Restaurants
  - [x] Écrire les tests pour CRUD Restaurant
  - [x] Implémenter les routes CRUD Restaurant
  - [x] Valider les tests

- [ ] Développer et tester les routes pour les Plats
  - [ ] Écrire les tests pour CRUD Plat
  - [ ] Implémenter les routes CRUD Plat
  - [ ] Valider les tests

- [ ] Développer et tester les routes pour les Utilisateurs
  - [ ] Écrire les tests pour CRUD Utilisateur
  - [ ] Implémenter les routes CRUD Utilisateur
  - [ ] Valider les tests

### Fonctionnalités spécifiques

- [ ] Implémenter et tester la géolocalisation
  - [ ] Écrire les tests pour la recherche par rayon
  - [ ] Implémenter la recherche par rayon
  - [ ] Valider les tests

- [ ] Implémenter et tester les filtres et tris
  - [ ] Écrire les tests pour les filtres (distance, prix, options diététiques)
  - [ ] Implémenter les filtres
  - [ ] Valider les tests

- [ ] Implémenter et tester la réinitialisation quotidienne
  - [ ] Écrire les tests pour la réinitialisation automatique
  - [ ] Implémenter la tâche cron pour la réinitialisation
  - [ ] Valider les tests

- [ ] Implémenter et tester la programmation hebdomadaire des plats
  - [ ] Écrire les tests pour la programmation
  - [ ] Implémenter la fonctionnalité de programmation
  - [ ] Valider les tests

- [ ] Implémenter et tester la gestion des stocks
  - [ ] Écrire les tests pour la gestion des stocks
  - [ ] Implémenter la fonctionnalité de gestion des stocks
  - [ ] Valider les tests

## Phase 3: Authentification et Autorisation

- [ ] Implémenter et tester l'authentification
  - [ ] Écrire les tests pour l'authentification
  - [ ] Implémenter JWT ou autre système d'authentification
  - [ ] Valider les tests

- [ ] Implémenter et tester les rôles et permissions
  - [ ] Écrire les tests pour les rôles (utilisateur, restaurateur)
  - [ ] Implémenter la gestion des rôles
  - [ ] Valider les tests

## Phase 4: Système de Notification

- [ ] Implémenter et tester les notifications pour les restaurateurs
  - [ ] Écrire les tests pour les notifications
  - [ ] Implémenter le système de notifications
  - [ ] Valider les tests

## Phase 5: Documentation et Tests d'Intégration

- [ ] Documenter l'API (Swagger/OpenAPI)
- [ ] Écrire des tests d'intégration
- [ ] Optimiser les performances

## Phase 6: Déploiement et CI/CD

- [ ] Configurer l'environnement de production
- [ ] Mettre en place un pipeline CI/CD
- [ ] Déployer la version beta

## Phase 7: Développement Frontend (Flutter)

- [ ] Mettre en place l'environnement Flutter
- [ ] Développer l'UI utilisateur
- [ ] Développer l'UI restaurateur
- [ ] Implémenter la géolocalisation côté client
- [ ] Implémenter le mode offline
- [ ] Tests et débogage

## Phase 8: Tests Utilisateurs et Finalisation

- [ ] Réaliser des tests utilisateurs
- [ ] Corriger les bugs et améliorer l'UX
- [ ] Préparer le lancement

## Notes et Ressources

- Environnement de développement: Kali Linux (WSL)
- Chemin du projet: `/home/jc34/2024/dailyMeal`
- Méthodologie: TDD (Test Driven Development)
