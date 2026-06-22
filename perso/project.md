# 🔗 Projet 2 : ShortLink - Clone de Bit.ly

# Contexte du projet

Vous êtes chargé(e) de développer **ShortLink**, un service de raccourcissement d'URLs avec analytics inspiré de Bit.ly, TinyURL et Short.io. Ce service permettra de transformer des URLs longues en liens courts, trackés et partageables.

<aside>
🎯

**Objectifs pédagogiques**

- Comprendre les redirections HTTP (301 vs 302)
- Maîtriser la génération d'identifiants courts collision-free
- Implémenter un système d'analytics basique
- Gérer les custom aliases et leur validation
- Mettre en place une protection anti-phishing
- Générer des QR codes dynamiques
- Travailler avec la géolocalisation d'IP
</aside>

---

# User Stories

## En tant qu'utilisateur, je veux :

1. **Raccourcir une URL longue** et recevoir un lien court unique
2. **Choisir un alias personnalisé** si disponible (ex: bit.ly/mon-lien)
3. **Être redirigé automatiquement** vers l'URL d'origine en cliquant sur le lien court
4. **Voir les statistiques** de mes liens (clics, pays, navigateurs, referers)
5. **Générer un QR code** pour chaque lien court
6. **Prévisualiser** un lien court avant d'y accéder (protection phishing)
7. **Définir une expiration** pour mes liens (optionnel)
8. **Éditer l'URL de destination** après création
9. **Désactiver temporairement** un lien sans le supprimer
10. **Exporter les statistiques** en CSV/JSON

---

# Spécifications techniques

## Architecture

```
shortlink/
├── config/
│   ├── database.js
│   ├── rateLimit.js
│   └── logger.js
├── models/
│   ├── Link.js          # Modèle de lien
│   └── Click.js         # Modèle de clic (analytics)
├── routes/
│   ├── linkRoutes.js    # CRUD des liens
│   ├── redirectRoutes.js # Redirection
│   └── statsRoutes.js   # Statistiques
├── services/
│   ├── linkService.js   # Logique métier
│   ├── analyticsService.js # Tracking
│   ├── qrCodeService.js    # Génération QR
│   └── validationService.js # Anti-phishing
├── utils/
│   ├── shortIdGenerator.js
│   ├── geoip.js         # Géolocalisation
│   └── validators.js
└── index.js
```

---

## Base de données

### Schéma Link

```jsx
{
  _id: ObjectId,
  shortCode: String,        // Code court (ex: "aB3xY9")
  originalUrl: String,      // URL complète d'origine
  customAlias: String,      // Alias personnalisé (optionnel)
  
  // Métadonnées
  title: String,            // Titre du lien (optionnel)
  description: String,      // Description (optionnel)
  
  // Configuration
  isActive: Boolean,        // Actif ou désactivé
  expiresAt: Date,          // Date d'expiration (null = jamais)
  password: String,         // Hash du mot de passe (optionnel)
  
  // Statistiques
  clicks: Number,           // Compteur total de clics
  lastClickedAt: Date,      // Dernier clic
  
  // Tracking
  createdAt: Date,
  createdBy: String,        // IP hashée ou user ID
  updatedAt: Date,
  
  // Sécurité
  isPhishing: Boolean,      // Détecté comme phishing
  isMalware: Boolean,       // Détecté comme malware
  
  // Divers
  tags: [String],           // Tags pour organisation
  metadata: {
    favicon: String,        // URL du favicon du site cible
    ogImage: String,        // Open Graph image
  }
}
```

**Index :**

- `shortCode` : unique, recherche rapide
- `customAlias` : unique sparse (seulement si défini)
- `createdBy` : pour lister les liens d'un utilisateur
- `expiresAt` : pour nettoyage automatique

---

### Schéma Click (Analytics)

