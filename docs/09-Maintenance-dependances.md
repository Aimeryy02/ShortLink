# Processus de mise à jour des dépendances — ShortLink

Date de mise à jour : 18 août 2026
Compétence visée : **C4.1.1** — gérer les mises à jour des dépendances et des
bibliothèques tierces.

Le processus décrit ici précise les trois éléments exigés : le **périmètre
logiciel concerné** (§ 1), la **fréquence** des vérifications (§ 2) et le **type
de mise à jour**, automatique ou manuel (§ 3). Les paragraphes suivants
détaillent l'évaluation d'impact (§ 4), le déroulement opératoire (§ 5) et deux
cas réels traités dans le projet (§ 6 et § 7), avant la première revue
Dependabot (§ 10) et les limites assumées (§ 11).

## 1. Périmètre logiciel concerné

| Périmètre | Contenu | Fichier de référence | Responsabilité |
|---|---|---|---|
| Dépendances d'exécution | 12 paquets npm : `express`, `mongoose`, `helmet`, `cors`, `zod`, `pino`, `express-rate-limit`, `qrcode`, `geoip-lite`, `dotenv`, `react`, `react-dom` | `package.json` → `dependencies` | Candidat |
| Dépendances de développement | `jest`, `vite` | `package.json` → `devDependencies` | Candidat |
| Dépendances transitives | 418 paquets installés au total | `package-lock.json` | Candidat (via les paquets directs) |
| Actions GitHub | `actions/checkout`, `actions/setup-node`, `actions/github-script`, `codecov/codecov-action` | `.github/workflows/*.yml` | Candidat |
| Environnement d'exécution Node.js | `>=22.12.0`, testé sur 22.x et 24.x | `package.json` → `engines`, matrice CI | Candidat |
| Plateformes d'hébergement | Render, Vercel, MongoDB Atlas | consoles des plateformes | Éditeurs (mises à jour subies) |

Le périmètre **maîtrisé** est donc constitué des paquets npm, des actions GitHub
et de la version de Node.js. Les mises à jour des plateformes sont hors contrôle :
elles sont **surveillées** par les sondes de supervision
(`docs/08-Supervision-alertes.md`), qui détectent une régression consécutive à
une évolution d'infrastructure.

### Contrainte structurante

`package-lock.json` est versionné et l'installation se fait par `npm ci` en
intégration continue comme en production. Une mise à jour n'a donc **aucun effet
tant que le lockfile n'est pas modifié et fusionné** : les montées de version
sont explicites, tracées dans Git et jamais implicites au déploiement.

## 2. Fréquence des mises à jour

| Contrôle | Fréquence | Déclencheur | Outil |
|---|---|---|---|
| Recherche de nouvelles versions npm | **hebdomadaire**, lundi 07:00 (Europe/Paris) | planifié | Dependabot (`.github/dependabot.yml`) |
| Audit de vulnérabilités | **hebdomadaire**, lundi 06:00 UTC | planifié | `.github/workflows/audit-dependances.yml` |
| Audit de vulnérabilités | **à chaque push et chaque demande de fusion** | événementiel | job `quality` de `.github/workflows/ci.yml` |
| Recherche de nouvelles versions des actions GitHub | **mensuelle** | planifié | Dependabot |
| Avis de sécurité critique | **immédiat** | notification GitHub | Dependabot security updates |
| Revue de la version de Node.js | **semestrielle**, et à chaque changement de statut LTS | calendrier | manuel |
| Revue des montées majeures en attente | **trimestrielle** | calendrier | manuel (§ 8) |

Le doublement de l'audit — planifié **et** événementiel — répond à une faille de
couverture réelle et démontrée : le job `quality` ne s'exécute qu'au push, si
bien qu'une vulnérabilité publiée alors qu'aucune ligne de code ne change n'était
signalée à personne. C'est exactement ce qui s'est produit (§ 6).

## 3. Type de mise à jour : automatique ou manuel

Le projet distingue trois régimes. Aucune montée de version n'atteint la
production sans intégration continue verte **et** fusion explicite par le
mainteneur : il n'y a **pas d'auto-fusion**, choix assumé pour un projet à un
seul mainteneur où une régression non détectée serait sans filet.

