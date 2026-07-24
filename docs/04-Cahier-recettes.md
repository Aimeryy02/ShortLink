# Cahier de Recettes — ShortLink

## Contexte d'exécution

| Élément | Valeur |
|---|---|
| **Date d'exécution** | 24 juillet 2026 |
| **Testeur** | Aimery Garcia |
| **Environnement** | Local — Node.js 24.14.1, serveur `http://localhost:3000` |
| **Base de données** | MongoDB Atlas, base dédiée `shortlink_recette` (isolée de la production) |
| **Authentification** | Clé d'administration via en-tête `X-Admin-Key` |
| **Méthode** | Script Node reproductible (`fetch`) exécutant chaque recette et relevant le code HTTP et le corps de réponse réels |
| **Résultat global** | 24 / 24 recettes conformes (22 API/sécurité + 2 accessibilité) |

Les recettes fonctionnelles, de validation et de sécurité ci-dessous ont été
**exécutées** contre une base MongoDB réelle et l'API en fonctionnement. Les
routes indiquées sont les routes réellement servies par l'application. Les
recettes d'accessibilité (REC-019, REC-020) ont été **exécutées via un parcours
navigateur automatisé (Puppeteer sur Chrome) et un audit Lighthouse** ; les
captures et rapports sont conservés dans `perso/preuves/`.

> Remarque : les valeurs d'identifiants et de codes courts ci-dessous
> (`sNK9Po`, `rec-alias-310600`, etc.) sont celles réellement générées lors de
> l'exécution du 24 juillet 2026.

## 1. Authentification (contrôle d'accès)

| ID | Scénario | Route réelle | Attendu | Obtenu | Statut |
|---|---|---|---|---|---|
| AUTH-1 | Liste sans clé | `GET /api/links` | `401` | `401` — « Invalid administration key » | ✅ |
| AUTH-2 | Liste avec clé erronée | `GET /api/links` (clé invalide) | `401` | `401` — « Invalid administration key » | ✅ |
| AUTH-3 | Liste avec clé valide | `GET /api/links` (`X-Admin-Key`) | `200` | `200` — liste renvoyée | ✅ |

## 2. Recettes fonctionnelles

| ID | Scénario | Route réelle | Attendu | Obtenu | Statut |
|---|---|---|---|---|---|
| REC-001 | Créer un lien (code généré) | `POST /api/shorten` `{originalUrl}` | `201` + `shortCode` 6 caractères | `201`, `shortCode=sNK9Po` | ✅ |
| REC-002 | Créer avec alias personnalisé | `POST /api/shorten` `{originalUrl, customAlias}` | `201`, `shortUrl` finissant par l'alias | `201`, `shortUrl=…/rec-alias-310600` | ✅ |
| REC-005 | Rediriger vers l'URL originale | `GET /:code` | `302` + `Location` | `302`, `Location=https://google.com` | ✅ |
| REC-006 | Page de prévisualisation | `GET /:code+` | `200` HTML | `200`, `text/html` | ✅ |
| REC-009 | Générer le QR code | `GET /api/qr/:code` | `200` `image/png` | `200`, `image/png` | ✅ |
| REC-010 | QR code taille 600 | `GET /api/qr/:code?size=600` | `200` `image/png` | `200`, `image/png` | ✅ |
| REC-011 | Compteur de clics | `GET /:code` puis `GET /api/links/:id` | `clicks` augmente | clics `1 → 3` après deux redirections | ✅ |
| REC-012 | Statistiques d'un lien | `GET /api/links/:id/stats` | `200` + agrégats | `200`, clés `totalClicks, clicksByDay, clicksByCountry, clicksByBrowser, clicksByDevice, topReferers` | ✅ |
| REC-013 | Pagination de la liste | `GET /api/links?page=1&limit=2` | `200` + pagination | `200`, `page=1 limit=2 pages=3` | ✅ |
| REC-014 | Recherche | `GET /api/links?search=Google` | `200` + résultats filtrés | `200`, 2 résultats | ✅ |
| REC-015 | Modifier un lien | `PATCH /api/links/:id` `{title}` | `200`, titre mis à jour | `200`, `title="Titre recette"` | ✅ |
| REC-016 | Supprimer un lien (API) | `DELETE /api/links/:id` | `200` puis `404` | `delete=200`, `get après=404` | ✅ |

> Note de périmètre : la pagination (REC-013), la recherche (REC-014) et la
> suppression (REC-016) sont disponibles au niveau de l'API mais ne sont pas
> exposées dans l'interface de cette version du prototype (voir manuel
> d'utilisation).

