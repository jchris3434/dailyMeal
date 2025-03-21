# DailyMeal

Application pour recenser les plats du jour des restaurants u00e0 proximitu00e9.

## Architecture

- **Backend**: Node.js avec Express et Mongoose ODM
- **Base de donnu00e9es**: MongoDB (via Docker)
- **Frontend**: Flutter (en du00e9veloppement)

## Pru00e9requis

- Node.js (v14 ou supu00e9rieur)
- Docker et Docker Compose
- Git

## Installation

1. Cloner le du00e9pu00f4t

```bash
git clone <url-du-depot>
cd dailyMeal
```

2. Installer les du00e9pendances

```bash
npm install
```

3. Configurer les variables d'environnement

Cru00e9er un fichier `.env` u00e0 la racine du projet (un exemple est fourni dans le fichier `.env`)

4. Du00e9marrer MongoDB avec Docker

```bash
docker-compose up -d
```

## Du00e9veloppement

Pour du00e9marrer le serveur en mode du00e9veloppement :

```bash
npm run dev
```

## Tests

Pour exu00e9cuter les tests :

```bash
npm test
```

Pour exu00e9cuter les tests en mode watch :

```bash
npm run test:watch
```

## Structure du projet

```
/dailyMeal
  /.env                  # Variables d'environnement
  /docker-compose.yml    # Configuration Docker
  /package.json          # Du00e9pendances et scripts
  /jest.config.js        # Configuration des tests
  /src
    /index.js            # Point d'entru00e9e de l'application
    /config/             # Configuration (DB, etc.)
    /controllers/        # Contru00f4leurs
    /models/             # Modu00e8les Mongoose
    /routes/             # Routes API
    /tests/              # Tests
```

## Mu00e9thodologie

Ce projet suit une mu00e9thodologie TDD (Test Driven Development). Pour chaque fonctionnalitu00e9 :

1. u00c9crire d'abord les tests
2. Implu00e9menter la fonctionnalitu00e9
3. Valider que les tests passent
4. Refactoriser si nu00e9cessaire

## Licence

ISC