| Régime | Ce qui est automatisé | Ce qui reste manuel | Cas d'application |
|---|---|---|---|
| **Automatique surveillé** | Détection, création de la branche, de la demande de fusion et du commit ; exécution des 89 tests, du build et de l'audit | Lecture du journal des modifications, fusion | Correctifs et montées **mineures**, regroupées par périmètre (production / développement) |
| **Automatique de sécurité** | Idem, avec priorité immédiate dès la publication de l'avis | Vérification de l'absence de rupture, fusion, déploiement dans la journée | Vulnérabilité de niveau `moderate` ou supérieur |
| **Manuel encadré** | Détection uniquement (une demande de fusion par paquet) | Étude d'impact complète (§ 4), migration du code, essais, décision d'accepter ou de reporter | Montées **majeures** et changements de version de Node.js |

Les montées mineures et de correctif sont **regroupées** en une seule demande de
fusion par périmètre : leur risque est faible et la CI les valide d'un seul
tenant. Les montées majeures ne sont volontairement **pas** regroupées, afin que
chacune soit évaluée pour elle-même.

## 4. Grille d'évaluation d'impact

Toute montée de version est passée à cette grille avant décision :

| Critère | Question | Effet sur la décision |
|---|---|---|
| Nature du changement | Correctif, mineur ou majeur selon SemVer ? | Un majeur impose une étude complète |
| Position | Dépendance directe ou transitive ? | Une transitive se corrige par son parent, ou par un pincement de version |
| Criticité fonctionnelle | Le paquet touche-t-il la sécurité, les données ou les redirections ? | `helmet`, `mongoose`, `zod`, `express` exigent une vérification renforcée |
| Exigences d'environnement | Le nouveau paquet impose-t-il une version de Node.js plus élevée ? | Peut faire tomber une plateforme cible ou une entrée de la matrice CI |
| Nouvelles vulnérabilités | La montée **introduit-elle** des failles ? | Une montée qui dégrade la sécurité est refusée (§ 7) |
| Couverture de test | Le comportement concerné est-il couvert par les 89 tests ? | Sinon, ajouter un test avant d'accepter |
| Réversibilité | Le retour arrière est-il simple ? | Le lockfile versionné rend tout retour arrière atomique |
| Exposition réelle | La fonction vulnérable est-elle atteignable dans ShortLink ? | Sert à hiérarchiser, jamais à justifier l'inaction |

## 5. Déroulement opératoire

1. **Détection.** Demande de fusion Dependabot, ou signalement automatique de
   l'audit hebdomadaire (issue étiquetée `dependances` / `securite`), ou échec du
   job `quality`.
2. **Qualification.** Application de la grille du § 4 ; lecture du journal des
   modifications et de l'avis de sécurité.
3. **Vérification locale** lorsque la montée n'est pas triviale :

   ```bash
   npm audit                 # état des vulnérabilités
   npm outdated              # versions disponibles
   npm ci                    # installation reproductible depuis le lockfile
   npm test                  # 89 tests unitaires, 14 suites
   npm run build:frontend    # build Vite
   ```

4. **Validation par la CI.** Les 89 tests sur Node 22.x **et** 24.x, le build
   frontend et `npm audit --audit-level=moderate` — bloquant.
5. **Fusion** dans `main` avec un message de commit énonçant les versions et
   l'impact évalué.
6. **Déploiement continu.** Render et Vercel redéploient depuis `main` ; la sonde
   `/health/ready` confirme que le service reste apte.
7. **Traçabilité.** Entrée dans `CHANGELOG.md` et, pour une montée notable,
   mention dans le journal des versions.
8. **Retour arrière** si régression : `git revert` du commit de montée, le
   lockfile revenant à l'état antérieur (procédure de
   `docs/03-Manuel-mise-a-jour.md`).

## 6. Cas réel n° 1 — vulnérabilités accumulées sans changement de code

**Constat.** Le 24 juillet 2026, l'audit local du projet indiquait 0 vulnérabilité.
Le même jour, l'exécution de CI du commit `aea4aab` est passée **en échec** : le
job `quality` a détecté une vulnérabilité `moderate` publiée entre l'audit local
et le push. L'échec n'a pas été remarqué, car Render et Vercel déploient depuis
l'intégration GitHub, indépendamment des Actions : la production a été mise à
jour malgré une CI rouge.

