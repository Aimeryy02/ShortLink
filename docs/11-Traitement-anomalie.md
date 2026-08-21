# Traitement d'une anomalie par la chaîne d'intégration et de déploiement continu — ShortLink

Date de mise à jour : 18 août 2026
Compétence visée : **C4.2.2** — créer et déployer un correctif en respectant le
processus d'intégration et de déploiement continu.

Ce document présente le traitement de bout en bout de **deux anomalies réellement
rencontrées** au cours du projet, consignées dans `docs/10-Gestion-anomalies.md` :

- **ANO-2026-07-008** — hiérarchie de titres non séquentielle sur le tableau de
  bord, détectée en production (§ 3, traitement détaillé) ;
- **ANO-2026-08-002** — montée mineure de `geoip-lite` réintroduisant une
  vulnérabilité haute (§ 4, traitement résumé).

Toutes les dates et durées de ce document sont issues de l'API GitHub et de
l'historique Git ; elles sont vérifiables sur le dépôt.

## 1. La chaîne d'intégration et de déploiement continu

### Composants

| Étape | Déclencheur | Outil | Rôle dans le traitement d'une anomalie |
|---|---|---|---|
| Intégration continue | push ou demande de fusion | GitHub Actions, `ci.yml` | 4 jobs : tests sur Node 22.x, tests sur Node 24.x, build frontend, audit de sécurité |
| Déploiement de l'API | push sur `main` | Intégration Render ↔ GitHub | Reconstruit et remet en ligne le service Node.js |
| Déploiement du frontend | push sur `main` | Intégration Vercel ↔ GitHub | Reconstruit le bundle Vite et le publie sur le CDN |
| Vérification post-déploiement | planifié et à la demande | `supervision.yml` | Confirme que le service reste apte après mise en ligne |

### Une caractéristique structurante, mesurée

Le déploiement **n'est pas conditionné au résultat de l'intégration continue**.
Render et Vercel sont branchés sur le dépôt et réagissent au push, en parallèle
des Actions, non à leur suite. Les mesures le montrent sans ambiguïté :

| Anomalie | Commit | Poussé à | CI démarrée | Déploiement enregistré `success` | CI conclue |
|---|---|---|---|---|---|
| ANO-2026-07-008 | `aea4aab` | 17:18:11Z | 17:18:20Z | **17:18:28Z** | 17:18:51Z (échec) |
| ANO-2026-08-002 | `5a3a278` | 12:26:21Z | 12:27:29Z | **12:27:36Z** | 12:28:03Z (succès) |
| ANO-2026-08-002 | `59df1ff` | 13:31:39Z | 13:31:45Z | **13:31:54Z** | 13:32:16Z (succès) |

Sur les trois déploiements mesurés, le déploiement est enregistré comme réussi
**22 à 27 secondes avant que la CI ne rende son verdict**. Les horodatages de déploiement
sont ceux que la plateforme déclare à GitHub (API `deployments/:id/statuses`) ;
ils datent le franchissement de l'étape, non la durée de construction.

Cette caractéristique est assumée et documentée ici plutôt que passée sous
silence : elle a une conséquence réelle, analysée au § 6,
et un axe d'amélioration chiffré dans `docs/12-Axes-amelioration.md`.

## 2. Ordre de traitement retenu

Le processus appliqué aux deux anomalies est le même, et suit le manuel
`docs/03-Manuel-mise-a-jour.md` :

1. reproduire l'anomalie et localiser la cause racine (consigné dans la fiche) ;
2. écrire le correctif minimal qui traite la cause, pas le symptôme ;
3. **vérifier localement** avant tout push : tests, build, contrôle spécifique de
   l'anomalie ;
4. pousser, et laisser la chaîne valider et déployer ;
5. **vérifier la résolution dans l'environnement où l'anomalie avait été
   constatée** ;
6. clôturer : documentation, journal des versions, traçabilité du commit.

## 3. Traitement de ANO-2026-07-008

### 3.1 Rappel de l'anomalie

Fiche complète : `docs/10-Gestion-anomalies.md`, § 7.

Audit Lighthouse sur le tableau de bord **connecté en production** : score
Accessibility **96**, audit en échec « Heading elements are not in a
sequentially-descending order ». La séquence réelle du document était `h1`
(« Liens créés ») puis directement `h3` (titre de chaque carte de lien).

