# Système de supervision et d'alerte — ShortLink

Date de mise à jour : 18 août 2026
Compétence visée : **C4.1.2** — concevoir un système de supervision et d'alerte.

Environnements supervisés :

- API : `https://shortlink-whkw.onrender.com` (Render, Node.js/Express) ;
- frontend : `https://short-link-omega.vercel.app` (Vercel, React/Vite) ;
- base de données : MongoDB Atlas (cluster partagé) ;
- dépôt et automatisation : `https://github.com/Aimeryy02/ShortLink`.

## 1. Typologie du logiciel et conséquences sur la supervision

ShortLink est une **application web à trois composants distincts hébergés sur
trois plateformes différentes** :

| Composant | Hébergement | Particularité déterminante |
|---|---|---|
| API REST + service de redirection | Render (offre gratuite) | L'instance est **mise en veille après 15 minutes d'inactivité** ; le premier appel ensuite subit un démarrage à froid mesuré jusqu'à **25 s**. |
| Interface d'administration | Vercel (CDN, statique) | Fichiers statiques servis par le CDN : très haute disponibilité, aucune logique serveur à surveiller. |
| Base de données | MongoDB Atlas | Ressource externe : elle peut être indisponible alors que le processus Node.js fonctionne parfaitement. |

Trois conséquences structurent la conception :

1. **Séparer vivacité et aptitude au service.** Un processus qui répond n'est pas
   un service opérationnel : sans MongoDB, ShortLink ne peut ni créer ni
   rediriger un lien. Il faut donc deux sondes distinctes et non une seule.
2. **Tolérer le démarrage à froid.** Une sonde qui échouerait au premier appel
   lent produirait des alertes en permanence. Les sondes doivent réessayer.
3. **Superviser depuis l'extérieur.** Une sonde hébergée dans l'application ne
   peut pas signaler que l'application est tombée. Le déclenchement doit venir
   d'un système tiers.

La fonction critique du service — la **redirection publique** — est celle dont
l'indisponibilité est visible de tous les utilisateurs finaux ; c'est elle qui
définit le niveau de criticité des sondes.

## 2. Périmètre de supervision

### Dans le périmètre

| Élément supervisé | Pourquoi |
|---|---|
| Disponibilité du processus API | Sans lui, plus aucune redirection ni administration. |
| Connexion effective à MongoDB Atlas | Panne la plus probable et la plus impactante. |
| Présence de la configuration critique côté serveur (`ADMIN_API_KEY`) | Une variable d'environnement perdue lors d'un redéploiement rend l'administration inutilisable (`503`). |
| Disponibilité du frontend Vercel | Point d'entrée de l'administrateur. |
| Latence de réponse de l'API | Indicateur avancé de saturation ou de dégradation Atlas. |
| Consommation mémoire du processus | Détection d'une fuite mémoire sur une instance à 512 Mo. |
| Résultat des intégrations continues et des déploiements | Un déploiement échoué est un incident de production. |
| Vulnérabilités des dépendances | Voir `docs/09-Maintenance-dependances.md`. |

### Hors périmètre (et pourquoi)

| Élément non supervisé | Justification |
|---|---|
| Traçage distribué (APM type OpenTelemetry) | Une seule instance, un seul service : le coût d'exploitation dépasse le bénéfice sur ce prototype. |
| Supervision système (CPU, disque, réseau de l'hôte) | Déléguée à Render : le PaaS ne donne pas accès à l'hôte. |
| Métriques métier temps réel (clics par minute) | Les statistiques de clics existent dans l'application (`/api/links/:id/stats`) mais relèvent de l'usage, pas de la disponibilité. |
| Supervision des liens de destination des utilisateurs | Hors responsabilité du service : ShortLink ne garantit pas la disponibilité des sites cibles. |

## 3. Indicateurs de suivi retenus

| Indicateur | Définition | Source | Objectif |
|---|---|---|---|
| Disponibilité de l'API (`availability`) | Part des sondes `/health` réussies | Workflow de supervision | ≥ 99 % sur 30 jours (hors veille de l'offre gratuite) |
| Aptitude au service (`readiness`) | Part des sondes `/health/ready` renvoyant `ready` | Workflow de supervision | ≥ 99 % sur 30 jours |
| Latence à chaud | Temps de réponse de `/health/ready` hors démarrage à froid | Workflow de supervision | < 3 000 ms (budget), cible < 500 ms |
| Latence de la base | `probes[mongodb].latencyMs` | Sonde applicative | < 200 ms |
| Taux d'erreur serveur | Nombre de réponses `5xx` | Journaux Pino / Render | 0 sur une journée nominale |
| Mémoire résidente | `probes[memory].rssMb` | Sonde applicative | < 400 Mo (instance à 512 Mo) |
| Délai de détection (MTTD) | Temps entre la panne et l'alerte | Fréquence des sondes | ≤ 30 min (≤ 5 min avec la sonde externe optionnelle) |
| Taux de réussite de la CI | Exécutions `CI - Test & Build` réussies sur `main` | GitHub Actions | 100 % sur `main` |
| Vulnérabilités connues | Résultat de `npm audit` | CI, job `quality` | 0 de niveau `moderate` ou supérieur |

