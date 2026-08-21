# Axes d'amélioration — ShortLink

Date de mise à jour : 19 août 2026
Compétence visée : **C4.3.1** — proposer des axes d'amélioration en prenant en
compte les indicateurs de performance et en analysant les retours utilisateurs.

Chaque recommandation part d'un **constat chiffré** (§ 1) ou d'un **retour d'usage
réel** (§ 2), et se présente avec son gain attendu, son coût et son délai (§ 3).
Le § 6 expose les pistes **écartées** avec la raison du refus : une liste de
souhaits sans arbitrage ne serait pas un plan.

## 1. Indicateurs de performance mesurés

Toutes les valeurs ci-dessous ont été mesurées les 18 et 19 août 2026 sur la
production ou sur la construction du projet. Aucune n'est estimée.

### Perception par l'utilisateur — audit Lighthouse en production

Page publique `https://short-link-omega.vercel.app`, 19 août 2026 :

| Métrique | Valeur mesurée |
|---|---|
| **Score Performance** | **98 / 100** |
| Score Accessibility | 100 / 100 |
| First Contentful Paint | 1,3 s |
| Largest Contentful Paint | 1,4 s |
| Total Blocking Time | 170 ms |
| Cumulative Layout Shift | 0 |
| Speed Index | 1,6 s |
| Poids total transféré | **53 KiB** |

Ce constat est important pour la suite : **la performance perçue du frontend n'est
pas un problème**. Toute recommandation portant sur son optimisation serait un
effort sans bénéfice utilisateur mesurable.

### Temps de réponse de l'API (service réveillé, 5 mesures par cible)

| Cible | TTFB médian | Étendue observée |
|---|---|---|
| `GET /health` | ~85 ms | 69 – 146 ms |
| `GET /health/ready` (avec `ping` MongoDB) | ~109 ms | 74 – 134 ms |
| `GET /<code>` inexistant (lecture en base + 404) | ~108 ms | 82 – 115 ms |
| Frontend Vercel (CDN) | ~60 ms | 50 – 393 ms |
| Latence MongoDB Atlas (`probes[mongodb].latencyMs`) | 10 ms | 10 – 13 ms |

### Démarrage à froid

| Indicateur | Valeur mesurée |
|---|---|
| Premier appel après mise en veille (offre Render gratuite) | **22,4 s** |
| Rapport entre l'appel à froid et l'appel à chaud | **~260 ×** |

### Poids du frontend, et un écart entre environnements

| Mesure | Brut | gzip | brotli |
|---|---|---|---|
| Bundle **servi en production** (construit par Vercel) | **153 784 o** | 49,6 ko | 50,8 ko |
| Bundle produit par `npm run build:frontend` **en local** | **329 570 o** | 98,9 ko | 80,9 ko |

Le même code source produit donc deux artefacts de tailles très différentes selon
l'environnement de construction. Ce constat est analysé en **R3**.

Pour situer : le code source de l'application est de 21,9 ko
(`client/src/main.jsx`), et React plus react-dom en versions de production
minifiées pèsent 136 ko brut. Le bundle de production de 150 ko est donc conforme
à l'attendu ; c'est le bundle local qui est anormal.

### Qualité et chaîne de production

| Indicateur | Valeur mesurée |
|---|---|
| Tests unitaires | 89 tests, 14 suites, tous verts |
| Couverture des instructions | 93,05 % |
| Durée d'une exécution d'intégration continue | 31 – 38 s |
| Vulnérabilités connues (`npm audit`) | 0 |
| Sondes de disponibilité | 4 contrôles verts |
| Délai de détection d'un incident | ≤ 30 min |

## 2. Analyse des retours utilisateurs

### Ce que les données d'usage disent réellement

Relevé du 18 août 2026 sur la base de production :

| Indicateur d'usage | Valeur |
|---|---|
| Liens créés en production | **9** |
| Clics enregistrés, tous liens confondus | **9** |
| Liens ayant reçu au moins un clic | 5 |
| Nombre de clics sur le lien le plus utilisé | 4 |
| Date de création des liens | toutes le **23 juillet 2026** |
| Liens créés depuis cette date | **0** |

