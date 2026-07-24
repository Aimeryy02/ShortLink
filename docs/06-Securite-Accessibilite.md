# Sécurité OWASP et accessibilité — ShortLink

Date de mise à jour : 24 juillet 2026

Environnements concernés :

- frontend : `https://short-link-omega.vercel.app` ;
- API : `https://shortlink-whkw.onrender.com` ;
- dépôt et CI : `https://github.com/Aimeryy02/ShortLink`.

## 1. Référentiels retenus

### Sécurité

Le projet utilise l'OWASP Top 10:2025, version publiée la plus récente au moment
de l'audit :

`https://owasp.org/Top10/2025/`

Le Top 10 est utilisé comme grille de sensibilisation et de vérification des
mesures du prototype. Il ne constitue pas, à lui seul, une certification de
sécurité ni un test d'intrusion exhaustif.

### Accessibilité

Le projet retient le RGAA 4.1.2 :

`https://accessibilite.numerique.gouv.fr/`

Ce choix est adapté à une application française et fournit des critères et
tests techniques reproductibles. Le RGAA 5 étant annoncé pour fin 2026, le
RGAA 4.1.2 reste le référentiel en vigueur à la date du présent contrôle.

## 2. Modèle de menaces simplifié

### Actifs à protéger

- données de gestion des liens ;
- clé d'administration ;
- chaîne de déploiement et dépendances ;
- disponibilité du service ;
- données techniques des clics.

### Acteurs et surfaces exposées

- visiteur utilisant un lien court public ;
- administrateur utilisant le tableau de bord ;
- API publique accessible sur Internet ;
- dépendances npm et intégrations GitHub, Render et Vercel.

### Frontières de confiance

- les redirections, previews et QR sont publiques ;
- les opérations de création et de gestion sont privées ;
- la clé d'administration est saisie par l'administrateur et envoyée en HTTPS ;
- la valeur de référence existe uniquement dans `.env` et dans Render ;
- aucune clé n'est intégrée au build Vercel ni enregistrée dans Git.

## 3. Mesures couvrant l'OWASP Top 10:2025

| Risque | Mesures vérifiables dans ShortLink | Preuve principale |
|---|---|---|
| A01 — Broken Access Control | Les routes de création, liste, détail, modification, suppression et statistiques exigent `X-Admin-Key`. Les redirections et QR restent volontairement publics. | `adminAuthMiddleware.js`, `linkRoutes.js`, `statsRoutes.js` |
| A02 — Security Misconfiguration | Helmet, CORS limité, `trust proxy` en production, corps HTTP limité à 20 Ko, erreurs 500 génériques, limites API et redirections. | `app.js`, `cors.js`, `rateLimit.js`, `redirectRateLimit.js` |
| A03 — Software Supply Chain Failures | `package-lock.json`, installation reproductible, CI Node 22/24, audit npm et mises à jour contrôlées. L'audit du 24/07/2026 retourne 0 vulnérabilité connue. | `package-lock.json`, `.github/workflows/ci.yml`, sortie `npm audit` |
| A04 — Cryptographic Failures | HTTPS Render/Vercel, secret d'au moins 32 caractères, comparaison à temps constant après SHA-256, `.env` ignoré. Les IP sont pseudonymisées avant stockage. | `adminAuthMiddleware.js`, `analyticsService.js`, `.gitignore` |
| A05 — Injection | Schémas Zod, protocoles HTTP/HTTPS uniquement, alias borné, recherche limitée à 100 caractères et métacaractères de regex échappés. Aucun `eval`. | `linkValidation.js`, `linkService.js` |
| A06 — Insecure Design | Séparation public/administration, modèle de menaces, collisions contrôlées, liens expirés/désactivés bloqués et états non mis en cache. | routes, services et `redirectController.js` |
| A07 — Authentication Failures | Clé requise, longueur serveur minimale, message 401 générique, clé jamais journalisée, conservation limitée à `sessionStorage`, bouton de déconnexion. | middleware et écran « Accès administrateur » |
| A08 — Software or Data Integrity Failures | Git, historique de commits, CI bloquante, lockfile, builds Vite reproductibles et déploiements issus de `main`. | GitHub Actions, `package-lock.json` |
| A09 — Security Logging and Alerting Failures | Pino journalise les erreurs et les refus d'accès sans inclure le secret. Render centralise les journaux. Les notifications opérationnelles Render restent à capturer/configurer. | `logger.js`, middleware d'erreur, logs Render |
| A10 — Mishandling of Exceptional Conditions | Middleware d'erreur centralisé, validation des erreurs attendues, 503 si le secret serveur est absent/faible, suivi analytics non bloquant et route 404 contrôlée. | `errorMiddleware.js`, `adminAuthMiddleware.js`, tests Jest |

### Limites annoncées

- une clé d'administration unique convient au prototype mais ne remplace pas
  des comptes nominatifs, des rôles et une traçabilité par utilisateur ;
- le hash d'IP est une pseudonymisation, pas une anonymisation irréversible ;
- le Top 10 ne remplace pas un audit ASVS ou un test d'intrusion ;
- les alertes opérationnelles doivent être configurées dans Render pour
  compléter la journalisation.