Ces seuils sont volontairement calibrés sur un **prototype hébergé en offre
gratuite** : viser 99,9 % de disponibilité serait irréaliste puisque la veille
automatique de Render est un comportement attendu et non une panne.

## 4. Sondes mises en place

### 4.1 Sondes applicatives internes (dans le code)

Deux points d'entrée HTTP publics, sans authentification (pour être interrogeables
par n'importe quel superviseur externe) et **non mis en cache**
(`Cache-Control: no-store`).

Implémentation : `src/services/healthService.js`, `src/controllers/healthController.js`,
`src/routes/healthRoutes.js`.

#### Sonde de vivacité — `GET /health`

**Finalité** : répondre à la question « le processus Node.js est-il vivant et
capable de servir des requêtes HTTP ? ». Elle ne dépend d'aucune ressource
externe, donc elle ne peut pas échouer à cause d'Atlas. C'est la sonde qui
distingue une **panne du service** d'une **panne de dépendance**.

```json
{
  "success": true,
  "status": "alive",
  "service": "shortlink-api",
  "version": "1.1.0",
  "environment": "production",
  "uptimeSeconds": 17,
  "timestamp": "2026-08-18T12:16:18.393Z"
}
```

`uptimeSeconds` a une valeur diagnostique directe : un uptime qui repart à zéro à
chaque sonde révèle un processus qui redémarre en boucle.

#### Sonde d'aptitude au service — `GET /health/ready`

**Finalité** : répondre à « le service peut-il réellement traiter une requête
métier ? ». Elle agrège trois sous-sondes et renvoie **`200` si le service est
apte, `503` s'il est dégradé**, ce qui la rend directement exploitable par un
superviseur ou par un orchestrateur de déploiement.

| Sous-sonde | Critique | Ce qu'elle vérifie réellement | Défaillance détectée |
|---|:---:|---|---|
| `mongodb` | oui | État de la connexion Mongoose **puis `ping` effectif** sur la base, avec un délai maximal de 2 000 ms (`HEALTH_DB_TIMEOUT_MS`) | Cluster Atlas arrêté, IP non autorisée, identifiants expirés, réseau saturé |
| `admin_key` | oui | `ADMIN_API_KEY` présente et d'au moins 32 caractères — **sans jamais exposer sa valeur** (seul un booléen est renvoyé) | Variable d'environnement perdue ou tronquée lors d'un redéploiement |
| `memory` | non | Mémoire de tas et mémoire résidente du processus | Fuite mémoire, pression avant plantage |

Le `ping` est un choix délibéré : tester `readyState` seul renverrait « connecté »
alors que le cluster ne répond plus. La sonde mesure aussi la **latence réelle**
de l'aller-retour et la publie dans `latencyMs`.

Exemple de service apte :

```json
{
  "success": true,
  "status": "ready",
  "probes": [
    { "name": "mongodb", "critical": true, "status": "up", "readyState": "connected", "latencyMs": 13 },
    { "name": "admin_key", "critical": true, "status": "up", "configured": true },
    { "name": "memory", "critical": false, "status": "up", "heapUsedMb": 25.8, "rssMb": 172.6 }
  ]
}
```

Exemple de service dégradé (`HTTP 503`) :

```json
{
  "success": false,
  "status": "degraded",
  "probes": [
    {
      "name": "mongodb",
      "critical": true,
      "status": "down",
      "readyState": "disconnected",
      "latencyMs": null,
      "error": "Database connection is not established"
    }
  ]
}
```

Une sonde **non critique** en échec ne dégrade jamais le service : seule une
sous-sonde marquée `critical` fait basculer le statut en `degraded`. Ce choix
évite les fausses alertes tout en conservant l'information de diagnostic.