```jsx
{
  _id: ObjectId,
  linkId: ObjectId,         // Référence au Link
  
  // Informations de clic
  clickedAt: Date,
  
  // User Agent
  browser: String,          // Chrome, Firefox, Safari, etc.
  browserVersion: String,
  os: String,               // Windows, macOS, Linux, iOS, Android
  device: String,           // desktop, mobile, tablet
  
  // Localisation
  ip: String,               // IP hashée
  country: String,          // Code pays (FR, US, etc.)
  city: String,
  
  // Référence
  referer: String,          // Site d'origine
  refererDomain: String,    // Domaine uniquement
  
  // Langue
  language: String          // en-US, fr-FR, etc.
}
```

**Index :**

- `linkId` : pour agrégation des stats
- `clickedAt` : pour filtres temporels
- `country` : pour stats géographiques

---

## Routes API

### POST /api/shorten

Crée un lien court

**Body :**

```json
{
  "url": "https://example.com/very/long/url/with/parameters?foo=bar",
  "customAlias": "mon-lien",
  "title": "Mon super site",
  "expiresIn": "7d",
  "password": "optionnel",
  "tags": ["marketing", "2024"]
}
```

**Validations :**

- `url` : requis, doit être une URL valide (http/https)
- `customAlias` : optionnel, 3-30 caractères, alphanum + tirets, unique
- `expiresIn` : enum ['1h', '1d', '7d', '30d', 'never'] ou null
- `password` : optionnel, min 4 caractères
- Protection anti-phishing : vérifier que l'URL n'est pas malveillante

**Réponse 201 :**

```json
{
  "success": true,
  "link": {
    "id": "507f1f77bcf86cd799439011",
    "shortCode": "aB3xY9",
    "shortUrl": "http://localhost:3000/aB3xY9",
    "customUrl": "http://localhost:3000/mon-lien",
    "originalUrl": "https://example.com/very/long/url...",
    "qrCode": "http://localhost:3000/api/qr/aB3xY9",
    "createdAt": "2024-11-19T10:00:00Z",
    "expiresAt": "2024-11-26T10:00:00Z"
  }
}
```

**Erreurs :**

- `400` : Invalid URL / Custom alias already taken
- `403` : URL detected as phishing/malware
- `429` : Too many requests

---

### GET /:code

Redirection vers l'URL d'origine

**Comportement :**

1. Vérifie que le lien existe et est actif
2. Vérifie qu'il n'est pas expiré
3. Si password protégé, demande le mot de passe
4. Enregistre le clic (analytics)
5. Redirige avec code HTTP 302 (temporaire)

**Headers de réponse :**

```
HTTP/1.1 302 Found
Location: https://example.com/original/url
Cache-Control: no-cache, no-store, must-revalidate
```

**Erreurs :**

- `404` : Link not found
- `410` : Link expired
- `403` : Link disabled / Password required

---

### GET /:code+

Prévisualisation du lien (protection phishing)

**Exemple :** `http://localhost:3000/aB3xY9+`

**Réponse HTML :**

```html
<div class="preview">
  <h1>Vous allez être redirigé vers :</h1>
  <p class="url">https://example.com/original/url</p>
  <p class="warning">Vérifiez que ce lien est sûr avant de continuer</p>
  <button onclick="redirect()">Continuer</button>
  <a href="/">Annuler</a>
</div>
```

---

### GET /api/links/:id

Récupère les détails d'un lien

**Réponse 200 :**

```json
{
  "success": true,
  "link": {
    "id": "507f1f77bcf86cd799439011",
    "shortCode": "aB3xY9",
    "shortUrl": "http://localhost:3000/aB3xY9",
    "originalUrl": "https://example.com/original/url",
    "title": "Mon super site",
    "clicks": 1337,
    "isActive": true,
    "createdAt": "2024-11-19T10:00:00Z",
    "expiresAt": null,
    "tags": ["marketing", "2024"]
  }
}
```

---

### PATCH /api/links/:id

Modifie un lien