Cause racine : le niveau de titre avait été choisi pour sa **taille visuelle** et
non pour sa **valeur sémantique**.

### 3.2 Le correctif

Commit `aea4aab` — *fix: hierarchie des titres du tableau de bord (accessibilite
RGAA, BUG-008)*, 24 juillet 2026.

Le correctif de code tient en **une ligne** dans `client/src/main.jsx` :

```diff
-                  <h3>{link.title || 'Sans titre'}</h3>
+                  <h2 className="link-title">{link.title || 'Sans titre'}</h2>
```

complétée par cinq lignes dans `client/src/styles.css` :

```css
.link-title {
  margin: 0 0 4px;
  font-size: 1.15rem;
  font-weight: 700;
}
```

### 3.3 Pourquoi ce correctif résout l'anomalie

Le correctif **sépare deux choses que le code confondait** :

| Besoin | Avant | Après |
|---|---|---|
| Exprimer la structure du document | `<h3>` — faux : il n'existe pas de niveau 2 intermédiaire | `<h2>` — la séquence devient `h1 → h2` |
| Obtenir une taille de titre plus discrète | `<h3>` (effet de bord de la balise) | classe `.link-title` dans la feuille de style |

Conséquence directe : la hiérarchie annoncée par un lecteur d'écran correspond à
la structure réelle de la page, et le rendu visuel est **inchangé pour l'œil**.
C'est ce dernier point qui rend le correctif sans risque de régression
d'interface : aucun utilisateur ne voit de différence, seule la sémantique change.

Le périmètre du commit est resté volontairement étroit : 2 fichiers de code pour
6 lignes, plus la mise à jour de `docs/05` et `docs/06`. Un correctif étroit est
un correctif dont on peut affirmer qu'il n'a rien cassé d'autre.

### 3.4 Vérifications avant le push

| Vérification | Moyen | Résultat |
|---|---|---|
| Séquence des titres du tableau de bord | Contrôle automatisé du document rendu (navigateur sans interface) sur la pile locale, après connexion | `h1 → h2`, **aucun saut de niveau** |
| Absence de régression fonctionnelle | Suite Jest complète | 70 tests réussis (état du 24/07) |
| Construction du frontend | `npm run build:frontend` | build Vite réussi |

Le premier contrôle est le plus important : il porte **exactement** sur l'audit
qui avait échoué. Se contenter des tests unitaires aurait laissé l'anomalie
invérifiée, puisque aucun test ne portait sur la hiérarchie des titres.

### 3.5 Ce que la chaîne a fait

| Horodatage | Événement | Résultat |
|---|---|---|
| 17:18:11Z | Commit `aea4aab` poussé sur `main` | — |
| 17:18:20Z | Démarrage de `CI - Test & Build` (run `30112470979`) | — |
| 17:18:27Z | Déploiement Production créé par l'intégration Vercel | — |
| 17:18:28Z | Déploiement rapporté à GitHub | état **success** |
| 17:18:51Z | Fin de la CI (31 s) | `test (22.x)` ✅ · `test (24.x)` ✅ · `build-frontend` ✅ · `quality` ❌ |

**Le job `quality` a échoué, et il faut le dire précisément.** Sa cause n'a aucun
rapport avec le correctif : `npm audit --audit-level=moderate` a détecté une
vulnérabilité `moderate` publiée dans une dépendance entre l'audit local du matin
et le push du soir. Les trois jobs qui validaient effectivement le correctif — les
tests sur les deux versions de Node et la construction du frontend — étaient
verts.

Cet échec a néanmoins révélé deux faiblesses du dispositif de l'époque, l'une et
l'autre corrigées depuis :

1. **personne n'était prévenu** d'un échec de CI, faute d'alerte planifiée → mise
   en place de l'audit hebdomadaire et de Dependabot
   (`docs/09-Maintenance-dependances.md`, § 6) ;
2. **le déploiement n'attend pas la CI**, donc une CI rouge n'empêche pas la mise
   en ligne → analysé au § 6 ci-dessous.

### 3.6 Vérification de la résolution en production

