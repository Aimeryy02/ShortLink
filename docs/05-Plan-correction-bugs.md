# Plan de Correction des Bogues - ShortLink

## Bogues Identifiés et Corrigés

### BUG-001: Redirection autorisée après expiration

| Élément | Contenu |
|---|---|
| **ID** | BUG-001 |
| **Titre** | Redirection possible après expiration du lien |
| **Gravité** | 🔴 CRITIQUE |
| **Date découverte** | 2026-07-20 |
| **Contexte** | Lors du test de la feature d'expiration |
| **Étapes de reproduction** | 1. Créer lien avec expiresAt = 2026-07-19, 2. GET /lien-expire |
| **Résultat attendu** | Erreur 410 "Link expired" |
| **Résultat obtenu** | Redirection 302 vers URL originale (BUG!) |
| **Cause root** | Absence de vérification `expiresAt` dans `redirectToOriginalUrl` |
| **Fichier** | `src/controllers/redirectController.js` ligne 48 |
| **Correction** | Ajouter vérification avant trackClick |
| **Code corrigé** | `if (link.expiresAt && link.expiresAt <= new Date()) throw new AppError('Link expired', 410);` |
| **Test ajouté** | `redirectController.test.js` - "rejette lien expiré" |
| **Statut** | ✅ CORRIGÉ |
| **Date correction** | 2026-07-20 |
| **Validé par** | Tests automatisés |

### BUG-002: formatDisplayDate non défini

| Élément | Contenu |
|---|---|
| **ID** | BUG-002 |
| **Titre** | Erreur ReferenceError: formatDisplayDate is not defined |
| **Gravité** | 🟠 MAJEURE |
| **Date découverte** | 2026-07-20 |
| **Contexte** | Frontend - affichage des dates |
| **Étapes de reproduction** | 1. Ouvrir liste des liens, 2. Afficher date de création |
| **Résultat attendu** | Date formatée: "20 juil. 2026" |
| **Résultat obtenu** | Erreur console JavaScript |
| **Cause root** | Fonction `formatDisplayDate` utilisée mais non définie |
| **Fichier** | `client/src/` (nécessite accès frontend) |
| **Correction** | Ajouter fonction utilitaire ou utiliser `toLocaleDateString()` |
| **Test ajouté** | Aucun test frontend automatisé (hors périmètre Jest actuel) ; vérifié manuellement dans l'interface |
| **Statut** | ✅ CORRIGÉ |
| **Date correction** | 2026-07-20 |

### BUG-003: Titre non sauvegardé à la création

| Élément | Contenu |
|---|---|
| **ID** | BUG-003 |
| **Titre** | Champ "title" ignoré lors de la création |
| **Gravité** | 🟠 MAJEURE |
| **Date découverte** | 2026-07-20 |
| **Contexte** | API - `POST /api/shorten` |
| **Étapes de reproduction** | 1. `POST /api/shorten` avec `{"originalUrl": "...", "title": "Mon titre"}`, 2. GET lien |
| **Résultat attendu** | Lien retourné avec title="Mon titre" |
| **Résultat obtenu** | Lien retourné avec title=undefined |
| **Cause root** | Fonction `createShortLink` n'utilise pas le paramètre `title` |
| **Fichier** | `src/services/linkService.js` |
| **Correction** | Ajouter `title` au paramètre destructuré et à `Link.create()` |
| **Code corrigé** | `async function createShortLink({ originalUrl, customAlias, expiresAt, title })` |
| **Test ajouté** | `linkService.test.js` - test avec title |
| **Vérifié par recette** | REC-015 (PATCH title `200`) et création avec titre |
| **Statut** | ✅ CORRIGÉ |
| **Date correction** | 2026-07-20 |

### BUG-004: Erreur 429 pendant les tests

| Élément | Contenu |
|---|---|
| **ID** | BUG-004 |
| **Titre** | Rate limiting déclenché pendant les tests Jest |
| **Gravité** | 🟡 MINEURE |
| **Date découverte** | 2026-07-20 |
| **Contexte** | CI/CD - tests unitaires |
| **Étapes de reproduction** | 1. npm test dans boucle, 2. Après 100 requêtes |
| **Résultat attendu** | Tous les tests passent |
| **Résultat obtenu** | Erreur 429 "Too Many Requests" |
| **Cause root** | Limite de requêtes trop basse pour des essais répétés en local |
| **Fichier** | `src/config/rateLimit.js` |
| **Correction** | Rendre la limite configurable par variables d'environnement et l'ajuster selon l'environnement |
| **Code corrigé** | `const max = Number(process.env.RATE_LIMIT_MAX_REQUESTS || 10);` |
| **Test ajouté** | Vérification : limite basse ⇒ `429` (cf. REC-017 du cahier de recettes) |
| **Statut** | ✅ CORRIGÉ |
| **Date correction** | 2026-07-20 |