**Body :**

```json
{
  "originalUrl": "https://new-url.com",
  "title": "Nouveau titre",
  "isActive": false,
  "tags": ["updated"]
}
```

**Réponse 200 :**

```json
{
  "success": true,
  "link": { /* lien mis à jour */ }
}
```

---

### DELETE /api/links/:id

Supprime un lien

**Réponse 200 :**

```json
{
  "success": true,
  "message": "Link deleted"
}
```

---

### GET /api/links/:id/stats

Statistiques détaillées d'un lien

**Query params :**

- `period` : '7d', '30d', 'all'
- `groupBy` : 'day', 'country', 'browser', 'referer'

**Réponse 200 :**

```json
{
  "success": true,
  "stats": {
    "totalClicks": 1337,
    "uniqueClicks": 892,
    "clicksByDay": [
      { "date": "2024-11-19", "clicks": 145 },
      { "date": "2024-11-20", "clicks": 203 }
    ],
    "clicksByCountry": [
      { "country": "FR", "clicks": 456, "percentage": 34.1 },
      { "country": "US", "clicks": 234, "percentage": 17.5 }
    ],
    "clicksByBrowser": [
      { "browser": "Chrome", "clicks": 678, "percentage": 50.7 },
      { "browser": "Safari", "clicks": 321, "percentage": 24.0 }
    ],
    "clicksByDevice": [
      { "device": "mobile", "clicks": 789, "percentage": 59.0 },
      { "device": "desktop", "clicks": 548, "percentage": 41.0 }
    ],
    "topReferers": 
      { "domain": "[twitter.com", "clicks": 234 },
      { "domain": "facebook.com", "clicks": 189 }
    ]
  }
}
```

---

### GET /api/qr/:code

Génère un QR code pour le lien

**Query params :**

- `size` : 200, 400, 600 (pixels)
- `format` : 'png', 'svg'

**Réponse :**

```
Content-Type: image/png
[binary data of QR code]
```

---

### GET /api/links

Liste tous les liens (pagination)

**Query params :**

- `page` : numéro de page (défaut: 1)
- `limit` : liens par page (défaut: 20, max: 100)
- `sort` : 'createdAt', 'clicks', 'lastClickedAt'
- `order` : 'asc', 'desc'
- `tags` : filter par tags
- `search` : recherche dans title/url

**Réponse 200 :**

```json
{
  "success": true,
  "links": [ /* array of links */ ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

---

## Génération de codes courts

<aside>
🎲

**Stratégie recommandée : Base62**

```jsx
const BASE62_CHARS = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

function generateShortCode(length = 6) {
    let code = '';
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * BASE62_CHARS.length);
        code += BASE62_CHARS[randomIndex];
    }
    return code;
}

// Avec 6 caractères : 62^6 = 56.8 milliards de combinaisons
```

**Avec vérification d'unicité :**

```jsx
async function generateUniqueShortCode() {
    let attempts = 0;
    const maxAttempts = 10;
    
    while (attempts < maxAttempts) {
        const code = generateShortCode(6);
        
        // Vérifier que le code n'existe pas déjà
        const existing = await Link.findOne({
            $or: [
                { shortCode: code },
                { customAlias: code }
            ]
        });
        
        if (!existing) {
            return code;
        }
        
        attempts++;
    }
    
    // Si collision après 10 essais, augmenter la longueur
    return generateShortCode(7);
}
```

**Alternative : Hachage d'auto-incrément**

```jsx
function encodeBase62(num) {
    if (num === 0) return BASE62_CHARS[0];
    
    let encoded = '';
    while (num > 0) {
        encoded = BASE62_CHARS[num % 62] + encoded;
        num = Math.floor(num / 62);
    }
    return encoded;
}

// Utiliser un compteur auto-incrément
const counter = await Counter.findOneAndUpdate(
    { _id: 'linkCounter' },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
);