L'anomalie ayant été constatée sur la production, elle a été vérifiée close sur
la production.

| Contrôle | Avant | Après |
|---|---|---|
| Lighthouse Accessibility, tableau de bord connecté | **96** | **100** |
| Audit « sequentially-descending order » | en échec | passant |
| Lighthouse Accessibility, page publique | 100 | 100 (non régressé) |

Preuve : `perso/preuves/13-prod-lighthouse-100-C2.2.3.png`.

Contre-vérification effectuée le **18 août 2026**, soit 25 jours après le
déploiement, directement sur les fichiers servis par le CDN :

```
GET https://short-link-omega.vercel.app/assets/index-DEBVEcjo.css
  .link-title{margin:0 0 4px;font-size:1.15rem;font-weight:700}

GET https://short-link-omega.vercel.app/assets/index-FT_8mQWS.js
  jsx(`h2`,{className:`link-title`,children:e.title||`Sans titre`})
```

Le correctif est donc bien celui qui est **actuellement exécuté par les
utilisateurs**, et pas seulement celui qui est présent dans le dépôt. La
distinction compte : un correctif fusionné mais non déployé ne résout rien.

### 3.7 Clôture et traçabilité

| Élément | Emplacement |
|---|---|
| Fiche de consignation | `docs/10-Gestion-anomalies.md`, § 7 |
| Correctif | commit `aea4aab` |
| Fiche technique du bogue | `docs/05-Plan-correction-bugs.md`, BUG-008 |
| Conséquence sur l'audit d'accessibilité | `docs/06-Securite-Accessibilite.md`, § 9 |
| Journal des versions | `CHANGELOG.md`, entrée 1.0.1 |
| Preuve en production | `perso/preuves/13-prod-lighthouse-100-C2.2.3.png` |

## 4. Traitement de ANO-2026-08-002

Deuxième cas, retenu parce qu'il montre la même chaîne **de bout en bout au
vert**, et qu'il porte sur une anomalie de nature différente : une régression de
sécurité, sans symptôme visible à l'écran.

Fiche complète : `docs/10-Gestion-anomalies.md`, § 8.

### 4.1 Le correctif, en deux commits

Le traitement a été délibérément scindé, parce qu'il répond à deux problèmes
distincts qui méritent des messages de commit distincts :

| Commit | Objet | Nature du correctif |
|---|---|---|
| `5a3a278` | Correction des 5 vulnérabilités relevées par `npm audit` | Montées de niveau correctif, dans les plages semver déjà déclarées |
| `59df1ff` | Pincement de `geoip-lite` à `1.2.2` **exact** et `engine-strict=true` dans `.npmrc` | Traite la **cause racine procédurale** : le caret laissait revenir la version vulnérable |

Le second commit est celui qui résout réellement l'anomalie. Le premier ne faisait
que rétablir l'état sain ; sans le retrait du caret, le prochain `npm update`
aurait défait le travail — c'est précisément ce qui était arrivé au correctif du
24 juillet (commit `ce90682`).

### 4.2 Vérifications et chaîne

| Horodatage | Événement | Résultat |
|---|---|---|
| 13:31:39Z | Commit `59df1ff` poussé sur `main` | — |
| 13:31:45Z | Démarrage de la CI (run `32142887020`) | — |
| 13:31:54Z | Déploiement Production créé et rapporté | état **success** |
| 13:32:16Z | Fin de la CI (31 s) | **tous les jobs verts** |

Vérifications associées :

| Vérification | Résultat |
|---|---|
| `npm audit` | **0 vulnérabilité** (contre 2, dont 1 haute) |
| Suite Jest | 89 tests réussis, 14 suites |
| Build frontend | réussi |
| `npm ci` | cohérent avec le lockfile |
| Tests sur Node 22.x **et** 24.x en CI | verts — confirme que `engine-strict` n'a pas cassé le support de Node 22 |
| Sonde de production `GET /health/ready` | `200`, `"status":"ready"`, version **1.1.0** |

La dernière ligne est ce qui distingue une chaîne de déploiement continu d'un
simple `git push` : la **sonde d'aptitude** confirme, après mise en ligne, que le
service reste opérationnel — MongoDB joignable, configuration présente.