Le 18 août 2026, sans qu'une seule ligne de code ait changé, le compte était
monté à **5 vulnérabilités** :

| Paquet | Version | Sévérité | Nature de la faille |
|---|---|---|---|
| `brace-expansion` | ≤ 1.1.17 | haute | Déni de service par expansion non bornée |
| `js-yaml` | 3.15.0 | haute | Consommation CPU quadratique sur `!!omap` |
| `nanoid` | < 3.3.18 | haute | Boucle infinie si la taille demandée est nulle |
| `mongoose` | 8.24.0 | modérée | Pollution de prototype via un chemin `__proto__` |
| `postcss` | ≤ 8.5.22 | modérée | Lecture de fichiers `.map` arbitraires |

**Évaluation d'impact.** Les cinq correctifs étaient des montées de **niveau
correctif**, toutes comprises dans les plages SemVer déjà déclarées :
`package.json` n'a pas eu à être modifié. Seul `mongoose` est une dépendance
directe critique (accès aux données), ce qui justifiait une attention
particulière ; les quatre autres sont transitives et issues de l'outillage.

**Traitement** (commit `5a3a278`) : `npm audit fix`, puis vérification par les
89 tests et le build frontend. Résultat : `npm audit` à **0 vulnérabilité** et CI
**verte** (exécution 32136925930).

**Correction du processus.** Ce cas a mis en évidence que l'audit ne doit pas
dépendre de l'activité de développement. Deux dispositifs ont été ajoutés :

- `.github/dependabot.yml` — surveillance hebdomadaire des versions npm et
  mensuelle des actions GitHub ;
- `.github/workflows/audit-dependances.yml` — audit planifié chaque lundi qui
  ouvre automatiquement un signalement étiqueté `dependances` / `securite` et le
  clôt une fois la situation résolue.

## 7. Cas réel n° 2 — une mise à jour mineure qui dégrade la sécurité

Ce cas illustre pourquoi la grille d'évaluation d'impact du § 4 ne peut pas être
remplacée par une automatisation aveugle.

**Constat.** `npm outdated` révélait que `geoip-lite` était installé en 1.2.2
alors que sa propre plage `^1.2.2` autorisait 1.4.10 : une montée mineure était
disponible et, en apparence, sans risque.

L'historique Git éclaire ce point : le commit `ce90682` du 24 juillet 2026 avait
justement **rétrogradé** `geoip-lite` de `^1.4.10` vers `^1.2.2` pour écarter
cette vulnérabilité. Mais le caret avait été conservé : la plage `^1.2.2`
autorisant toujours 1.4.10, **n'importe quel `npm update` ultérieur réintroduisait
la faille**. Le correctif de juillet était donc fragile, et c'est précisément ce
qui s'est produit lors de la revue du 18 août.

**Résultat de la montée.** Passer à `geoip-lite@1.4.10` a **introduit deux
vulnérabilités** via une dépendance transitive, `ip-address` :

- XSS dans les méthodes `Address6` génératrices de HTML (modérée) ;
- décodage des octets à zéro initial en décimal au lieu d'octal, permettant un
  contournement de frontière de confiance et une SSRF (haute).

**Analyse des issues de sortie.**

| Option | Effet sur la sécurité | Effet sur le projet | Décision |
|---|---|---|---|
| Rester en `geoip-lite@1.4.10` | 2 vulnérabilités dont 1 haute | La CI bloque (`--audit-level=moderate`) | Refusée |
| Corriger `ip-address` dans la branche 1.x | **Impossible** : `geoip-lite@1.4.10` fige `ip-address` à `5.8.9 - 5.9.4`, or le correctif est en 10.3.1 | — | Impossible |
| Monter en `geoip-lite@2.0.3` | Corrigée (`ip-address ^10.2.0`) | **Exige Node ≥ 24**, alors que le projet déclare `engines: >=22.12.0` et teste sur 22.x et 24.x : il faudrait abandonner le support de Node 22, LTS jusqu'en avril 2027 | Reportée |
| Pincer `geoip-lite` à 1.2.2 | 0 vulnérabilité : la version 1.2.2 est **hors** de la plage affectée (`1.3.0 - 2.0.1`) | Aucun changement fonctionnel ; usage limité à `geoip.lookup()` dans `analyticsService.js` | **Retenue** |