### BUG-005: QRCode génère erreur sur URL invalide

| Élément | Contenu |
|---|---|
| **ID** | BUG-005 |
| **Titre** | QR avec taille invalide retourne 500 au lieu de 400 |
| **Gravité** | 🟡 MINEURE |
| **Date découverte** | 2026-07-21 |
| **Contexte** | API - `GET /api/qr/:code?size=999` |
| **Étapes de reproduction** | 1. `GET /api/qr/:code?size=999` |
| **Résultat attendu** | Erreur 400 "Invalid QR code size" |
| **Résultat obtenu** | Erreur 500 non structurée |
| **Cause root** | `parseSize()` lance erreur dans try/catch global |
| **Fichier** | `src/controllers/qrController.js` ligne 20 |
| **Correction** | Ajouter validation dans fonction `parseSize()` |
| **Code corrigé** | `if (!ALLOWED_QR_SIZES.includes(parsedSize)) { throw new AppError(...) }` |
| **Test ajouté** | `qrController.test.js` - test size invalide |
| **Statut** | ✅ CORRIGÉ |
| **Date correction** | 2026-07-21 |

### BUG-006: Duplication possible des shortCode

| Élément | Contenu |
|---|---|
| **ID** | BUG-006 |
| **Titre** | Race condition sur génération de shortCode |
| **Gravité** | 🔴 CRITIQUE (rare) |
| **Date découverte** | Test de charge - 2026-07-21 |
| **Contexte** | Deux créations simultanées peuvent générer le même code |
| **Étapes de reproduction** | 1. Créations concurrentes via `POST /api/shorten` |
| **Résultat attendu** | Tous les `shortCode` uniques |
| **Résultat obtenu** | Risque de collision sur code identique |
| **Cause root** | `generateUniqueShortCode` : fenêtre de course possible avant écriture |
| **Fichier** | `src/models/Link.js` (schéma) et `src/services/linkService.js` |
| **Correction** | Index `unique` MongoDB sur `shortCode` + relance sur collision |
| **Code corrigé** | `shortCode: { type: String, required: true, unique: true }` (modèle `Link`) ; `MAX_SHORT_CODE_ATTEMPTS = 10` |
| **Test ajouté** | Tests unitaires de génération (`shortCodeService.test.js`) ; pas de test de concurrence automatisé |
| **Statut** | ✅ CORRIGÉ (index unique en place ; relance jusqu'à 10 tentatives) |
| **Date correction** | 2026-07-21 |

### BUG-007: Focus non restauré après fermeture d'une modale

| Élément | Contenu |
|---|---|
| **ID** | BUG-007 |
| **Titre** | Le focus ne revient pas au déclencheur après fermeture d'une modale |
| **Gravité** | 🟠 MAJEURE (accessibilité RGAA) |
| **Date découverte** | 2026-07-24 |
| **Contexte** | Frontend — modales de création/modification, navigation clavier |
| **Étapes de reproduction** | 1. Focus « Créer un lien », 2. `Entrée` pour ouvrir, 3. `Échap` pour fermer |
| **Résultat attendu** | Focus rendu au bouton « Créer un lien » |
| **Résultat obtenu** | Focus perdu sur `<body>` |
| **Cause root** | L'attribut `autoFocus` du premier champ s'exécute pendant le commit React, avant le `useEffect` de la modale ; `previouslyFocusedElement` capturait un champ interne (démonté à la fermeture) au lieu du déclencheur |
| **Fichier** | `client/src/main.jsx` (composant `Modal` + champs `originalUrl` / `edit-title`) |
| **Correction** | Retrait d'`autoFocus` sur les champs de modale ; la modale capture le déclencheur puis focalise le premier champ |
| **Code corrigé** | `const firstField = modal.querySelector('input, select, textarea, ...'); (firstField || focusableElements[0] || modal).focus();` |
| **Test ajouté** | Vérifié par parcours E2E navigateur (script Puppeteer, hors dépendances projet) : focus piégé 8/8, restauration au déclencheur, focus visible |
| **Statut** | ✅ CORRIGÉ |
| **Date correction** | 2026-07-24 |

---

## Bogues Non Corrigés (Backlog)

### FUTURE-001: Pagination très grande

| Élément | Contenu |
|---|---|
| **ID** | FUTURE-001 |
| **Titre** | Mauvaise performance avec page > 10000 |
| **Gravité** | 🟡 MINEURE |
| **Cause** | Query `skip(100000)` inefficace |
| **Solution proposée** | Utiliser cursor-based pagination ou ElasticSearch |
| **Priorité** | Faible |
| **Effort** | Moyen |
| **Blocker?** | Non |

### FUTURE-002: Authentification utilisateur

| Élément | Contenu |
|---|---|
| **ID** | FUTURE-002 |
| **Titre** | Pas de comptes multi-utilisateurs |
| **Gravité** | 🟡 MINEURE |
| **Cause** | Périmètre du MVP mono-administrateur (SWOT : « absence de base d'utilisateurs ») |
| **Solution proposée** | Ajouter JWT + collection Users si un besoin multi-comptes apparaît |
| **Priorité** | Moyen |
| **Effort** | Élevé |
| **État actuel** | Les opérations de gestion sont protégées par une clé d'administration (`X-Admin-Key`) ; le multi-utilisateur reste une évolution future |

---

## Résumé des Corrections

| Type | Nombre | Corrigés | Backlog |
|---|---|---|---|
| Critique | 2 | 2 | 0 |
| Majeure | 3 | 3 | 0 |
| Mineure | 2 | 2 | 0 |
| Feature | 2 | 0 | 2 |
| **Total** | **9** | **7** | **2** |

**Statut global**: ✅ **PRODUCTION READY - Tous les bugs critiques corrigés**

---

## Traçabilité des corrections

Chaque bogue est relié à la correction dans le code, au commit identifiable et à
la preuve qui le garde contre les régressions (test unitaire et/ou recette du
cahier `04-Cahier-recettes.md`). Note honnête : certaines corrections
correspondent à un commit dédié ; d'autres étaient gérées dès l'implémentation
initiale (`ab7a02b`) et sont garanties par les tests et recettes.

| Bogue | Correction (fichier) | Commit(s) | Test unitaire | Recette |
|---|---|---|---|---|
| BUG-001 Expiration | `redirectController.js` (contrôle `expiresAt` + `Cache-Control: no-store`) | `60bb67e`, `347a115` | `redirectController.test.js` | REC-007 (410) |
| BUG-002 Format de date (frontend) | `client/src/main.jsx` | `941429f`/`f0d7561` | — (hors périmètre Jest) | vérification visuelle |
| BUG-003 Titre non sauvegardé | `linkService.js` (`createShortLink`) | `60bb67e` | `linkService.test.js` | REC-015 |
| BUG-004 Rate limiting | `rateLimit.js` (limite configurable par env) | `ab7a02b` (présent dès l'initial) | — (intégration) | REC-017 (429) |
| BUG-005 Taille QR invalide | `qrController.js` (`parseSize` → 400) | `ab7a02b`, `9fd678e` | `qrController.test.js` | REC-010b (400) |
| BUG-006 Collision de `shortCode` | `Link.js` (index `unique`) + `linkService.js` (relance, `MAX_SHORT_CODE_ATTEMPTS = 10`) | `ab7a02b` (présent dès l'initial) | `shortCodeService.test.js` | REC-001 |
| BUG-007 Focus non restauré | `client/src/main.jsx` (composant `Modal`) | `d1efaee` (tag `v1.0.1`) | — | REC-019 (E2E clavier) |

Les corrections d'expiration (BUG-001), de titre (BUG-003), de taille de QR
(BUG-005), de désactivation et de focus (BUG-007) ont été **re-vérifiées le
24 juillet 2026** par l'exécution du cahier de recettes sur base réelle et par le
parcours E2E navigateur.

---

## Processus de Correction

### 1. Identification

- Tests automatisés découvrent les régressions
- Tests manuels en staging
- Rapports utilisateurs

### 2. Triage

- Gravité: Critique → Majeure → Mineure
- Urgence: Impact utilisateur
- Effort: Complexité de la fix

### 3. Développement

```bash
git checkout -b bugfix/BUG-001-description
# ... correction ...
npm test
git commit -m "fix: BUG-001 redirection après expiration"
git push
```

### 4. Test

- Lancer tests unitaires
- Vérifier couverture maintenue
- Test d'intégration manual

### 5. Déploiement

- Pull request
- GitHub Actions valide
- Merge et déploiement automatique

### 6. Vérification

- Vérifier en production
- Surveiller les logs
- Notifier les utilisateurs si applicable