**Il n'existe pas de base d'utilisateurs.** Les 9 liens datent de la campagne de
validation ; aucun n'a été créé depuis 26 jours. Aucun retour spontané n'a été
reçu, et le § 9 de `docs/10-Gestion-anomalies.md` le confirme du côté des
anomalies : sur l'ensemble des anomalies consignées depuis le début du projet,
**aucune n'est venue d'un signalement utilisateur**.

Prétendre analyser des retours d'utilisateurs qui n'existent pas produirait un
document faux. Les retours réellement disponibles sont les suivants, et ce sont eux
qui alimentent ce plan.

### Les retours réellement exploitables

| Source | Nature | Ce qu'elle a produit |
|---|---|---|
| Usage propre de l'administrateur | Utilisation réelle de l'interface de gestion | Détection du focus non restauré au clavier (BUG-007) |
| Campagne de recette (24 scénarios) | Parcours utilisateur provoqué | 6 anomalies fonctionnelles |
| Audits d'accessibilité | Contrôle outillé du parcours réel | Contraste insuffisant, hiérarchie des titres (ANO-2026-07-008) |
| Périmètre déclaré au cadrage | Analyse SWOT du dossier de cadrage | Choix assumé d'un service mono-administrateur, sans comptes nominatifs |

### Conséquence méthodologique

Sans demande exprimée, il est impossible de prioriser « par la voix du client ».
Les recommandations sont donc ordonnées selon deux principes explicites :

1. **Lever d'abord les freins objectifs à l'adoption** — ce qui ferait fuir un
   utilisateur avant même qu'il ait un avis à donner ;
2. **Rendre les retours possibles** — instrumenter le produit et ouvrir un canal,
   afin que la prochaine version de ce document s'appuie sur des retours véritables
   plutôt que sur une déduction.

C'est la raison pour laquelle **R5 et R6** figurent dans le plan malgré un gain de
performance nul : elles ne rendent pas le service plus rapide, elles rendent son
amélioration future pilotable.

## 3. Recommandations

### R1 — Supprimer le démarrage à froid de 22 secondes

**Constat.** L'offre gratuite de Render met l'instance en veille après 15 minutes
d'inactivité. Le premier appel suivant a été mesuré à **22,4 s**, contre ~100 ms à
chaud. Or l'usage nominal du service est précisément l'appel isolé : un visiteur
qui clique sur un lien court partagé la veille tombe exactement dans ce cas.

C'est **le seul indicateur de performance du projet qui soit mauvais**, et il
frappe la fonction pour laquelle le service existe. À côté, le frontend affiche
98/100 et l'API répond en 100 ms à chaud : le problème est entièrement concentré
ici.

**Options.**

| Option | Effet | Coût | Délai |
|---|---|---|---|
| Offre payante Render d'entrée de gamme (instance sans veille) | Supprime le problème à la racine | de l'ordre de 7 $/mois, tarif à confirmer au moment de la décision | 30 min |
| Appel de maintien en éveil toutes les 10 min, ajouté au workflow de supervision | Réduit fortement la probabilité de veille, sans coût | 20 min | immédiat |
| Migration vers un hébergeur sans mise en veille sur son offre gratuite | Supprime le problème | 1 à 2 jours de migration et de revérification | 2 jours |

**Recommandation.** L'appel de maintien en éveil d'abord, parce qu'il est gratuit
et immédiat ; l'offre payante dès qu'un usage réel existe.

Réserve à assumer : maintenir artificiellement une instance éveillée consomme des
ressources pour rien la plupart du temps, ce qui va à l'encontre de la démarche de
sobriété du projet. C'est un contournement, pas une solution — la solution est
l'offre payante, et elle attend un usage qui la justifie.

| Critère | Évaluation |
|---|---|
| Gain | Temps de réponse de la fonction centrale ramené de 22 s à ~100 ms dans le cas le plus fréquent |
| Priorité | **1** — le seul gain d'attractivité directement perceptible par un visiteur |
| État | **Réalisé le 21/08/2026**, par l'option gratuite. Mesures ci-dessous |