**Décision et mise en œuvre.** `geoip-lite` est **pincé à la version exacte
1.2.2** dans `package.json` (`"geoip-lite": "1.2.2"` au lieu de `"^1.2.2"`), afin
qu'aucune montée automatique ne réintroduise la faille. Le retrait du caret est
le cœur de la correction : c'est lui qui manquait au traitement du 24 juillet. Les autres montées
disponibles dans les plages déclarées ont, elles, été appliquées :
`helmet` 8.2.0 → 8.3.0 et `vite` 8.1.5 → 8.2.1.

**Exception documentée et datée.** Le pincement est une dette assumée, à revoir
lors de la revue trimestrielle et au plus tard à la fin du support de Node 22
(avril 2027) : à cette échéance, la montée `geoip-lite` 2.x accompagnée du
relèvement de `engines` et de la matrice CI devient la trajectoire naturelle.
Dependabot n'est **pas** configuré pour ignorer ce paquet : il continuera de
proposer la version majeure, ce qui garde la décision visible plutôt que
silencieuse.

**Vérification.** 89 tests réussis (14 suites), build Vite réussi, `npm ci`
cohérent avec le lockfile, `npm audit` à **0 vulnérabilité**.

## 8. Montées majeures en attente

Relevé du 18 août 2026 (`npm outdated`). Aucune de ces montées n'est appliquée :
chacune est une rupture de compatibilité qui doit être conduite comme une
évolution à part entière, hors de la fenêtre de certification.