## 3. Recettes d'expiration et d'activation

| ID | Scénario | Route réelle | Attendu | Obtenu | Statut |
|---|---|---|---|---|---|
| REC-007 | Bloquer un lien expiré | `GET /:code` (`expiresAt` passée) | `410` | `410` — « Link expired » | ✅ |
| REC-008 | Bloquer un lien désactivé | `PATCH isActive:false` puis `GET /:code` | `403` | `patch=200`, redirect `403` — « Link is disabled » | ✅ |

## 4. Recettes de validation et de sécurité

| ID | Scénario | Route réelle | Attendu | Obtenu | Statut |
|---|---|---|---|---|---|
| REC-003 | Rejeter un alias déjà pris | `POST /api/shorten` (alias existant) | `400` | `400` — « Custom alias is already taken » | ✅ |
| REC-004 | Bloquer une URL signalée phishing | `POST /api/shorten` `{originalUrl: https://phishing-test.com}` | `403` | `403` — « URL detected as phishing » | ✅ |
| REC-018 | Rejeter une URL non http/https | `POST /api/shorten` `{originalUrl: ftp://…}` | `400` | `400` — « Validation failed » | ✅ |
| REC-010b | Rejeter une taille de QR invalide | `GET /api/qr/:code?size=999` | `400` | `400` — « Invalid QR code size. Allowed values are 200, 400 or 600 » | ✅ |
| REC-017 | Limitation de requêtes | `GET /api/links` répété (instance limite=3) | `429` après la limite | requêtes 1-3 `200`, requêtes 4-6 `429` | ✅ |

## 5. Recettes d'accessibilité — exécutées (navigateur + Lighthouse)

Exécutées le 24 juillet 2026 via un parcours automatisé Puppeteer (Chrome) sur
l'application locale et un audit Lighthouse. Preuves : `perso/preuves/` (captures
`01`→`05`, rapports `lighthouse-*.html`, `e2e-report.json`).

| ID | Scénario | Procédure | Attendu | Obtenu | Statut |
|---|---|---|---|---|---|
| REC-019 | Navigation clavier / focus | Ouvrir une modale au clavier, `Tab`/`Maj+Tab`, `Échap` | Focus piégé, restauré au déclencheur, focus visible | Focus piégé **8/8** dans le dialog, `Échap` ferme et **restaure le focus** sur « Créer un lien », focus visible (outline `3px solid`) | ✅ |
| REC-020 | Contraste / audit automatisé | Lighthouse catégorie Accessibility | Score élevé, contrastes conformes | Prod initiale **94/100** (1 échec contraste sur le vert `#16a34a`) → après correction (`#15803d`) **100/100, 0 échec** (vérifié en local) | ✅ |

> Deux corrections d'accessibilité ont découlé de ces recettes :
> - **contraste** : vert de marque assombri `#16a34a` → `#15803d` (≥ 4.5:1) ;
> - **restauration du focus** après fermeture de modale (voir BUG-007 du plan de
>   correction des bogues).
>
> Ces corrections sont dans le code ; le **redéploiement** du frontend est
> nécessaire pour que la production reflète le score 100/100.

## 6. Résumé

| Catégorie | Total | Exécutées conformes | À exécuter |
|---|---|---|---|
| Authentification | 3 | 3 | 0 |
| Fonctionnel | 12 | 12 | 0 |
| Expiration / activation | 2 | 2 | 0 |
| Validation / sécurité | 5 | 5 | 0 |
| Accessibilité | 2 | 2 | 0 |
| **Total** | **24** | **24** | **0** |

**Statut** : les 24 recettes ont été **exécutées et sont conformes**
(fonctionnelles, validation, sécurité et authentification contre une base
MongoDB réelle ; accessibilité via parcours navigateur et Lighthouse). Réserve :
les deux correctifs d'accessibilité (contraste, restauration du focus) doivent
être **redéployés** pour que la production affiche le score 100/100.

## 7. Reproductibilité

1. Configurer `.env` avec `MONGO_URI` et une `ADMIN_API_KEY` d'au moins
   32 caractères.
2. Démarrer le serveur : `npm start`.
3. Exécuter chaque scénario ci-dessus avec l'en-tête `X-Admin-Key` pour les
   routes de gestion (exemple avec `curl` dans le manuel de déploiement).
4. Pour REC-017, réduire temporairement `RATE_LIMIT_MAX_REQUESTS` et répéter la
   requête jusqu'au `429`.
5. Relever le code HTTP et le corps de réponse réels, puis conserver les
   captures avec date et environnement.