const shortCode = encodeBase62(counter.seq);
// 1 → "1"
// 62 → "10"
// 1000 → "g8"
```

Avantage : pas de collision possible, codes séquentiels

Inconvénient : prévisible (nombre total de liens visible)

</aside>

---

## Validation d'alias personnalisé

<aside>
✔️

**Règles de validation**

```jsx
function validateCustomAlias(alias) {
    // Longueur
    if (alias.length < 3 || alias.length > 30) {
        throw new Error('Alias must be between 3 and 30 characters');
    }
    
    // Caractères autorisés : alphanumérique + tirets
    const validPattern = /^[a-zA-Z0-9-]+$/;
    if (!validPattern.test(alias)) {
        throw new Error('Alias can only contain letters, numbers and dashes');
    }
    
    // Pas de tiret au début/fin
    if (alias.startsWith('-') || alias.endsWith('-')) {
        throw new Error('Alias cannot start or end with a dash');
    }
    
    // Pas de tirets consécutifs
    if (alias.includes('--')) {
        throw new Error('Alias cannot contain consecutive dashes');
    }
    
    // Mots réservés (routes de l'app)
    const reserved = ['api', 'admin', 'stats', 'qr', 'preview', 'dashboard'];
    if (reserved.includes(alias.toLowerCase())) {
        throw new Error('This alias is reserved');
    }
    
    return true;
}
```

**Vérification d'unicité :**

```jsx
async function isAliasAvailable(alias) {
    const existing = await Link.findOne({
        $or: [
            { customAlias: alias },
            { shortCode: alias }  // Éviter collision avec codes générés
        ]
    });
    
    return !existing;
}
```

</aside>

---

## Analytics et Tracking

<aside>
📊

**Enregistrement d'un clic**

```jsx
const useragent = require('useragent');
const geoip = require('geoip-lite');

async function trackClick(linkId, req) {
    // Parse User Agent
    const agent = useragent.parse(req.headers['user-agent']);
    
    // Géolocalisation IP
    const ip = req.ip || req.connection.remoteAddress;
    const geo = geoip.lookup(ip);
    
    // Extraire le referer
    const referer = req.headers.referer || req.headers.referrer || 'direct';
    let refererDomain = 'direct';
    if (referer !== 'direct') {
        try {
            refererDomain = new URL(referer).hostname;
        } catch (e) {
            refererDomain = 'unknown';
        }
    }
    
    // Créer l'enregistrement de clic
    await Click.create({
        linkId: linkId,
        clickedAt: new Date(),
        
        // User Agent
        browser: agent.family,
        browserVersion: agent.major,
        os: agent.os.family,
        device: agent.device.family === 'Other' ? 'desktop' : 'mobile',
        
        // Géolocalisation
        ip: hashIP(ip),
        country: geo?.country || 'unknown',
        city: geo?.city || 'unknown',
        
        // Referer
        referer: referer,
        refererDomain: refererDomain,
        
        // Langue
        language: req.headers['accept-language']?.split(',')[0] || 'unknown'
    });
    
    // Incrémenter le compteur du lien
    await Link.findByIdAndUpdate(linkId, {
        $inc: { clicks: 1 },
        lastClickedAt: new Date()
    });
}

function hashIP(ip) {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(ip).digest('hex').substring(0, 16);
}
```

**Dépendances :**

```bash
npm install useragent geoip-lite
```

</aside>

---

## Génération de QR Codes

<aside>
📱

**Avec la librairie qrcode**

```bash
npm install qrcode
```

```jsx
const QRCode = require('qrcode');

async function generateQRCode(url, options = {}) {
    const { size = 400, format = 'png' } = options;
    
    const qrOptions = {
        width: size,
        margin: 2,
        color: {
            dark: '#000000',
            light: '#FFFFFF'
        }
    };
    
    if (format === 'svg') {
        return await QRCode.toString(url, { ...qrOptions, type: 'svg' });
    }
    
    // PNG par défaut
    return await QRCode.toBuffer(url, qrOptions);
}

