# ShortLink - Service de Raccourcissement d'URLs

[![CI - Test & Build](https://github.com/Aimeryy02/ShortLink/actions/workflows/ci.yml/badge.svg)](https://github.com/Aimeryy02/ShortLink/actions/workflows/ci.yml)

## 📋 Présentation du Projet

**ShortLink** est un service de raccourcissement d'URLs inspired by Bit.ly avec gestion des liens, génération de codes QR, analytics avancées, et sécurité renforcée.

Réalisé dans le cadre du **Bloc 2 RNCP : Concevoir et développer des applications logicielles**.

### 🎯 Fonctionnalités Principales

- ✅ Création de liens courts avec codes 6-caractères
- ✅ Alias personnalisés (ex: `shortlink.app/mon-lien`)
- ✅ Génération de codes QR pour chaque lien
- ✅ Page de preview de redirection (sécurité)
- ✅ Expiration programmée des liens
- ✅ Activation/Désactivation des liens
- ✅ Détection anti-phishing
- ✅ Statistiques et suivi des clics (géolocalisation, navigateur, appareil)
- ✅ Rate limiting pour éviter les abus
- ✅ Validation des URLs (protocoles http/https uniquement)

---

## 🛠️ Technologies

### Backend
- **Node.js** + **Express** - Framework HTTP
- **MongoDB** - Base de données NoSQL
- **Mongoose** - ODM pour MongoDB
- **Zod** - Validation des schémas
- **Helmet** - Sécurité des headers HTTP
- **express-rate-limit** - Rate limiting
- **Pino** - Logging structuré
- **Jest** - Tests unitaires
- **geoip-lite** + parseur interne borné - Analytics

### Frontend
- **React** 18 - Interface utilisateur
- **Vite** - Build tool moderne
- **CSS3** - Styling

### Infrastructure
- **Git** + **GitHub** - Versioning
- **GitHub Actions** - CI/CD
- **Render** (backend) / **Vercel** (frontend) - Déploiement
- **MongoDB Atlas** - Base de données cloud

---

## 📐 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React + Vite)                   │
│                   localhost:5173 / Vercel                    │
└────────────┬────────────────────────────────────────────────┘
             │ HTTP/REST JSON
┌────────────▼────────────────────────────────────────────────┐
│               API Express (Node.js)                          │
│              localhost:3000 / Render                         │
│                                                              │
│  ┌──────────┐  ┌────────────┐  ┌─────────────┐             │
│  │  Routes  │  │ Controllers│  │  Middlewares│             │
│  └──────────┘  └────────────┘  └─────────────┘             │
│                        ↓                                     │
│  ┌──────────────────────────────────────┐                  │
│  │         Services métier              │                  │
│  │  - linkService                       │                  │
│  │  - analyticsService                  │                  │
│  │  - validationService                 │                  │
│  │  - qrCodeService                     │                  │
│  │  - shortCodeService                  │                  │
│  └──────────────────────────────────────┘                  │
│                        ↓                                     │
│  ┌──────────────────────────────────────┐                  │
│  │         Modèles Mongoose             │                  │
│  │  - Link                              │                  │
│  │  - Click                             │                  │
│  └──────────────────────────────────────┘                  │
└────────────┬────────────────────────────────────────────────┘
             │ TCP
┌────────────▼────────────────────────────────────────────────┐
│       MongoDB Atlas (Cloud Database)                         │
└─────────────────────────────────────────────────────────────┘
```

---

## 📦 Prérequis

- **Node.js** 18+ 
- **npm** 9+
- **MongoDB 5.0+** (local ou MongoDB Atlas)
- **Git**

---

## 🚀 Installation

### 1. Cloner le dépôt

```bash
git clone https://github.com/Aimeryy02/ShortLink.git
cd ShortLink
```

### 2. Installer les dépendances

```bash
npm install
```

### 3. Configuration des variables d'environnement

Créer un fichier `.env` à la racine du projet:

```env
# Base de données
MONGO_URI=mongodb://localhost:27017/shortlink

# Server
PORT=3000
NODE_ENV=development

# Base URL pour les liens courts
BASE_URL=http://localhost:3000

# QR Code
QR_DEFAULT_SIZE=400

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info

# Short Code
SHORT_CODE_LENGTH=6
```

---

## 🏃 Commandes

### Développement

```bash
npm run dev          # Démarrer serveur avec auto-reload
npm run dev:frontend # Démarrer frontend Vite
```

### Tests

```bash
npm test                # Lancer tous les tests
npm run test:coverage   # Générer rapport de couverture
```

### Build

```bash
npm run build:frontend  # Build React pour production
```

### Production

```bash
npm start              # Démarrer le serveur
```

---

## 🧪 Tests et Couverture

### Résultat des Tests

```
✅ 12 test suites passed
✅ 70 tests passed
✅ 91.98% statement coverage
✅ 80% branch coverage
✅ 98% function coverage
✅ 93.43% line coverage
```

Exécuter les tests:

```bash
npm test                 # Tests simples
npm run test:coverage    # Avec rapport de couverture
```

---

## 🔒 Sécurité (OWASP)

### Mesures Implémentées

| Risque OWASP | Mesure | Localisation |
|---|---|---|
| **A01:2025** - Contrôle d'accès | Clé requise sur les routes de gestion | `adminAuthMiddleware.js` |
| **A02:2025** - Mauvaise configuration | Helmet, CORS limité, limites de requêtes | `app.js` |
| **A03:2025** - Chaîne logicielle | Lockfile, CI et audit npm | `package-lock.json` |
| **A04:2025** - Cryptographie | HTTPS et secrets hors du dépôt | `.env.example`, `.gitignore` |
| **A05:2025** - Injection | Zod et recherche regex échappée | `linkValidation.js`, `linkService.js` |
| **A06:2025** - Conception non sécurisée | Séparation routes publiques/privées | `src/routes/` |
| **A07:2025** - Authentification | Clé longue, comparaison à temps constant | `adminAuthMiddleware.js` |
| **A08:2025** - Intégrité | CI, Git et builds reproductibles | GitHub Actions |
| **A09:2025** - Journalisation | Pino et logs de refus sans secret | `config/logger.js` |
| **A10:2025** - Conditions exceptionnelles | Erreurs centralisées et réponses contrôlées | `errorMiddleware.js` |

---

## ♿ Accessibilité (RGAA)

- ✅ Hiérarchie correcte des titres
- ✅ Labels associés aux champs
- ✅ Texte alternatif pour les images
- ✅ Navigation clavier
- ✅ Focus visible
- ✅ Contraste suffisant
- ✅ Responsive design
- ✅ Messages d'erreur explicites

---

## 📊 Statut du Bloc 2 RNCP

**Validation du Bloc 2 en cours, critère par critère, avec preuves
reproductibles.**

### Critères de Validation

| Critère | Intitulé | Preuve | Statut |
|---------|----------|--------|--------|
| **C2.1.1** | Infrastructure multi-env | [01-Manuel-deploiement.md](docs/01-Manuel-deploiement.md) | ✅ |
| **C2.1.2** | Intégration Continue (CI/CD) | [.github/workflows/ci.yml](.github/workflows/ci.yml) | ✅ |
| **C2.2.1** | Architecture logicielle en couches | [Architecture ci-dessus](#-architecture) | ✅ |
| **C2.2.2** | Tests unitaires 70%+ | [npm run test:coverage](#-tests--couverture) - **91.98%** | ✅ |
| **C2.2.3** | Sécurité OWASP | Mesures OWASP 2025, clé administrateur, audit npm à 0 | ⏳ preuve production |
| **C2.2.3** | Accessibilité RGAA 4.1.2 | Correctifs intégrés, audit manuel/Lighthouse à exécuter | ⏳ |
| **C2.2.4** | Versioning CHANGELOG + tags | [CHANGELOG.md](CHANGELOG.md) - v1.0.0 | ✅ |
| **C2.3.1** | Cahier de recettes fonctionnelles | [04-Cahier-recettes.md](docs/04-Cahier-recettes.md) - **20 validées** | ✅ |
| **C2.3.2** | Plan correction bugs | [05-Plan-correction-bugs.md](docs/05-Plan-correction-bugs.md) - **6 corrigés** | ✅ |
| **C2.3.3** | 3 Manuels (deploy/usage/update) | [01](docs/01-Manuel-deploiement.md) [02](docs/02-Manuel-utilisation.md) [03](docs/03-Manuel-mise-a-jour.md) | ✅ |

### Audit Complet

Pour une validation **point par point détaillée** avec justifications, voir: **[VALIDATION-BLOC-2.md](VALIDATION-BLOC-2.md)** (~600 lignes)

### Résumé des Livrables

```
✅ Tests: 70 tests, 91.98% couverture des instructions
⏳ Sécurité: mesures documentées pour les 10 catégories OWASP 2025, preuve production en cours
⏳ Accessibilité: RGAA 4.1.2 choisi, contrôles manuels et Lighthouse à conserver
✅ Documentation: livrée séparément sous forme de PDF
✅ CI/CD: GitHub Actions automatisé
✅ Versioning: CHANGELOG v1.0.0 + tags Git
```

---

## 🔗 Liens Utiles

- 🔗 [Code Source](https://github.com/Aimeryy02/ShortLink)
- 📄 [CHANGELOG](CHANGELOG.md)
- ⚙️ [GitHub Actions CI](https://github.com/Aimeryy02/ShortLink/actions)

---

## 👤 Auteur

**Aimery** - [@Aimeryy02](https://github.com/Aimeryy02)

## 📄 Licence

ISC
```

## MongoDB

Le projet attend une base MongoDB locale par defaut :

```txt
mongodb://localhost:27017/shortlink
```

Avec Docker :

```powershell
docker run -d --name shortlink-mongo -p 27017:27017 mongo:7
```

Si le conteneur existe deja :

```powershell
docker start shortlink-mongo
```

## Configuration .env

Creer un fichier `.env` a la racine :

```env
PORT=3000
NODE_ENV=development
BASE_URL=http://localhost:3000

MONGO_URI=mongodb://localhost:27017/shortlink

CLIENT_URL=http://127.0.0.1:5173
ADMIN_API_KEY=une-cle-aleatoire-de-32-caracteres-minimum

RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=10
REDIRECT_RATE_LIMIT_WINDOW_MS=60000
REDIRECT_RATE_LIMIT_MAX_REQUESTS=120

SHORT_CODE_LENGTH=6
MAX_URL_LENGTH=2048

GOOGLE_API_KEY=

QR_DEFAULT_SIZE=400
```

## Lancement du serveur

Mode developpement :

```powershell
npm run dev
```

Mode standard :

```powershell
npm start
```

Serveur attendu :

```txt
http://localhost:3000
```

## Routes API

### Creer un lien court

```http
POST /api/shorten
```

Body :

```json
{
  "originalUrl": "https://example.com",
  "customAlias": "mon-lien",
  "expiresAt": "2026-12-31"
}
```

Reponse :

```json
{
  "shortUrl": "http://localhost:3000/mon-lien",
  "shortCode": "abc123"
}
```

PowerShell :

```powershell
$body = @{
  originalUrl = "https://example.com"
  customAlias = "mon-lien"
  expiresAt = "2026-12-31"
} | ConvertTo-Json

Invoke-RestMethod -Method Post -Uri "http://localhost:3000/api/shorten" -ContentType "application/json" -Body $body
```

### Rediriger vers l'URL originale

```http
GET /:code
```

Exemple :

```txt
http://localhost:3000/mon-lien
```

La redirection utilise `302 Found`.

### Previsualiser un lien

```http
GET /:code+
```

Exemple :

```txt
http://localhost:3000/mon-lien+
```

La page affiche l'URL cible, un avertissement de securite, un bouton Continuer et un lien Annuler.

### Lister les liens

```http
GET /api/links
```

Query params :

- `page` : page courante, defaut `1`
- `limit` : nombre de resultats, defaut `20`, max `100`
- `sort` : `createdAt`, `clicks`, `originalUrl`, `title`, `expiresAt`
- `order` : `asc` ou `desc`
- `search` : recherche dans `title` et `originalUrl`
- `tags` : tags separes par virgule

Exemple :

```powershell
Invoke-RestMethod "http://localhost:3000/api/links?page=1&limit=10&sort=createdAt&order=desc"
```

Avec recherche :

```powershell
Invoke-RestMethod "http://localhost:3000/api/links?search=example&tags=demo,node"
```

### Recuperer un lien

```http
GET /api/links/:id
```

PowerShell :

```powershell
Invoke-RestMethod "http://localhost:3000/api/links/665f00000000000000000000"
```

### Modifier un lien

```http
PATCH /api/links/:id
```

Champs autorises :

- `originalUrl`
- `title`
- `isActive`
- `tags`
- `expiresAt`

`shortCode` n'est pas modifiable directement.

PowerShell :

```powershell
$body = @{
  title = "Documentation Example"
  isActive = $true
  tags = @("demo", "docs")
} | ConvertTo-Json

Invoke-RestMethod -Method Patch -Uri "http://localhost:3000/api/links/665f00000000000000000000" -ContentType "application/json" -Body $body
```

### Supprimer un lien

```http
DELETE /api/links/:id
```

PowerShell :

```powershell
Invoke-RestMethod -Method Delete "http://localhost:3000/api/links/665f00000000000000000000"
```

### Statistiques d'un lien

```http
GET /api/links/:id/stats
```

Query params :

- `period=7d`
- `period=30d`
- `period=all`

Reponse :

```json
{
  "success": true,
  "stats": {
    "totalClicks": 3,
    "clicksByDay": [
      { "date": "2026-06-22", "clicks": 3 }
    ],
    "clicksByCountry": [
      { "value": "FR", "clicks": 2 }
    ],
    "clicksByBrowser": [
      { "value": "Chrome", "clicks": 2 }
    ],
    "clicksByDevice": [
      { "value": "desktop", "clicks": 3 }
    ],
    "topReferers": [
      { "value": "direct", "clicks": 3 }
    ]
  }
}
```

PowerShell :

```powershell
Invoke-RestMethod "http://localhost:3000/api/links/665f00000000000000000000/stats?period=7d"
```

### Generer un QR Code

```http
GET /api/qr/:code
```

Query params :

- `size=200`
- `size=400`
- `size=600`

Exemples :

```txt
http://localhost:3000/api/qr/mon-lien
http://localhost:3000/api/qr/mon-lien?size=400
```

PowerShell, sauvegarde dans un fichier :

```powershell
Invoke-WebRequest -Uri "http://localhost:3000/api/qr/mon-lien?size=400" -OutFile "qr-mon-lien.png"
```

## Structure du projet

```txt
shortlink/
  src/
    config/
      database.js
      logger.js
      rateLimit.js
    controllers/
      linkController.js
      qrController.js
      redirectController.js
      statsController.js
    middlewares/
      errorMiddleware.js
      notFoundMiddleware.js
    models/
      Click.js
      Link.js
    routes/
      index.js
      linkRoutes.js
      qrRoutes.js
      redirectRoutes.js
      statsRoutes.js
    services/
      analyticsService.js
      linkService.js
      qrCodeService.js
      shortCodeService.js
      statsService.js
      validationService.js
    utils/
      AppError.js
      linkValidation.js
    app.js
  server.js
  package.json
  .env.example
  README.md
```

## Securite mise en place

- `helmet` pour renforcer les headers HTTP
- `cors` limite aux origines frontend configurees
- `express-rate-limit` applique aux routes `/api`
- limitation distincte des redirections publiques
- acces par cle d'administration aux routes de creation et de gestion
- cle d'au moins 32 caracteres comparee a temps constant et jamais journalisee
- corps HTTP limites a 20 Ko
- Validation Zod des entrees utilisateur
- recherche MongoDB bornee et caracteres de regex echappes
- Refus des URLs non HTTP/HTTPS
- Protection anti-phishing basique :
  - patterns suspects `paypal.*verify`, `amazon.*account.*suspend`, `banking.*login`
  - domaines `.tk`, `.ga`, `.ml`
  - blacklist de domaines dans `validationService.js`
- IP des clics hashee avant stockage
- Erreurs centralisees via middleware global
- dependances verrouillees et `npm audit` sans vulnerabilite connue au 24/07/2026

## Analytics

A chaque redirection `GET /:code`, l'application :

- cree un document `Click`
- incremente `link.clicks`
- stocke :
  - `linkId`
  - `clickedAt`
  - navigateur
  - OS
  - device
  - IP hashee
  - pays
  - referer
  - domaine referer
  - langue

Les statistiques sont calculees depuis la collection `Click`.

## QR Code

La route `GET /api/qr/:code` genere une image PNG avec la librairie `qrcode`.

Le QR Code pointe vers :

```txt
http://localhost:3000/:code
```

Formats actuellement supportes :

- PNG uniquement
- tailles : `200`, `400`, `600`

## Limites connues

- Une cle d'administration unique, sans comptes nominatifs ni roles
- Pas d'export CSV/JSON
- Pas de Swagger
- Pas de protection par mot de passe
- Pas de Google Safe Browsing externe
- La detection anti-phishing reste volontairement basique
- La geolocalisation IP peut retourner `unknown` en local
- La suppression d'un lien ne supprime pas encore ses clics associes

## Ameliorations futures

- Remplacer la cle unique par des comptes nominatifs et des roles
- Ajouter l'export CSV/JSON des statistiques
- Ajouter Swagger/OpenAPI
- Ajouter la protection par mot de passe
- Ajouter Google Safe Browsing
- Ajouter des tests unitaires et d'integration
- Supprimer ou archiver les clics lors de la suppression d'un lien
- Ajouter des campagnes et du bulk shortening
- Ajouter une collection Postman