#### Résultat mesuré

La sonde externe de R4 a été activée le 21 août 2026 avec un intervalle de
5 minutes, inférieur au seuil de mise en veille de 15 minutes. Elle produit donc
l'effet visé par R1 sans travail supplémentaire.

| Mesure | Avant (18/08/2026) | Après (21/08/2026) |
|---|---|---|
| Premier appel après une longue inactivité | **22,4 s** | **0,147 s** |
| Appels suivants | ~100 ms | 86 à 98 ms |
| Continuité du processus (`uptimeSeconds`) | remise à zéro à chaque réveil | **4 840 s**, soit 80 min ininterrompues |

Le protocole de mesure : aucune sollicitation de l'API pendant 45 minutes, puis un
premier appel chronométré. Sans dispositif, l'instance aurait dormi depuis 30
minutes et ce premier appel aurait coûté une vingtaine de secondes.

L'indicateur décisif est `uptimeSeconds` : 80 minutes de fonctionnement continu
établissent que le processus n'a **pas** été arrêté puis relancé, ce qu'une simple
mesure de latence ne prouverait pas.

**Réserve d'attribution, à énoncer.** Deux réglages ont été activés le même jour :
la sonde externe à 5 minutes et la sonde de plateforme Render. Le second interroge
aussi `/health/ready` périodiquement. L'effet est donc établi, mais son
attribution à la seule sonde externe est **probable sans être isolée** — il
faudrait désactiver l'un des deux dispositifs pour trancher, ce qui n'a pas
d'intérêt pratique puisque les deux sont voulus.

**Ce qui reste vrai malgré ce gain** : maintenir une instance éveillée consomme des
ressources pour rien la plupart du temps. Le contournement fonctionne, mais la
solution propre reste l'offre payante, et elle attend un usage qui la justifie.

### R2 — Protéger la branche `main` par les contrôles d'intégration continue

**Constat.** Mesuré sur trois déploiements (`aea4aab`, `5a3a278`, `59df1ff`) : la
mise en ligne est enregistrée en succès **22 à 27 secondes avant** que
l'intégration continue ne rende son verdict. Render et Vercel réagissent au push en
parallèle des Actions, non à leur suite. Conséquence constatée le 24 juillet
2026 : un commit dont la CI a fini rouge a été déployé en production. Analyse
complète au § 6 de `docs/11-Traitement-anomalie.md`.

**Action.** Sur GitHub, protéger `main` : fusion par demande de fusion uniquement,
avec `status-checks` en contrôle requis. Le flux par demande de fusion est déjà
celui que décrit `docs/03-Manuel-mise-a-jour.md` ; il s'agit de le rendre
obligatoire au lieu de facultatif.

| Critère | Évaluation |
|---|---|
| Coût | 10 minutes de configuration, aucun développement |
| Délai | immédiat |
| Gain | Aucun code non validé ne peut plus atteindre la production. Traite la cause, là où le *Health Check Path* de Render ne traite qu'un symptôme |
| Risque | Impose une demande de fusion pour chaque modification — contrainte réelle pour un mainteneur unique, mais alignée sur la documentation existante |
| Priorité | **2** |

### R3 — Rendre la construction du frontend reproductible entre environnements

**Constat.** Le même code source produit deux artefacts différents selon l'endroit
où il est construit :

| Construction | Taille | Marqueurs de développement de React |
|---|---|---|
| Vercel (déployée) | 153 784 o | `jsxDEV` : **0** · `validateDOMNesting` : **0** · `Invalid hook call` : **0** |
| Locale, `npm run build:frontend` | 329 570 o | `jsxDEV` : **88** · `validateDOMNesting` : **3** · `Invalid hook call` : **2** |