### 4.2 Sonde externe planifiée — GitHub Actions

Fichier : `.github/workflows/supervision.yml`.

| Caractéristique | Valeur |
|---|---|
| Fréquence | toutes les 30 minutes (`cron: '*/30 * * * *'`), soit 48 exécutions par jour |
| Déclenchement manuel | oui (`workflow_dispatch`), pour vérifier à la demande après un déploiement |
| Mode exercice | oui (entrée `drill`), pour tester la chaîne d'alerte sans panne réelle |
| Tolérance au démarrage à froid | 3 tentatives, délai de 75 s par appel, 10 s entre deux tentatives |
| Hébergement | GitHub, donc **indépendant de Render et de Vercel** |
| Coût | nul (dépôt public : minutes d'exécution illimitées) |

Quatre contrôles sont exécutés à chaque passage :

| # | Contrôle | Critère de succès | Criticité |
|---|---|---|---|
| 1 | `GET {API}/health` | `200` **et** corps contenant `"status":"alive"` | critique |
| 2 | `GET {API}/health/ready` | `200` **et** corps contenant `"status":"ready"` | critique |
| 3 | `GET {APP}` (frontend Vercel) | `200` **et** corps contenant `ShortLink` | critique |
| 4 | Latence à chaud de `/health/ready` | ≤ `LATENCY_BUDGET_MS` (3 000 ms) | performance (non bloquante) |

La vérification du **contenu** de la réponse, et pas seulement du code HTTP, est
essentielle : une page d'erreur de plateforme peut très bien répondre `200`. Le
contrôle 1 a d'ailleurs détecté un écart réel lors de sa première exécution
(voir § 8).

Chaque exécution publie un tableau de résultats dans le résumé du run GitHub,
ce qui constitue l'historique de supervision consultable :

```
| Sonde                                       | Criticite   | Attendu   | Obtenu | Latence | Etat |
|---------------------------------------------|-------------|-----------|--------|---------|------|
| API /health (vivacite)                      | critique    | 200       | 200    | 207 ms  | OK   |
| API /health/ready (MongoDB + configuration) | critique    | 200       | 200    | 204 ms  | OK   |
| Frontend Vercel                             | critique    | 200       | 200    | 533 ms  | OK   |
| API /health/ready (latence a chaud)         | performance | < 3000 ms | 208 ms | 208 ms  | OK   |
```

### 4.3 Sondes et signaux fournis par les plateformes

| Source | Sonde / signal | Finalité | État |
|---|---|---|---|
| Render — *Health Check Path* réglé sur `/health/ready` | Sonde de plateforme sur chaque instance | Un déploiement dont la sonde d'aptitude échoue est refusé : une mauvaise configuration n'atteint pas la production | à activer (§ 10) |
| Render — journaux et statut de déploiement | Événements `Live`, `Failed`, redémarrages | Corrélation d'un incident avec un déploiement | actif |
| Render — notifications par courriel | Échec de déploiement, suspension | Alerte de plateforme | à activer (§ 10) |
| Vercel — statut de déploiement | Succès/échec du build frontend | Détection d'une régression de build | actif |
| MongoDB Atlas — métriques et alertes du cluster | Connexions, opérations, stockage | Surveillance de la ressource externe | à activer (§ 10) |
| GitHub Actions — `CI - Test & Build` | 89 tests, build frontend, `npm audit` | Barrière avant déploiement | actif |

### 4.4 Journalisation, support de l'analyse

La journalisation structurée (Pino, `src/config/logger.js`) complète les sondes :
les sondes disent **qu'il y a** un problème, les journaux disent **pourquoi**.

- format JSON avec horodatage ISO, agrégé par Render ;
- les erreurs `5xx` et les refus d'accès `401` sont journalisés ;
- la clé d'administration n'est **jamais** journalisée (comportement couvert par
  un test unitaire dédié) ;
- les adresses IP sont pseudonymisées avant stockage (`analyticsService.js`).

## 5. Critères de qualité et de performance

| Critère | Seuil | Conséquence si dépassé |
|---|---|---|
| Disponibilité `/health` | échec de 1 sonde | Incident critique : alerte immédiate |
| Aptitude `/health/ready` | échec de 1 sonde | Incident critique : alerte immédiate |
| Disponibilité du frontend | échec de 1 sonde | Incident critique : alerte immédiate |
| Latence à chaud de l'API | > 3 000 ms | Avertissement enregistré, pas d'incident |
| Latence de la base | > 200 ms de façon répétée | Analyse du cluster Atlas |
| Mémoire résidente | > 400 Mo | Analyse d'une fuite mémoire |
| Démarrage à froid | jusqu'à 25 s | Comportement attendu de l'offre gratuite, absorbé par les tentatives |

Le seuil de latence est fixé à 3 000 ms et non à 500 ms afin de rester **au-dessus
du bruit** de l'hébergement mutualisé : un seuil trop serré aurait produit des
alertes non actionnables, ce qui est le principal facteur d'abandon d'un système
de supervision.

## 6. Modalités de signalement

| Sévérité | Déclencheur | Canal | Destinataire | Délai de détection |
|---|---|---|---|---|
| **Critique** | Une sonde critique en échec | 1. Courriel automatique GitHub (échec du workflow) — 2. **Ouverture automatique d'une issue** étiquetée `incident` / `supervision` | Responsable du dépôt | ≤ 30 min |
| **Critique** | Sonde d'aptitude en échec au déploiement | Render refuse la mise en ligne + notification Render | Responsable du dépôt | immédiat |
| **Majeure** | Échec de la CI sur `main` | Courriel GitHub Actions | Responsable du dépôt | immédiat |
| **Mineure** | Budget de latence dépassé | Annotation `::warning::` dans le résumé du run | Consultation | ≤ 30 min |
| **Informative** | Rétablissement du service | Commentaire puis **fermeture automatique** de l'issue d'incident | Traçabilité | ≤ 30 min |

Deux mécanismes évitent la fatigue d'alerte, cause classique d'inefficacité :

- **anti-doublon** : si une issue d'incident est déjà ouverte, le workflow y
  ajoute un commentaire au lieu de créer une nouvelle issue ;
- **clôture automatique** : dès qu'une exécution repasse au vert, l'issue est
  commentée puis fermée, ce qui date précisément le début et la fin de
  l'indisponibilité.

L'issue générée alimente directement le processus de consignation des anomalies
décrit dans `docs/10-Gestion-anomalies.md` : elle contient l'horodatage, le
tableau des sondes, le lien vers l'exécution et un renvoi vers la procédure de
réaction.

### Test de la chaîne d'alerte (mode exercice)

Une alerte jamais déclenchée est une alerte dont on ignore si elle fonctionne.
Le workflow expose donc une entrée `drill` : lancé en mode exercice, il pointe
volontairement la sonde de vivacité sur une route inexistante, ce qui déclenche
toute la chaîne (échec du workflow → courriel → ouverture de l'issue) **sans
provoquer ni simuler de panne en production**.

L'issue créée en mode exercice porte un avertissement explicite en tête de corps
(« EXERCICE DE TEST DE LA CHAINE D ALERTE — ce n'est pas un incident réel »)
afin qu'elle ne soit jamais confondue avec un incident véritable. L'exécution
verte suivante la clôt automatiquement.

Procédure : GitHub → onglet *Actions* → *Supervision - sondes de production* →
*Run workflow* → cocher l'entrée `drill`.

## 7. Procédure de réaction

| Alerte reçue | Diagnostic à mener | Action corrective |
|---|---|---|
| `/health` en échec, frontend OK | Consulter le statut du service Render (veille, plantage, déploiement en cours) et les journaux | Relancer le service ; si un déploiement récent est en cause, appliquer le retour arrière de `docs/03-Manuel-mise-a-jour.md` |
| `/health` OK, `/health/ready` en `degraded` avec `mongodb` `down` | Lire `probes[mongodb].error` ; vérifier dans Atlas : état du cluster, liste des IP autorisées, validité des identifiants | Réactiver le cluster, corriger l'accès réseau, faire tourner les identifiants et mettre à jour `MONGO_URI` dans Render |
| `/health/ready` en `degraded` avec `admin_key` `down` | Variable d'environnement absente ou tronquée dans Render | Régénérer la clé localement, la replacer dans Render, redéployer — procédure du § 4 de `docs/06-Securite-Accessibilite.md` |
| Frontend en échec, API OK | Consulter le dernier déploiement Vercel | Redéployer le dernier build fonctionnel |
| Latence dégradée durablement | Comparer `latencyMs` de la base et la latence HTTP totale | Si la base est en cause : analyse Atlas ; sinon : saturation de l'instance Render |
| `memory` en hausse continue | Comparer `rssMb` entre plusieurs exécutions | Redémarrer l'instance, puis rechercher la fuite |

Tout incident traité est ensuite consigné selon le processus de
`docs/10-Gestion-anomalies.md`, et le correctif éventuel suit la chaîne
d'intégration et de déploiement continu.

## 8. Vérifications réalisées

### Tests automatisés

Les sondes sont couvertes par **19 tests unitaires** répartis en 2 suites
(`src/services/healthService.test.js`, `src/controllers/healthController.test.js`) :

- service apte lorsque toutes les sous-sondes critiques sont vertes ;
- service dégradé si MongoDB est injoignable, si le `ping` échoue, s'il dépasse
  le délai, ou si la clé d'administration est absente ou trop courte ;
- une sous-sonde non critique en échec ne dégrade pas le service ;
- **la valeur de la clé d'administration n'apparaît jamais dans la réponse** ;
- code HTTP `200` si `ready`, `503` si `degraded` ;
- en-tête `Cache-Control: no-store` présent sur les deux points d'entrée.

Résultat du 18 août 2026 : **14 suites, 89 tests réussis**, couverture globale
93,05 % des instructions (`healthService.js` : 100 %).

### Vérification fonctionnelle sur base réelle

Trois scénarios exécutés contre le cluster MongoDB Atlas
(preuve : `perso/preuves/14-sondes-sante-C4.1.2.txt`) :

| Scénario | `/health` | `/health/ready` | Conforme |
|---|---|---|---|
| Service nominal | `200` `alive` | `200` `ready`, base à 13 ms | oui |
| MongoDB déconnecté (coupure forcée) | `200` `alive` | `503` `degraded`, `mongodb: down` | oui |
| `ADMIN_API_KEY` retirée | `200` `alive` | `503` `degraded`, `admin_key: down` | oui |

Le scénario 2 démontre l'intérêt de la séparation vivacité/aptitude : le
processus reste vivant alors que le service n'est plus apte.

### Vérification du chemin de détection

Le workflow de supervision a d'abord été exécuté **avant** le déploiement des
nouvelles sondes. Résultat conforme à l'attendu : les contrôles 1 et 2 sont
passés en échec (`/health` répondait `200` mais sans le motif `"status":"alive"`,
et `/health/ready` renvoyait `404`), le tableau de résultats a été produit et le
workflow s'est terminé en échec.

Cette exécution vaut **test réel du chemin de détection** : elle prouve que la
supervision détecte un écart entre le comportement attendu et le comportement
observé en production, et qu'elle ne se contente pas de vérifier un code HTTP.
Preuve : `perso/preuves/15-supervision-detection-ecart-C4.1.2.md`.

### Vérification en production après déploiement

Déploiement Render du 18 août 2026 (version 1.1.0) :

| Contrôle | Résultat mesuré |
|---|---|
| `GET /health` | `200`, `"status":"alive"`, `version: 1.1.0`, `environment: production` |
| `GET /health/ready` | `200`, `"status":"ready"` |
| Sous-sonde `mongodb` | `up`, latence **10 ms** |
| Sous-sonde `admin_key` | `up`, `configured: true` (valeur non divulguée) |
| Sous-sonde `memory` | `rssMb` 161 Mo sur une instance de 512 Mo |
| En-tête de cache | `Cache-Control: no-store, max-age=0` |
| Exécution du workflow de supervision | 4 contrôles verts en 12 s |

### Vérification de la chaîne d'alerte (exercice du 18 août 2026)

Un exercice a été mené en mode `drill` pour valider **tout le circuit de
signalement**, et non seulement la détection :

| Étape | Résultat observé |
|---|---|
| Détection | Sonde de vivacité en échec après 3 tentatives (`HTTP 404`), les 3 autres contrôles restant verts |
| Terminaison du workflow | Échec → courriel automatique GitHub |
| Ouverture de l'incident | Issue **#1** créée automatiquement par `github-actions`, étiquetée `incident` et `supervision`, avec horodatage, sonde en défaut, tableau complet des sondes et renvoi vers la procédure de réaction |
| Retour à la normale | Exécution verte suivante : commentaire « Service rétabli » puis **fermeture automatique** de l'issue (`state_reason: completed`) |

L'issue a donc été ouverte à `12:33:01Z` et refermée automatiquement à
l'exécution suivante : le système date précisément le début et la fin de
l'indisponibilité. Preuve : `perso/preuves/16-chaine-alerte-C4.1.2.md`.

### Écart réel détecté sur la chaîne d'intégration continue

La mise en place de la supervision a révélé un écart qui n'avait pas été vu :
l'exécution de CI du commit `aea4aab` (24 juillet 2026) était **en échec**, le
job `quality` ayant détecté une vulnérabilité `moderate` publiée après le dernier
audit local de la journée. Au 18 août 2026, le compte était monté à
**5 vulnérabilités** (3 hautes, 2 modérées) sans qu'une seule ligne de code ait
changé.

Correction appliquée le 18 août 2026 (commit `5a3a278`) : mise à jour de
`brace-expansion`, `js-yaml`, `mongoose`, `nanoid` et `postcss`, retour à
0 vulnérabilité et CI verte. Le processus de maintenance qui en découle est
décrit dans `docs/09-Maintenance-dependances.md`.

## 9. Limites connues

1. **Fréquence de 30 minutes** : le délai de détection peut atteindre 30 minutes.
   La sonde externe optionnelle du § 10 le ramène à 5 minutes.
2. **Suspension des tâches planifiées** : GitHub désactive les workflows `cron`
   après 60 jours sans activité sur le dépôt. À réactiver après une longue
   inactivité.
3. **Pas de mesure du parcours utilisateur complet** : les sondes vérifient la
   disponibilité, pas la création puis la redirection effective d'un lien. Une
   sonde synthétique de bout en bout créerait des données de test en production.
4. **Pas d'astreinte** : le canal d'alerte est le courriel ; aucune notification
   téléphonique, ce qui est cohérent avec un prototype sans engagement de service
   contractuel.
5. **Métriques non historisées dans un outil dédié** : l'historique se lit dans
   les exécutions GitHub, sans tableau de bord de tendance (pas de Prometheus ni
   de Grafana). Ce choix est assumé au regard de la taille du projet.

## 10. Configuration à réaliser dans les consoles

Ces réglages ne peuvent pas être versionnés dans le dépôt : ils se font dans les
interfaces des plateformes.

### Render — sonde de plateforme et notifications

1. Render → service `shortlink` → **Settings** → *Health Check Path* : saisir
   `/health/ready`, puis enregistrer.
2. Render → **Settings** → *Notifications* : activer les notifications par
   courriel pour les événements de déploiement (`Deploy failed`, `Service
   suspended`).

Conséquence : un déploiement dont la sonde d'aptitude échoue (base injoignable,
clé absente) n'est pas mis en ligne.

### Sonde externe à 5 minutes (optionnelle, recommandée)

Un service de supervision gratuit (UptimeRobot, Better Stack, ou équivalent)
permet de ramener le délai de détection à 5 minutes :

| Paramètre | Valeur |
|---|---|
| Type de contrôle | HTTP(S) avec recherche de mot-clé |
| URL | `https://shortlink-whkw.onrender.com/health/ready` |
| Mot-clé attendu | `"status":"ready"` |
| Intervalle | 5 minutes |
| Alerte | courriel |

Aucune donnée sensible n'est exposée : les deux points d'entrée sont publics et
ne renvoient ni la clé d'administration ni la chaîne de connexion.

### MongoDB Atlas — alertes du cluster

Atlas → **Alerts** : activer au minimum les alertes de cluster indisponible et de
seuil de connexions atteint, avec notification par courriel.

## 11. Synthèse

| Exigence de la compétence C4.1.2 | Réponse apportée |
|---|---|
| Déterminer le périmètre de supervision | § 2 : périmètre explicite, avec les exclusions justifiées |
| Identifier les indicateurs de suivi pertinents | § 3 : 9 indicateurs, chacun avec sa source et son objectif |
| Mettre en place des sondes | § 4 : 2 sondes applicatives développées et testées, 4 contrôles externes planifiés, sondes de plateforme |
| Expliciter la finalité des sondes | § 4 : finalité et défaillance détectée pour chaque sonde et sous-sonde |
| Décrire les critères de qualité et de performance | § 5 : seuils chiffrés et justifiés pour le contexte du projet |
| Configurer la modalité des signalements | § 6 : 5 niveaux de sévérité, canaux, destinataires, anti-doublon et clôture automatique |
| Garantir la disponibilité du logiciel | § 7 : procédure de réaction par type d'alerte, reliée aux manuels d'exploitation |