## 4. Contrôle d'accès administrateur

### Génération locale d'une clé

Ne pas copier une clé depuis un document ou une capture. La générer localement :

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Ajouter la valeur obtenue :

- dans `.env` sous `ADMIN_API_KEY` ;
- dans Render > Environment sous la même clé ;
- jamais dans Vercel, GitHub, un PDF ou une capture.

### Comportement attendu

| Scénario | Résultat |
|---|---|
| `GET /health` sans clé | `200` |
| redirection `GET /:code` sans clé | publique |
| `GET /api/qr/:code` sans clé | publique |
| `GET /api/links` sans clé | `401` |
| clé erronée | `401`, aucune donnée |
| clé correcte | accès au tableau de bord |
| clé serveur absente ou trop courte | `503`, administration indisponible |

## 5. Accessibilité mise en œuvre

### Structure et contenus

- langue de page `fr` ;
- structure principale avec `main`, `section`, `article` et titres ordonnés ;
- textes de boutons explicites ;
- QR avec alternative textuelle contextualisée ;
- liens et URL longues capables de revenir à la ligne.

### Formulaires et retours

- chaque champ possède un `label` associé par `htmlFor` et `id` ;
- champs obligatoires signalés nativement ;
- aide de connexion reliée avec `aria-describedby` ;
- erreurs dynamiques avec `role="alert"` ;
- résultat de création avec `aria-live="polite"`.

### Navigation clavier et modales

- focus visible sur liens, boutons et champs ;
- ouverture avec focus placé dans la fenêtre ;
- focus contenu dans la modale avec `Tab` et `Maj+Tab` ;
- fermeture avec la croix, le bouton, le clic extérieur ou `Échap` ;
- retour du focus au déclencheur après fermeture ;
- modales déclarées avec `role="dialog"`, `aria-modal` et un nom accessible.

### Affichage et mouvement

- interface responsive vérifiée à 400 × 849 pixels ;
- zones d'action d'au moins 44 pixels ;
- zoom et retour à la ligne pris en charge ;
- règle `prefers-reduced-motion: reduce`.

## 6. Plan de vérification RGAA reproductible

Échantillon : l'unique page du tableau de bord et ses quatre états :

1. connexion administrateur ;
2. liste des liens ;
3. modale de création ;
4. modale de modification et messages d'indisponibilité.

| Contrôle | Procédure | Résultat attendu |
|---|---|---|
| Clavier | Parcourir toute la page avec `Tab`, `Maj+Tab`, `Entrée`, `Espace`, `Échap` | Toutes les actions sont atteignables, focus toujours visible |
| Modale | Ouvrir puis parcourir une modale | Focus piégé dans la modale puis restauré à la fermeture |
| Zoom | Chrome à 200 %, puis vue responsive 400 px | Aucun contenu ou bouton essentiel perdu |
| Mouvement réduit | Activer « Réduire les animations » dans le système | Pas d'animation non essentielle |
| Noms accessibles | Inspecter les champs et fenêtres dans DevTools Accessibility | Nom, rôle et état cohérents |
| Contrastes | Exécuter Lighthouse/axe et vérifier les alertes | Aucun contraste insuffisant non justifié |
| Audit automatisé | Lighthouse, catégorie Accessibility | Rapport conservé avec date et URL |

Un score Lighthouse ne suffit pas à déclarer une conformité RGAA complète. Les
contrôles manuels clavier, focus, zoom et restitution doivent accompagner le
rapport automatisé.

## 7. Tests et résultats techniques

Résultats du 24 juillet 2026 :

- 12 suites Jest réussies ;
- 70 tests réussis ;
- couverture : 91,98 % statements, 80 % branches, 98 % fonctions,
  93,43 % lignes ;
- build frontend Vite 8.1.5 réussi ;
- `npm audit` : 0 vulnérabilité connue.

Les tests couvrent notamment :

- comparaison et refus des clés administrateur ;
- configuration manquante ou trop faible ;
- absence de journalisation du secret ;
- échappement de la recherche MongoDB ;
- analyse bornée du User-Agent ;
- CORS, validation, expiration, désactivation et erreurs.

## 8. Captures à intégrer au PDF

1. `npm audit` montrant `0 vulnerabilities`.
2. CI GitHub Actions verte après la sécurisation.
3. Render avec `ADMIN_API_KEY` masquée et déploiement `Live`.
4. Requête `/api/links` sans clé retournant `401`.
5. Écran de connexion, puis tableau de bord après une clé correcte.
6. Lighthouse Accessibility avec URL et date visibles.
7. Navigation clavier avec focus visible dans une modale.
8. Vue responsive/zoom sans perte de contenu.

## 9. Conclusion prudente

Le prototype comporte des mesures explicites et testées pour chacune des dix
catégories OWASP 2025 et applique plusieurs exigences essentielles du
RGAA 4.1.2. La validation finale de C2.2.3 nécessite encore le déploiement de la
clé serveur et la conservation des preuves de contrôle RGAA en production.