La production est donc saine : Vercel définit `NODE_ENV=production` dans son
environnement de construction. En local, `NODE_ENV` vaut `undefined`, et
`vite.config.js` ne comporte aucun remplacement de cette variable : le build local
embarque alors le **build de développement** de React, qui exécute des contrôles de
cohérence à chaque rendu.

**Trois conséquences, par ordre de gravité :**

1. **La CI ne valide pas l'artefact déployé.** Le job `build-frontend` s'exécute
   dans le même contexte que le poste local, `NODE_ENV` non défini : il construit
   et vérifie le bundle de 330 ko, alors que celui qui part en production en fait
   150. Le contrôle porte à côté de son objet.
2. **Un déploiement de secours livrerait le build de développement.** Toute
   procédure qui publierait un `dist/` construit localement — dépannage, mise en
   ligne manuelle — enverrait aux utilisateurs un bundle deux fois plus lourd,
   truffé de contrôles de développement.
3. **La documentation affirme l'inverse.** `docs/06-Securite-Accessibilite.md`
   annonce, au titre du risque OWASP A08, des « builds Vite reproductibles ». La
   mesure contredit cette affirmation, qui est corrigée en conséquence.

**Action.** Six lignes dans `vite.config.js` :

```js
define: {
  'process.env.NODE_ENV': JSON.stringify('production'),
},
esbuild: {
  jsxDev: false,
},
```

**Gain mesuré.** Le build local passe de 329 570 à **150 172 octets**, soit très
exactement le calibre de l'artefact de production, et tous les marqueurs de
développement disparaissent. Durée de construction inchangée (1,3 s).

| Critère | Évaluation |
|---|---|
| Coût | 6 lignes de configuration, **aucune dépendance ajoutée** |
| Délai | 15 minutes, vérification comprise |
| Gain | **Aucun gain de performance en production** — elle est déjà correcte. Le gain est d'intégrité : ce qui est testé devient ce qui est livré |
| Risque | Faible, sous une condition : `define` s'applique **aussi au serveur de développement**. Appliqué sans condition, ce réglage priverait le développeur des avertissements de React. La configuration doit donc distinguer `serve` de `build` |
| Priorité | **3** |
| État | **Correctif implémenté** sur une branche dédiée, en attente de fusion. Mesures de la mise en œuvre ci-dessous |

#### Résultat de la mise en œuvre

La configuration a été convertie en fonction, pour n'appliquer le réglage qu'à la
construction. Vérifié : en mode `serve`, ni `define` ni `esbuild` ne sont
transmis ; en mode `build`, les deux le sont.

| Mesure | Avant | Après |
|---|---|---|
| Bundle construit localement | 329 570 o | **153 770 o** |
| `jsxDEV` dans le bundle local | 88 | **0** |
| `validateDOMNesting` | 3 | **0** |
| Bundle servi en production | 153 784 o | inchangé |

Il subsiste **14 octets** d'écart avec la production, et cet écart est légitime :
il provient de la variable d'environnement `VITE_API_BASE_URL`, définie sur Vercel
et absente en local. Elle agit à deux endroits — directement, et par son repli
`client/src/main.jsx:278` (`API_BASE_URL || 'http://localhost:3000'`). Après
neutralisation de cette variable, les deux constructions ne diffèrent plus que par
ce repli.

Corollaire utile pour la conséquence n° 2 énoncée plus haut : un `dist/` construit
localement n'est de toute façon **pas déployable**, puisqu'il pointe vers
`localhost`. Le risque n'était donc pas de livrer un bundle discrètement plus
lourd, mais de livrer un frontend inopérant.

Cette recommandation illustre une distinction utile : un indicateur au vert en
production ne garantit pas que la chaîne qui y mène soit saine.

### R4 — Ramener le délai de détection d'incident de 30 min à 5 min

**Constat.** Les sondes de supervision s'exécutent toutes les 30 minutes : une
indisponibilité peut donc durer 30 minutes avant d'être signalée
(`docs/08-Supervision-alertes.md`, § 9, limite n° 1).

**Action.** Brancher un service de supervision externe gratuit sur
`GET /health/ready`, avec recherche du motif `"status":"ready"` et intervalle de
5 minutes. La procédure est déjà rédigée au § 10 du document de supervision.

