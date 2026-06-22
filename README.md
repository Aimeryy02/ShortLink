# ShortLink

ShortLink est une API de raccourcissement d'URLs inspiree de Bit.ly, TinyURL et Short.io.

Le projet permet de creer des liens courts, de rediriger les visiteurs, de suivre les clics, de generer des QR Codes, de consulter des statistiques detaillees et de gerer les liens via une API REST.

## Stack technique

- Node.js
- Express
- MongoDB
- Mongoose
- Zod
- Pino
- qrcode
- useragent
- geoip-lite
- express-rate-limit
- helmet
- cors

## Fonctionnalites developpees

- Creation de liens courts avec code Base62 aleatoire
- Alias personnalise optionnel
- Validation des URLs HTTP/HTTPS
- Protection anti-phishing basique
- Redirection HTTP `302`
- Page de previsualisation `/:code+`
- Tracking des clics
- Statistiques detaillees
- Generation de QR Code PNG
- CRUD complet des liens
- Pagination, tri, recherche et filtre par tags
- Rate limiting
- Logs structures
- Gestion globale des erreurs

## Installation

Installer les dependances :

```bash
npm install
```

Sous PowerShell, si `npm` est bloque par la policy Windows :

```powershell
npm.cmd install
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

BCRYPT_ROUNDS=10

RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=10

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
- `cors` configure globalement
- `express-rate-limit` applique aux routes `/api`
- Validation Zod des entrees utilisateur
- Refus des URLs non HTTP/HTTPS
- Protection anti-phishing basique :
  - patterns suspects `paypal.*verify`, `amazon.*account.*suspend`, `banking.*login`
  - domaines `.tk`, `.ga`, `.ml`
  - blacklist de domaines dans `validationService.js`
- IP des clics hashee avant stockage
- Erreurs centralisees via middleware global

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

- Pas d'authentification utilisateur
- Pas de dashboard frontend
- Pas d'export CSV/JSON
- Pas de Swagger
- Pas de protection par mot de passe
- Pas de Google Safe Browsing externe
- La detection anti-phishing reste volontairement basique
- La geolocalisation IP peut retourner `unknown` en local
- La suppression d'un lien ne supprime pas encore ses clics associes

## Ameliorations futures

- Ajouter une authentification JWT
- Ajouter un dashboard frontend
- Ajouter l'export CSV/JSON des statistiques
- Ajouter Swagger/OpenAPI
- Ajouter la protection par mot de passe
- Ajouter Google Safe Browsing
- Ajouter des tests unitaires et d'integration
- Supprimer ou archiver les clics lors de la suppression d'un lien
- Ajouter des campagnes et du bulk shortening
- Ajouter une collection Postman
