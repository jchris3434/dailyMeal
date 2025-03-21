# DailyMeal  

Application pour recenser les plats du jour des restaurants à proximité.  

## Architecture  

- **Backend** : Node.js avec Express et Mongoose ODM  
- **Base de données** : MongoDB (via Docker)  
- **Frontend** : Flutter (en développement)  

## Prérequis  

- Node.js (v14 ou supérieur)  
- Docker et Docker Compose  
- Git  

## Installation  

1. Cloner le dépôt :  
```bash  
git clone <url-du-depot>  
cd dailyMeal  
```

2. Installer les dépendances 

```bash
npm install
```

3. Configurer les variables d'environnement

Créer un fichier `.env` à la racine du projet (un exemple est fourni dans le fichier `.env`)

4. Démarrer MongoDB avec Docker

```bash
docker-compose up -d
```

## Développement

Pour démarrer le serveur en mode développement :

```bash
npm run dev
```

## Tests

Pour exécuter les tests :

```bash
npm test
```

Pour exécuter les tests en mode watch :

```bash
npm run test:watch
```

## Structure du projet

```
/dailyMeal
  /.env                  # Variables d'environnement
  /docker-compose.yml    # Configuration Docker
  /package.json          # Dépendances et scripts
  /jest.config.js        # Configuration des tests
  /src
    /index.js            # Point d'entrée de l'application
    /config/             # Configuration (DB, etc.)
    /controllers/        # Contrôleurs
    /models/             # Modèles Mongoose
    /routes/             # Routes API
    /tests/              # Tests
```

## Méthodologie

Ce projet suit une méthodologie TDD (Test Driven Development). Pour chaque fonctionnalité :

1. Écrire d'abord les tests
2. Implémenter la fonctionnalité
3. Valider que les tests passent
4. Refactoriser si nécessaire

## Licence

ISC