| Critère | Évaluation |
|---|---|
| Coût | gratuit, 15 minutes de configuration |
| Délai | immédiat |
| Gain | Délai de détection divisé par 6. Effet de bord utile : les appels réguliers limitent la mise en veille visée par R1 |
| Priorité | **4** |
| État | **Réalisée le 21/08/2026** — moniteur UptimeRobot de type mot-clé sur `/health/ready`, intervalle 5 min, alerte par courriel. L'effet de bord sur R1 est mesuré et chiffré au § R1 |

### R5 — Ouvrir un canal de signalement pour le visiteur

**Constat.** Le visiteur anonyme — la majorité des utilisateurs — n'a **aucun
moyen de signaler quoi que ce soit** (`docs/10-Gestion-anomalies.md`, § 2). Une
anomalie qui n'affecte que son expérience, sans erreur serveur, reste invisible
jusqu'à la prochaine campagne de recette.

**Action.** Sur la page d'aperçu, un lien de signalement discret ouvrant un
formulaire minimal : ce que l'utilisateur attendait, ce qu'il a obtenu, et le code
du lien concerné, prérempli. Limitation de débit et absence de champ libre non
borné, pour ne pas ouvrir une surface d'abus.

| Critère | Évaluation |
|---|---|
| Coût | 1 journée : point d'entrée d'API, limitation de débit, formulaire, tests |
| Délai | 1 semaine calendaire |
| Gain | Aucun gain de performance. Rend possible ce qui n'existe pas aujourd'hui : un retour utilisateur |
| Risque | Surface d'abus si la limitation de débit est mal calibrée |
| Priorité | **5** |

### R6 — Instrumenter l'usage pour rendre l'amélioration pilotable

**Constat.** Le service enregistre déjà les clics, avec pays, appareil et référent
(`analyticsService.js`, `GET /api/links/:id/stats`), mais ces données ne sont
agrégées nulle part. Il a fallu une requête manuelle à l'API pour établir le relevé
du § 2 : aucune tendance n'est observable.

**Action.** Sur le tableau de bord, un bandeau d'indicateurs : liens actifs, clics
sur 7 et 30 jours, part des liens jamais cliqués, part des liens expirés.

| Critère | Évaluation |
|---|---|
| Coût | 1 journée : agrégation MongoDB, point d'entrée, affichage, tests |
| Délai | 1 semaine calendaire |
| Gain | Aucun gain de performance. Permet de mesurer l'effet des autres recommandations, donc de piloter au lieu de supposer |
| Priorité | **6** |

### R7 — Débloquer `geoip-lite` 2.x en relevant la version de Node

**Constat.** `geoip-lite` est pincé à 1.2.2 parce que la branche 2.x, seule à
corriger la vulnérabilité `ip-address`, exige `node >=24.0.0` — ce qui ferait
tomber le support de Node 22 déclaré dans `engines`
(`docs/09-Maintenance-dependances.md`, § 7).

**Action.** À la fin du support de Node 22 (avril 2027), relever `engines` à
`>=24`, retirer l'entrée 22.x de la matrice d'intégration continue et accepter la
montée majeure. Le garde-fou `engine-strict=true` déjà en place rendra l'opération
sûre : toute incompatibilité fera échouer l'installation au lieu de passer
inaperçue.

| Critère | Évaluation |
|---|---|
| Coût | 2 heures, dont la revérification de la géolocalisation des clics |
| Délai | conditionné au calendrier de Node, pas à celui du projet |
| Gain | Sortie d'une dette documentée ; alignement sur une branche maintenue |
| Priorité | **7** — planifié, non urgent |

### R8 — Traiter les montées majeures en attente