// Dans la route
app.get('/api/qr/:code', async (req, res) => {
    const link = await Link.findOne({
        $or: [
            { shortCode: req.params.code },
            { customAlias: req.params.code }
        ]
    });
    
    if (!link) {
        return res.status(404).json({ error: 'Link not found' });
    }
    
    const shortUrl = `${req.protocol}://${req.get('host')}/${link.shortCode}`;
    const format = req.query.format || 'png';
    const size = parseInt(req.query.size) || 400;
    
    const qrCode = await generateQRCode(shortUrl, { size, format });
    
    if (format === 'svg') {
        res.type('image/svg+xml');
    } else {
        res.type('image/png');
    }
    
    res.send(qrCode);
});
```

</aside>

---

## Protection Anti-Phishing

<aside>
🛡️

**Détection basique**

```jsx
function isPhishingURL(url) {
    const suspiciousPatterns = [
        /paypal.*verify/i,
        /amazon.*account.*suspend/i,
        /banking.*login/i,
        /\.tk$/,  // TLD suspects
        /\.ga$/,
        /\.ml$/
    ];
    
    for (const pattern of suspiciousPatterns) {
        if (pattern.test(url)) {
            return true;
        }
    }
    
    return false;
}

// Blacklist de domaines
const BLOCKED_DOMAINS = 
    '[malicious-site.com',
    'phishing-test.com'
];

function isDomainBlocked(url) {
    try {
        const hostname = new URL(url).hostname;
        return BLOCKED_DOMAINS.some(blocked => hostname.includes(blocked));
    } catch (e) {
        return false;
    }
}
```

**Intégration avec API externe (bonus) :**

```jsx
const axios = require('axios');