## 5. Ce que la chaîne a réellement apporté

| Sans intégration et déploiement continus | Avec, tel que mesuré ici |
|---|---|
| Vérifier à la main sur une seule version de Node | Tests exécutés sur Node **22.x et 24.x** à chaque push, sans y penser |
| Se souvenir de reconstruire le frontend | Build Vite vérifié automatiquement |
| Auditer les dépendances quand on y pense | `npm audit` bloquant à chaque push, plus un audit hebdomadaire planifié |
| Déployer manuellement, avec le risque d'oublier une étape | Déploiement déclenché par le seul push, rapporté en succès **17 s plus tard**, à l'identique chaque fois |
| Croire que le correctif est en ligne | Sonde `/health/ready` et contrôle des fichiers servis par le CDN |
| Retrouver ce qui a été corrigé, plus tard | Commit → fiche → CHANGELOG → déploiement, tous reliés et datés |

Le gain le plus concret dans le cas ANO-2026-07-008 : **aucune étape de mise en
production n'a été exécutée à la main** — le push a suffi, la plateforme a
rapporté le déploiement réussi 17 secondes plus tard, et la non-régression sur
deux versions de Node a été obtenue sans qu'aucune action soit demandée.

## 6. Limite identifiée et correction proposée

**Constat.** Le déploiement ne dépend pas du résultat de l'intégration continue
(§ 1). En juillet, un commit dont la CI a fini rouge a été mis en production. Le
correctif lui-même était bon — les jobs qui le validaient étaient verts — mais
c'est un coup de chance procédural, non une garantie.

**Trois corrections possibles**, par coût croissant :

| Correction | Effet | Coût |
|---|---|---|
| Régler le *Health Check Path* de Render sur `/health/ready` | Un déploiement d'API non apte n'est pas mis en ligne — protège contre une configuration perdue ou une base injoignable, pas contre une régression fonctionnelle | quelques minutes, déjà préconisé dans `docs/08-Supervision-alertes.md`, § 10 |
| Protéger la branche `main` : fusion par demande de fusion uniquement, avec `status-checks` en contrôle requis | Aucun code ne peut atteindre `main`, donc la production, sans CI verte. C'est la correction qui traite réellement la cause | faible, mais impose de passer par une PR pour chaque modification |
| Déclencher le déploiement depuis GitHub Actions après succès de la CI (crochets de déploiement Render et Vercel) | Contrôle total de l'ordre des opérations | plus élevé : il faut gérer les secrets de déploiement et perdre les prévisualisations automatiques |

**Recommandation** : les deux premières, la protection de branche étant celle qui
traite la cause. Elle est d'ailleurs cohérente avec le manuel
`docs/03-Manuel-mise-a-jour.md`, qui décrit déjà un flux par demande de fusion —
flux que l'historique de `main` ne respecte pas encore systématiquement.

Chiffrage et priorisation : `docs/12-Axes-amelioration.md`.

## 7. Bilan face aux critères de la compétence

| Critère d'évaluation | Réponse |
|---|---|
| « Le traitement de l'anomalie tire profit du processus d'intégration et de déploiement continu » | § 3.5 et § 4.2 : chronologies mesurées à la seconde, tests sur deux versions de Node, build et audit automatiques, mise en ligne automatique, sonde de vérification après déploiement. § 5 : comparaison de ce que la chaîne apporte, poste par poste |
| « Le correctif mis en place est décrit » | § 3.2 : le diff exact ; § 3.3 : le raisonnement — séparer la structure sémantique de l'apparence ; § 4.1 : les deux commits et pourquoi le second est celui qui résout la cause |
| « et permet la résolution de l'anomalie » | § 3.6 : Lighthouse 96 → 100 sur l'environnement même où l'anomalie avait été constatée, puis contre-vérification 25 jours plus tard sur les fichiers réellement servis aux utilisateurs. § 4.2 : `npm audit` de 2 vulnérabilités à 0, sonde de production `ready` |
| Honnêteté du compte rendu | § 3.5 : l'échec du job `quality` est exposé, sa cause établie, et les deux faiblesses qu'il a révélées sont documentées avec leur correction. § 6 : la limite structurelle de la chaîne est nommée et chiffrée au lieu d'être omise |