**Constat.** Six montées majeures sont en attente de décision, dont quatre avec une
demande de fusion ouverte : `express` 4 → 5 (#9), `pino` 9 → 10 (#3),
`express-rate-limit` 7 → 8 (#7), `dotenv` 16 → 17 (#8), auxquelles s'ajoutent
`mongoose` 8 → 9, `zod` 3 → 4, `react` 18 → 19 et `jest` 29 → 30
(`docs/09-Maintenance-dependances.md`, § 8).

**Action.** Une montée par itération, dans l'ordre de criticité déjà arrêté :
sécurité et accès aux données d'abord (`express`, `mongoose`, `zod`), outillage
ensuite, interface enfin.

| Critère | Évaluation |
|---|---|
| Coût | 0,5 à 2 jours par montée selon l'ampleur de la rupture |
| Délai | une par trimestre, au rythme de la revue |
| Gain | Sécurité et maintenabilité à long terme. Aucun gain fonctionnel immédiat |
| Risque | Régression : c'est précisément pourquoi ces montées ne sont pas regroupées |
| Priorité | **8** — hors fenêtre de certification |

### R9 — Nommer explicitement la base de données de production

**Constat.** La chaîne de connexion ne précise aucun nom de base. Mongoose retombe
donc sur le défaut de MongoDB : les données de production — 9 liens et 12 clics au
21 août 2026 — sont stockées dans une base littéralement nommée **`test`**.
Vérification faite en interrogeant le cluster : `databaseName` vaut `test`, et les
collections `links` et `clicks` y résident.

Le service fonctionne parfaitement ainsi. Le défaut est de lisibilité et de
sûreté : une base nommée `test` invite à croire qu'elle est jetable.

**Action.** Ajouter le nom de base à `MONGO_URI` (`.../shortlink?retryWrites=...`),
côté `.env` et côté Render, puis migrer les deux collections.

| Critère | Évaluation |
|---|---|
| Coût | 1 heure, dont la migration des collections et la revérification de la production |
| Délai | 1 heure, mais **hors période de certification** |
| Gain | Aucun gain fonctionnel ni de performance. Uniquement de la lisibilité et une réduction du risque de suppression accidentelle |
| Risque | **Réel** : toute erreur de migration fait perdre les données d'usage. L'opération n'est pas réversible sans sauvegarde, or les sauvegardes sont inactives sur l'offre gratuite |
| Priorité | **9** — à faire, mais jamais sous contrainte de calendrier |

Cette recommandation illustre un arbitrage assumé : un défaut **documenté** vaut
mieux qu'un défaut corrigé dans la précipitation. Le rapport entre un gain nul en
fonctionnalité et un risque réel de perte de données ne justifie pas d'agir
maintenant.

## 4. Priorisation

| Rang | Recommandation | Coût | Délai | Gain principal |
|---|---|---|---|---|
| 1 | R1 — démarrage à froid | gratuit, ou ~7 $/mois | 20 min | 22 s → ~100 ms sur la fonction centrale — **réalisé, mesuré à 0,147 s** |
| 2 | R2 — protection de branche | configuration | 10 min | Plus aucun déploiement non validé |
| 3 | R3 — build reproductible | 6 lignes | 15 min | La CI valide enfin l'artefact livré |
| 4 | R4 — détection à 5 min | gratuit | 15 min | Délai de détection ÷ 6 — **réalisée** |
| 5 | R5 — canal de signalement | 1 jour | 1 semaine | Rend le retour utilisateur possible |
| 6 | R6 — indicateurs d'usage | 1 jour | 1 semaine | Rend l'amélioration mesurable |
| 7 | R7 — `geoip-lite` 2.x | 2 h | avril 2027 | Sortie de dette |
| 8 | R8 — montées majeures | 0,5 à 2 j chacune | 1 par trimestre | Maintenabilité |
| 9 | R9 — nommer la base de production | 1 h | hors certification | Lisibilité, risque de suppression accidentelle réduit |

Constat de cette priorisation : **les quatre premières recommandations coûtent
moins d'une heure au total**, et couvrent le temps de réponse, la sûreté du
déploiement, l'intégrité de la chaîne de construction et le délai de détection.
C'est là que se trouve l'essentiel du gain accessible.

### Feuille de route

| Vague | Contenu | Horizon |
|---|---|---|
| 1 — gains immédiats | R1 (maintien en éveil), R2, R3, R4 | moins d'une heure de travail cumulée |
| 2 — rendre le produit mesurable | R5, R6 | 2 semaines |
| 3 — dette technique | R7, R8 | trimestriel, selon le calendrier de Node |

## 5. Effet attendu sur l'attractivité

| Recommandation | Comment elle renforce l'attractivité |
|---|---|
| R1 | La redirection, fonction pour laquelle le service existe, cesse de faire attendre 22 s |
| R2 | Aucune régression ne peut plus atteindre les utilisateurs : la confiance dans le service se construit là |
| R3 | Ce qui est vérifié est ce qui est livré — condition d'une amélioration continue crédible |
| R4 | Une panne dure au pire 5 minutes avant d'être connue, au lieu de 30 |
| R5 | L'utilisateur peut signaler un problème, donc se sentir entendu |
| R6 | Les décisions d'évolution s'appuient sur l'usage réel plutôt que sur des suppositions |
| R7, R8 | Un service maintenu à jour reste sûr, donc recommandable |

## 6. Pistes écartées, et pourquoi

Écarter explicitement est aussi important que proposer : une recommandation
irréaliste au regard du projet décrédibiliserait tout le plan.

| Piste | Raison du refus |
|---|---|
| Optimiser le poids du frontend (remplacement de React par une bibliothèque plus légère, découpage du bundle) | La production transfère **53 KiB** au total et obtient **98/100** en performance Lighthouse. Il n'y a pas de problème à résoudre : l'effort serait dépensé sans bénéfice utilisateur mesurable. R3 ramène le build local au calibre de production, ce qui suffit |
| Cache mémoire des redirections pour éviter la lecture en base | La lecture coûte 10 ms sur 108 ms de temps de réponse total : le gain serait imperceptible. Avec 9 clics enregistrés, l'optimisation est sans objet, et elle compliquerait la prise en compte immédiate des liens désactivés ou expirés |
| Comptes utilisateurs nominatifs avec rôles | Hors du périmètre arrêté au cadrage (analyse SWOT : service mono-administrateur). Ce serait un autre produit, pas une amélioration de celui-ci |
| Supervision par Prometheus et Grafana | Coût d'exploitation disproportionné pour une instance unique. Les exécutions de supervision GitHub fournissent déjà l'historique nécessaire |
| Tests de bout en bout dans l'intégration continue | Ils nécessiteraient une base de données de test dans la CI. Le rapport coût/bénéfice est défavorable tant que l'interface tient en un écran ; les parcours sont couverts par la campagne de recette |
| Déclencher le déploiement depuis GitHub Actions après succès de la CI | Techniquement supérieur à R2, mais impose de gérer des secrets de déploiement et fait perdre les prévisualisations automatiques de Vercel. R2 obtient le même résultat pour dix minutes de configuration |

## 7. Comment vérifier que les recommandations ont produit leur effet

| Recommandation | Indicateur de contrôle | Cible |
|---|---|---|
| R1 | Temps de réponse du premier appel après 20 min d'inactivité | < 1 s — **atteint : 0,147 s** |
| R2 | Part des commits de `main` issus d'une demande de fusion avec CI verte | 100 % |
| R3 | Écart entre le bundle construit localement et celui servi en production, une fois `VITE_API_BASE_URL` neutralisée | aucune différence hors variables d'environnement |
| R4 | Écart entre l'horodatage d'un incident et celui de son signalement | ≤ 5 min — **dispositif en place** |
| R5 | Nombre de signalements reçus par trimestre | > 0 |
| R6 | Existence d'une série temporelle de clics consultable | disponible |
| R7 | `npm audit` et version de `geoip-lite` | 0 vulnérabilité, branche 2.x |
| R8 | Nombre de montées majeures en attente | en décroissance à chaque trimestre |

Ces indicateurs sont volontairement les mêmes que ceux du § 1 : c'est ce qui
permettra de comparer l'avant et l'après sur une base de mesure identique.