| Paquet | Installé | Majeure disponible | Impact anticipé | Priorité |
|---|---|---|---|---|
| `express` | 4.22.2 | 5.2.1 (PR #9) | Changement de la gestion des routes et des erreurs asynchrones ; touche `app.js`, tous les routeurs et le middleware d'erreur | moyenne |
| `mongoose` | 8.24.3 | 9.9.3 | Modèle de connexion et options de requête ; touche les 2 modèles et 5 services | moyenne |
| `react` / `react-dom` | 18.3.1 | 19.2.8 | Nouveau moteur de rendu ; touche l'interface d'administration | basse |
| `zod` | 3.25.76 | 4.4.3 | Réécriture de l'API de schémas ; touche toute la validation d'entrée | moyenne |
| `jest` | 29.7.0 | 30.4.2 | Configuration et environnement de test ; touche les 14 suites | basse |
| `pino` | 9.14.0 | 10.3.1 (PR #3) | Format de sortie du journal ; touche la journalisation | basse |
| `express-rate-limit` | 7.5.1 | 8.6.2 (PR #7) | Options de limitation ; touche 2 configurations | basse |
| `dotenv` | 16.6.1 | 17.4.2 (PR #8) | Chargement de la configuration | basse |
| `geoip-lite` | 1.2.2 | 2.0.3 (PR #5) | **Exige Node ≥ 24** — voir § 7 | conditionnée à l'abandon de Node 22 |

Priorisation retenue : d'abord ce qui porte la sécurité et l'accès aux données
(`express`, `mongoose`, `zod`), ensuite l'outillage, enfin l'interface.

## 9. Traçabilité des mises à jour réalisées

| Date | Commit | Périmètre | Type | Vérification |
|---|---|---|---|---|
| 24/07/2026 | `ce90682` | Retrait de `bcryptjs` et `useragent`, `vite` 5 → 8, rétrogradation de `geoip-lite` en `^1.2.2` | mineur + majeur | `npm audit` à 0 le jour même (correctif fragile, voir § 7) |
| 18/08/2026 | `5a3a278` | `brace-expansion`, `js-yaml`, `mongoose`, `nanoid`, `postcss` | correctif | 89 tests, build, `npm audit` à 0, CI verte |
| 18/08/2026 | voir § 7 | `helmet` 8.3.0, `vite` 8.2.1, pincement de `geoip-lite` à 1.2.2 | mineur + pincement | 89 tests, build, `npm ci`, `npm audit` à 0 |

## 10. Première revue Dependabot — 18 août 2026

La surveillance a produit ses premiers résultats dès sa mise en service : **8
demandes de fusion** ont été ouvertes automatiquement. Leur traitement illustre
les trois régimes du § 3.

| Demande | Paquet | De → vers | Type | Régime | Décision |
|---|---|---|---|---|---|
| #2 | `actions/setup-node` | 6 → 7 | majeur | automatique surveillé | **à fusionner** — portée limitée à la CI, tous les contrôles verts |
| #4 | `codecov/codecov-action` | 6 → 7 | majeur | automatique surveillé | **à fusionner** — idem |
| #6 | `actions/checkout` | 6 → 7 | majeur | automatique surveillé | **à fusionner** — idem |
| #5 | `geoip-lite` | 1.2.2 → 2.0.3 | majeur | manuel encadré | **à refuser** — exige Node ≥ 24 (voir § 7) |
| #3 | `pino` | 9.14.0 → 10.3.1 | majeur | manuel encadré | **reportée** à la revue trimestrielle |
| #7 | `express-rate-limit` | 7.5.1 → 8.6.2 | majeur | manuel encadré | **reportée** |
| #8 | `dotenv` | 16.6.1 → 17.4.2 | majeur | manuel encadré | **reportée** |
| #9 | `express` | 4.22.2 → 5.2.1 | majeur | manuel encadré | **reportée** — refonte du routage et des erreurs asynchrones |

Aucune demande regroupée n'a été produite : au moment de la revue, toutes les
montées mineures et correctives disponibles avaient déjà été appliquées
manuellement (§ 7), si bien qu'il ne restait que des majeures — que le processus
traite volontairement une par une.

### Une intégration continue verte ne prouve pas la compatibilité d'environnement

Constat marquant de cette revue : la demande #5 affiche **tous ses contrôles au
vert**, y compris les tests sur Node 22.x, alors que `geoip-lite@2.0.3` déclare
`engines: node >=24.0.0`. Explication : npm traite le champ `engines` comme un
simple avertissement, sauf si l'option `engine-strict` est activée. Une
incompatibilité d'environnement aurait donc pu être fusionnée sans qu'aucun
contrôle ne s'y oppose, pour ne se manifester qu'à l'exécution.

Garde-fou ajouté : un fichier `.npmrc` à la racine du projet contenant

```
engine-strict=true
```

Désormais, `npm ci` **échoue** — en intégration continue comme en local — si un
paquet exige une version de Node.js incompatible avec celle utilisée.

Vérification du mécanisme, réalisée en portant temporairement la contrainte du
projet à une valeur impossible (`node >=99.0.0`) :

```
npm error code EBADENGINE
npm error engine Unsupported engine
npm error notsup Required: {"node":">=99.0.0"}
npm error notsup Actual:   {"node":"v24.14.1","npm":"11.11.0"}
```

Avec la contrainte réelle (`>=22.12.0`), `npm ci` s'exécute normalement, et aucun
des paquets installés n'exige Node ≥ 23 : le garde-fou n'introduit donc aucune
régression. Sa conséquence attendue est que la demande #5 passera au **rouge**,
ce qui matérialise dans l'outillage une décision jusqu'ici seulement documentée.

## 11. Limites du processus

1. **Pas d'auto-fusion** : chaque montée demande une action humaine. C'est un
   choix de sûreté pour un mainteneur unique, mais cela crée un délai dépendant
   de sa disponibilité.
2. **Les workflows planifiés sont suspendus** par GitHub après 60 jours
   d'inactivité sur le dépôt : après une longue pause, la surveillance doit être
   réactivée manuellement.
3. **`npm audit` ne couvre que les vulnérabilités publiées** dans le registre
   npm : il ne détecte ni une dépendance abandonnée, ni un paquet compromis dont
   l'avis n'est pas encore paru.
4. **Le seuil est fixé à `moderate`** : les avis `low` n'interrompent pas la
   chaîne, ils sont traités lors de la revue trimestrielle.
5. **Les mises à jour des plateformes** (Render, Vercel, Atlas) sont subies ;
   seules leurs conséquences sont détectables, par la supervision.
6. **La couverture de test ne détecte pas tout** : une incompatibilité
   d'environnement n'apparaît pas nécessairement dans les 89 tests. C'est
   `engine-strict` (§ 10), et non la suite de tests, qui protège de ce cas.
