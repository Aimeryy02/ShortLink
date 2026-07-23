# Manuel de Mise à Jour - ShortLink

## Table des matières

1. [Avant de commencer](#avant-de-commencer)
2. [Workflow de développement](#workflow-de-développement)
3. [Processus de mise à jour](#processus-de-mise-à-jour)
4. [Déploiement](#déploiement)
5. [Rollback](#rollback)

---

## Avant de commencer

### Vérifier l'environnement

```bash
# Cloner le dépôt (première fois)
git clone https://github.com/Aimeryy02/ShortLink.git
cd ShortLink

# Ou synchroniser (si déjà cloné)
git fetch origin
git status
```

### Installer les dépendances

```bash
npm install
```

### Vérifier les tests passent

```bash
npm test
```

Tous les 56 tests doivent passer (aucune erreur).

---

## Workflow de développement

### 1. Créer une branche

```bash
# À partir de main
git checkout main
git pull origin main

# Créer branche de développement
git checkout -b feature/nom-de-la-fonctionnalité
# ou
git checkout -b bugfix/description-du-bug
# ou
git checkout -b chore/tâche-technique
```

### 2. Effectuer les modifications

Exemple: Ajouter une nouvelle route

```javascript
// src/routes/newRoutes.js
router.post('/new', (req, res) => {
  res.json({ message: 'Nouvelle route' });
});
```

### 3. Écrire/Mettre à jour les tests

```javascript
// src/routes/newRoutes.test.js
test('route /new retourne succès', () => {
  // test unitaire
});
```

### 4. Lancer les tests localement

```bash
# Tests
npm test

# Couverture
npm run test:coverage

# Vérifier aucune régression
# Couverture doit rester ≥ 92%
```

### 5. Commit

```bash
# Voir les changements
git status

# Ajouter les fichiers
git add .

# Commit avec message descriptif
git commit -m "feat: ajouter nouvelle fonctionnalité"
git commit -m "fix: corriger bug dans le service"
git commit -m "test: ajouter tests pour la route"
git commit -m "docs: mettre à jour la documentation"
```

**Convention de commits:**
- `feat:` - Nouvelle fonctionnalité
- `fix:` - Correction de bug
- `test:` - Ajout de tests
- `docs:` - Documentation
- `chore:` - Maintenance
- `refactor:` - Restructuration

### 6. Push vers GitHub

```bash
git push origin feature/nom-de-la-fonctionnalité
```

---

## Processus de mise à jour

### Étape 1: Créer une Pull Request

1. Aller sur [GitHub - ShortLink](https://github.com/Aimeryy02/ShortLink)
2. Cliquer "Compare & pull request"
3. Remplir le formulaire:
   ```
   Titre: feat: ajouter nouvelle fonctionnalité
   
   Description:
   - Qu'est-ce qui a changé?
   - Pourquoi?
   - Comment tester?
   ```

4. Cliquer "Create pull request"

### Étape 2: GitHub Actions vérifie

Le pipeline CI/CD démarre automatiquement:

```
✅ Installer les dépendances
✅ Lancer les tests (56 tests)
✅ Vérifier la couverture (92%+)
✅ Construire le frontend
✅ Audit de sécurité (npm audit)
```

**Si les checks échouent:**
1. Cliquer "Details" pour voir l'erreur
2. Corriger localement
3. Commit et push - le pipeline redémarre

**Si tous les checks passent:**
- Badge ✅ apparaît
- Prêt à fusionner

### Étape 3: Revoir le code (Code Review)

Un autre développeur peut commenter:
- "Bien, conforme aux standards"
- "À améliorer: ..."
- "Approuvé"

### Étape 4: Fusionner

Une fois approuvé, cliquer "Merge pull request"

Options de fusion:
- **Create a merge commit** - Recommandé (historique clair)
- **Squash and merge** - Combine tous les commits
- **Rebase and merge** - Linéaire (avancé)

### Étape 5: Supprimer la branche

```bash
# Automatiquement sur GitHub
# ou en local:
git branch -d feature/nom
```

---

## Déploiement

### Après fusion dans `main`

GitHub Actions redéploie automatiquement:

1. **Backend (Render)** - ✅ API redémarrée
2. **Frontend (Vercel)** - ✅ Site rebuilt

Voir l'état sur:
- [Render Dashboard](https://render.com)
- [Vercel Dashboard](https://vercel.com)

### Vérifier le déploiement

```bash
# Tester l'API
curl https://shortlink-api.render.com/api/links

# Vérifier le frontend
# Ouvrir https://shortlink.vercel.app
```

### Publier une version

```bash
# Voir la version actuelle
npm version

# Créer une version
git tag -a v1.0.1 -m "Correction de bugs"
git push origin v1.0.1

# Ou sur GitHub: Releases → "Create a new release"
```

Mettre à jour `CHANGELOG.md`:

```markdown
## [1.0.1] - 2026-07-22

### Fixed
- Correction du bug XYZ

### Added
- Nouvelle fonctionnalité ABC
```

---

## Rollback

### Si la production se casse

#### Option 1: Reverter le commit

```bash
# Voir le dernier commit
git log --oneline -5

# Reverter
git revert HEAD
git push origin main

# Render et Vercel redéploient automatiquement
```

#### Option 2: Redéployer une version antérieure

**Sur Render (Backend):**
1. Render Dashboard → Deployments
2. Cliquer le déploiement précédent fonctionnel
3. Cliquer "Redeploy"

**Sur Vercel (Frontend):**
1. Vercel Dashboard → Deployments
2. Cliquer le déploiement précédent fonctionnel
3. Cliquer "Redeploy"

#### Option 3: Revenir à un tag

```bash
# Lister les tags
git tag

# Revenir à v1.0.0
git checkout v1.0.0
git push origin HEAD:main --force

# ⚠️ Force push - uniquement en cas d'urgence!
```

---

## Scenario : Ajouter une nouvelle fonctionnalité

### Exemple: Ajouter la suppression en masse

```bash
# 1. Créer la branche
git checkout -b feature/bulk-delete

# 2. Coder
# - Modifier src/services/linkService.js
# - Ajouter fonction bulkDelete()
# - Ajouter route DELETE /api/links/bulk
# - Ajouter test src/services/linkService.test.js

# 3. Tester localement
npm test
npm run test:coverage
# Doit afficher 92%+

# 4. Commit
git add .
git commit -m "feat: ajouter suppression en masse"

# 5. Push
git push origin feature/bulk-delete

# 6. GitHub → Create pull request
# Attendre les checks ✅

# 7. Merge (si approuvé)
# Render et Vercel redéploient

# 8. Vérifier
curl -X DELETE https://shortlink-api.render.com/api/links/bulk \
  -H "Content-Type: application/json" \
  -d '{"ids": ["id1", "id2"]}'
```

---

## Bonnes pratiques

### ✅ À faire

- Écrire des tests pour chaque nouvelle fonction
- Maintenir la couverture ≥ 92%
- Utiliser des messages de commit descriptifs
- Tester localement avant de pousser
- Rebasculer sur `main` après fusion
- Documenter dans le code

### ❌ À éviter

- Commiter directement sur `main`
- Pousser sans tests
- Laisser des logs/console.log() en production
- Commiter des secrets ou passwords
- Faire des commits énormes (découper en petits commits)
- Forcer push sans bonne raison (git push --force)

---

## Dépannage

| Problème | Solution |
|---|---|
| Conflit de fusion | Résoudre les conflits, commit, push |
| Tests échouent | `npm test` localement, corriger, commit |
| Coverage baisse | Ajouter tests, relancer, push |
| Pipeline échoue | Voir les "Details", corriger, push |
| Rollback urgent | `git revert HEAD && git push` |
| Oublié de créer une branche | `git checkout -b branche && git reset HEAD~X` |

---

## Support

Questions? [GitHub Issues](https://github.com/Aimeryy02/ShortLink/issues)