async function checkURLSafety(url) {
    // Google Safe Browsing API (gratuit jusqu'à 10k requêtes/jour)
    try {
        const response = await axios.post(
            `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${process.env.GOOGLE_API_KEY}`,
            {
                client: {
                    clientId: "shortlink",
                    clientVersion: "1.0.0"
                },
                threatInfo: {
                    threatTypes: ["MALWARE", "SOCIAL_ENGINEERING"],
                    platformTypes: ["ANY_PLATFORM"],
                    threatEntryTypes: ["URL"],
                    threatEntries: [{url: url}]
                }
            }
        );
        
        return response.data.matches ? false : true;  // false = unsafe
    } catch (error) {
        logger.error('Safe Browsing API error:', error);
        return true;  // En cas d'erreur, on autorise (fail open)
    }
}
```

</aside>

---

## Redirections HTTP

<aside>
🔄

**301 vs 302 : quelle différence ?**

### 301 Moved Permanently

- Redirection **permanente**
- Les navigateurs/moteurs de recherche **cachent** la redirection
- Les futurs clics peuvent aller directement à la destination
- **Problème** : on perd le tracking des clics !

### 302 Found (Temporary Redirect)

- Redirection **temporaire**
- Les navigateurs ne cachent pas
- Chaque clic passe par notre serveur
- **Idéal pour le tracking** ✅

### 307 Temporary Redirect

- Comme 302 mais garantit que la méthode HTTP ne change pas
- Alternative moderne au 302

**Notre choix : 302**

```jsx
app.get('/:code', async (req, res) => {
    const link = await findLink(req.params.code);
    
    // Tracking
    await trackClick(link._id, req);
    
    // Redirection 302
    res.redirect(302, link.originalUrl);
    
    // Alternative explicite
    // res.status(302).location(link.originalUrl).send();
});
```

**Headers importants :**

```jsx
res.set({
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
});
res.redirect(302, link.originalUrl);
```

Cela empêche le cache des redirections.

</aside>

---

# Fonctionnalités obligatoires

## MVP (Minimum Viable Product)

- [ ]  Raccourcissement d'URL avec code aléatoire
- [ ]  Redirection fonctionnelle (302)
- [ ]  Custom alias (validation)
- [ ]  Tracking basique (compteur de clics)
- [ ]  QR code generation
- [ ]  Expiration des liens
- [ ]  Validation d'URL
- [ ]  Rate limiting
- [ ]  Gestion d'erreurs
- [ ]  Logs structurés

---

# Fonctionnalités bonus

## Niveau 1 (+2 points)

- [ ]  Analytics détaillées (navigateur, OS, pays)
- [ ]  Prévisualisation de lien (anti-phishing)
- [ ]  Protection par mot de passe
- [ ]  Activation/désactivation de liens
- [ ]  Pagination de la liste des liens

## Niveau 2 (+3 points)

- [ ]  Dashboard avec graphiques (Chart.js)
- [ ]  Export stats en CSV/JSON
- [ ]  Détection de phishing (patterns + API)
- [ ]  Bulk shortening (plusieurs URLs à la fois)
- [ ]  API publique documentée (Swagger)

## Niveau 3 (+5 points)

- [ ]  Frontend complet (React/Vue)
- [ ]  Authentification utilisateur (JWT)
- [ ]  Tableau de bord utilisateur
- [ ]  Webhooks (notification sur clic)
- [ ]  Campagnes (grouper plusieurs liens)
- [ ]  A/B testing (2 URLs pour 1 short link)

---

# Barème d'évaluation

## Fonctionnalités (40 points)

- Raccourcissement + redirection (10 pts)
- Custom alias (5 pts)
- Analytics/tracking (10 pts)
- QR codes (5 pts)
- Expiration (5 pts)
- Sécurité/validation (5 pts)

## Code Quality (25 points)

- Architecture (5 pts)
- Gestion d'erreurs (5 pts)
- Validation (5 pts)
- Sécurité (5 pts)
- Lisibilité (5 pts)

## Documentation (15 points)

- README (5 pts)
- API docs (5 pts)
- Installation (5 pts)

## Tests (10 points)

- Tests unitaires (5 pts)
- Tests d'intégration (5 pts)

## Bonus (10 points)

- Features supplémentaires
- Créativité
- UI/UX

**Total : /100 points**

---

# Livrables

1. Code source (GitHub/GitLab)
2. README complet
3. Documentation API
4. Fichier .env.example
5. Collection Postman
6. Démo (optionnel)

---

# Exemple .env

```bash
# Server
PORT=3000
NODE_ENV=development
BASE_URL=http://localhost:3000

# Database
MONGO_URI=mongodb://localhost:27017/shortlink

# Security
BCRYPT_ROUNDS=10

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=10

# URL Settings
SHORT_CODE_LENGTH=6
MAX_URL_LENGTH=2048

# Google Safe Browsing (optionnel)
GOOGLE_API_KEY=your_api_key_here

# QR Code
QR_DEFAULT_SIZE=400
```

---

# Conseils

<aside>
💡

**Stratégie de développement**

1. Commencez par le MVP : shorten + redirect
2. Ajoutez le tracking basique
3. Implémentez les analytics
4. Ajoutez les features bonus
5. Polissez l'UX et la sécurité
</aside>

<aside>
⚠️

**Pièges courants**

- ❌ Utiliser 301 au lieu de 302 (perte de tracking)
- ❌ Ne pas valider les URLs (injection possible)
- ❌ Oublier le rate limiting (spam de liens)
- ❌ Ne pas hasher les IPs (vie privée)
- ❌ Collision d'alias non gérée
</aside>

---

# Ressources

- **useragent** : https://github.com/3rd-Eden/useragent
- **geoip-lite** : https://github.com/geoip-lite/node-geoip
- **qrcode** : https://github.com/soldair/node-qrcode
- **Google Safe Browsing** : https://developers.google.com/safe-browsing

Bon courage ! 🚀