# Manuel de Déploiement - ShortLink

## Table des matières

1. [Prérequis](#prérequis)
2. [Environnement Local](#environnement-local)
3. [Environnement Production](#environnement-production)
4. [CI/CD Pipeline](#cicd-pipeline)
5. [Monitoring](#monitoring)
6. [Rollback](#rollback)

---

## Prérequis

### Localement
- Node.js 18+ et npm 9+
- MongoDB 5.0+ (Community Edition ou Atlas)
- Git
- Visual Studio Code (recommandé)

### Production
- Compte Render.com (backend)
- Compte Vercel.com (frontend)
- Compte MongoDB Atlas (base de données cloud)
- Compte GitHub

---

## Environnement Local

### 1. Installation

```bash
# Cloner le dépôt
git clone https://github.com/Aimeryy02/ShortLink.git
cd ShortLink

# Installer les dépendances
npm install
```

### 2. Configuration

Créer `.env` :

```env
MONGO_URI=mongodb://localhost:27017/shortlink
PORT=3000
NODE_ENV=development
BASE_URL=http://localhost:3000
QR_DEFAULT_SIZE=400
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
LOG_LEVEL=info
SHORT_CODE_LENGTH=6
```

### 3. Démarrer MongoDB

#### Option A: MongoDB local
```bash
# macOS / Linux
mongod

# Windows (si MongoDB est installé comme service)
net start MongoDB
```

#### Option B: MongoDB Atlas
- Créer un cluster sur [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- Copier la connexion: `mongodb+srv://user:pass@cluster.mongodb.net/shortlink`
- Ajouter à `.env`

### 4. Démarrer l'application

Terminal 1 - Backend:
```bash
npm run dev
```

Terminal 2 - Frontend:
```bash
npm run dev:frontend
```

Accéder à `http://localhost:5173`

### 5. Vérifier l'installation

```bash
# Tests
npm test

# Couverture
npm run test:coverage

# Check de sécurité
npm audit
```

---

## Environnement Production

### Déploiement Backend (Render.com)

#### 1. Préparer le dépôt

```bash
# Vérifier package.json a "start": "node server.js"
# Vérifier .gitignore exclut .env

# Ajouter dans root:
echo "NODE_ENV=production" >> .env

# Committer
git add -A
git commit -m "chore: production ready"
git push
```

#### 2. Créer sur Render

1. Aller sur [Render.com](https://render.com)
2. Cliquer "New +" → "Web Service"
3. Connecter GitHub
4. Sélectionner le dépôt `ShortLink`
5. Configuration:
   - **Name**: `ShortLink`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free/Paid

#### 3. Ajouter variables d'environnement

Dans Render → Settings → Environment:

```
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/shortlink
NODE_ENV=production
BASE_URL=https://shortlink-whkw.onrender.com
CLIENT_URL=https://short-link-omega.vercel.app
LOG_LEVEL=warn
```

#### 4. Deploy

Cliquer "Create Web Service" - le déploiement commence automatiquement

### Déploiement Frontend (Vercel.com)

#### 1. Préparer le dépôt

```bash
# Vérifier la config Vite
# vite.config.js doit exister

git push
```

#### 2. Créer sur Vercel

1. Aller sur [Vercel.com](https://vercel.com)
2. Cliquer "Add New..." → "Project"
3. Importer GitHub → Sélectionner `ShortLink`
4. Configuration:
   - **Framework Preset**: Vite
   - **Root Directory**: `./`
   - **Install Command**: `npm install`
   - **Build Command**: `npm run build:frontend`
   - **Output Directory**: `dist`

#### 3. Ajouter variables d'environnement

Dans Vercel → Settings → Environment Variables:

```
VITE_API_BASE_URL=https://shortlink-whkw.onrender.com
```

#### 4. Deploy

Cliquer "Deploy" - Vercel build et déploie automatiquement

### MongoDB Atlas (Base de données)

#### 1. Créer un cluster

1. Aller sur [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. "Create a deployment" → M0 Sandbox (gratuit)
3. Choisir cloud provider et région

#### 2. Créer utilisateur

Dans "Database Access":
- Ajouter utilisateur
- Username: `shortlink`
- Password: (générer)
- Role: `Read and write to any database`

#### 3. Autoriser IP

Dans "Network Access":
- Ajouter IP: `0.0.0.0/0` (allow all, car Render a des IPs dynamiques)

#### 4. Obtenir connexion

Clusters → Connect → Connect your application

Copier la chaîne:
```
mongodb+srv://shortlink:PASSWORD@cluster.mongodb.net/shortlink
```

---

## CI/CD Pipeline

### GitHub Actions

Le pipeline d'intégration continue s'exécute automatiquement à chaque push.
Render et Vercel sont connectés directement au dépôt GitHub et déclenchent
leurs propres déploiements après un push sur `main` ; ce déploiement n'est pas
réalisé par le workflow GitHub Actions.

#### Étapes

1. **Checkout** - Cloner le code
2. **Setup Node.js** - Configurer Node 22 et 24
3. **Install** - `npm ci`
4. **Tests** - `npm test` (doit passer)
5. **Coverage** - Mesurer 92%+
6. **Build Frontend** - `npm run build:frontend`
7. **Security Audit** - `npm audit`
8. **Codecov** - Télécharger couverture

### Fichier de configuration

`.github/workflows/ci.yml` décrit le pipeline complet.

### Vérifier le statut

Aller sur GitHub → Actions → Voir tous les workflows

---

## Monitoring

### Logs

#### Render (Backend)

Render Dashboard → Logs → voir logs en temps réel

#### Vercel (Frontend)

Vercel Dashboard → Deployments → Function Logs

### Métriques

#### Backend
- Temps de réponse des routes
- Erreurs 5XX
- Rate limit hits

#### Frontend
- Errors JavaScript
- Performance (Lighthouse)

### Accès

```bash
# Render API
curl https://shortlink-whkw.onrender.com/health

# MongoDB Stats
Dans Atlas Dashboard → Metrics
```

---

## Rollback

### Si déploiement échoue

#### Backend (Render)

1. Aller sur Render Dashboard
2. Service ShortLink → Deployments
3. Cliquer le déploiement précédent
4. Cliquer "Redeploy"

Ou via git:
```bash
git revert HEAD
git push
# Render redéploiera automatiquement
```

#### Frontend (Vercel)

1. Aller sur Vercel Dashboard
2. Project → Deployments
3. Cliquer le déploiement précédent
4. Cliquer "Redeploy"

### Rollback complet

```bash
# Voir l'historique
git log --oneline

# Revenir à un commit
git revert <commit-sha>
git push

# Attendre les redéploiements automatiques Render et Vercel
```

---

## Contrôles après déploiement

### Checklist

- [x] API répond à `GET /api/links`
- [x] Frontend charge à `https://short-link-omega.vercel.app`
- [x] Créer un lien test
- [x] Vérifier redirection
- [ ] Consulter stats
- [x] Vérifier QR code
- [ ] Tests d'accessibilité Lighthouse
- [ ] Audit de sécurité

### Tests de Fumée

```bash
# De la console Vercel
const res = await fetch('https://shortlink-whkw.onrender.com/api/links', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ originalUrl: 'https://example.com' })
});
console.log(res.status); // Doit être 201
```

---

## Dépannage

| Problème | Solution |
|---|---|
| `MONGO_URI` undefined | Ajouter la variable dans `.env` ou Render |
| Erreur `ECONNREFUSED` | MongoDB n'est pas accessible - vérifier l'URI |
| Timeout 504 | Render: trop de demandes; Vercel: fonction trop lente |
| Tests échouent | Lancer `npm test` localement, corriger, commit, push |
| QR code ne génère pas | Vérifier `qrcode` version dans `package.json` |

---

## Support

- 📧 Issues: https://github.com/Aimeryy02/ShortLink/issues
- 💬 Discussions: https://github.com/Aimeryy02/ShortLink/discussions
