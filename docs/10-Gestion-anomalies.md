# Collecte et consignation des anomalies — ShortLink

Date de mise à jour : 18 août 2026
Compétence visée : **C4.2.1** — consigner les anomalies détectées.

Ce document décrit le **processus de collecte et de consignation** (§ 1 à § 6),
puis présente **deux fiches de consignation d'anomalies réellement rencontrées
au cours du projet** (§ 7 et § 8). Le traitement du correctif et son déploiement
font l'objet de `docs/11-Traitement-anomalie.md` (C4.2.2).

Ce document se distingue de `docs/05-Plan-correction-bugs.md`, qui recense les
bogues issus de la **recette** pendant la phase de développement. Ici, il s'agit
du dispositif permanent de **maintien en condition opérationnelle** : par où les
anomalies arrivent, comment elles sont enregistrées, et avec quelles informations.

## 1. Typologie du logiciel et conséquences sur la collecte

ShortLink est exploité par **un seul administrateur**, sans support de niveau 1,
et sert deux publics très différents :

| Public | Ce qu'il utilise | Comment une anomalie se manifeste pour lui |
|---|---|---|
| Visiteur anonyme | Lien court, page d'aperçu, QR code | Redirection qui échoue ou mène au mauvais endroit — **il ne peut rien signaler**, il n'a aucun canal |
| Administrateur | Tableau de bord protégé par clé | Erreur visible à l'écran, qu'il peut consigner lui-même |

Cette asymétrie est la contrainte structurante : **la majorité des utilisateurs
ne remonteront jamais rien**. Un processus qui reposerait sur le signalement
humain serait aveugle sur la fonction la plus critique du service. La collecte
doit donc être d'abord **automatique**, le canal humain venant en complément et
non en source principale.

Deuxième contrainte : un mainteneur unique n'a pas de mémoire de service. Une
anomalie non écrite au moment où elle est constatée est une anomalie perdue.
D'où le choix d'un outil unique, déjà présent dans le flux de travail, plutôt
qu'un outil de suivi séparé qu'il faudrait penser à ouvrir.

## 2. Canaux de collecte

Six canaux alimentent la consignation. Les trois premiers sont automatiques et
ne dépendent d'aucune vigilance humaine.

| # | Canal | Nature | Ce qu'il détecte | Délai |
|---|---|---|---|---|
| 1 | Sondes de supervision (`.github/workflows/supervision.yml`) | automatique | Indisponibilité de l'API, base injoignable, configuration perdue, frontend inaccessible | ≤ 30 min |
| 2 | Audit hebdomadaire des dépendances (`.github/workflows/audit-dependances.yml`) | automatique | Vulnérabilité publiée dans une dépendance | ≤ 7 jours |
| 3 | Intégration continue (`.github/workflows/ci.yml`) | automatique | Régression fonctionnelle (89 tests), échec de build, vulnérabilité | à chaque push |
| 4 | Cahier de recettes (`docs/04-Cahier-recettes.md`) | provoqué | Écart fonctionnel sur les 24 scénarios | à chaque campagne |
| 5 | Audits d'accessibilité et de sécurité (Lighthouse, `npm audit`, revue OWASP) | provoqué | Défaut de conformité RGAA, faiblesse de sécurité | à chaque audit |
| 6 | Journaux de production (Pino via Render) et observation directe | humain | Erreurs `5xx`, refus d'accès anormaux, comportement inattendu | à la consultation |

Les canaux 1 à 3 **écrivent eux-mêmes** dans l'outil de consignation : l'anomalie
est enregistrée avant même d'avoir été lue par un humain.

### Ce que le dispositif ne couvre pas

Il n'existe **pas de canal pour le visiteur anonyme** : aucun formulaire de
signalement n'est exposé sur la page d'aperçu, choix assumé pour un prototype
(un formulaire public non modéré est une surface d'abus). La conséquence est
explicite : une anomalie affectant uniquement l'expérience du visiteur, sans
provoquer d'erreur serveur ni faire tomber une sonde, ne serait détectée qu'au
prochain passage du cahier de recettes.

## 3. Outil de consignation

**GitHub Issues sur le dépôt du projet.** Le choix se justifie par trois
propriétés que n'aurait pas un outil séparé :

1. **Il est déjà dans le flux.** Le code, les demandes de fusion, la CI et les
   alertes vivent sur GitHub : la consignation n'impose aucun changement d'outil,
   donc aucune friction pour un mainteneur unique.
2. **Il est adressable par les machines.** Les workflows de supervision et
   d'audit y écrivent par l'API, avec le même format que les fiches humaines.
3. **Il relie l'anomalie à son correctif.** Une demande de fusion qui mentionne
   `Fixes #12` ferme l'anomalie au moment exact du merge : la traçabilité
   anomalie → correctif → déploiement est automatique et non déclarative.

### Gabarit de saisie

Fichier : `.github/ISSUE_TEMPLATE/anomalie.yml`.

Le gabarit est un **formulaire à champs contraints**, pas un texte libre. Six
champs sont **obligatoires**, choisis parce que ce sont exactement ceux sans
lesquels l'anomalie ne peut pas être reproduite :

| Champ | Obligatoire | Raison |
|---|:---:|---|
| Gravité | oui | Détermine le délai de traitement (§ 4) |
| Canal de détection | oui | Permet de mesurer l'efficacité de chaque canal |
| Environnement et version | oui | Une anomalie sans version n'est pas situable dans le temps |
| Étapes de reproduction | oui | Sans elles, le correctif est une supposition |
| Résultat attendu | oui | Définit le critère de clôture |
| Résultat obtenu | oui | Message exact, code HTTP, extrait de journal |
| Fréquence et périmètre | non | Systématique ou intermittent, un navigateur ou tous |
| Analyse et cause suspectée | non | Renseigné au triage, pas forcément par le déclarant |
| Préconisation de correction | non | Renseigné au triage |

Deux cases à cocher bloquantes complètent le formulaire : absence de secret dans
la fiche, et vérification qu'aucun doublon n'est déjà consigné.

**Règle de sécurité de la consignation** : une fiche d'anomalie ne contient
jamais `ADMIN_API_KEY`, ni chaîne de connexion MongoDB, ni jeton. Les extraits de
journaux sont expurgés avant d'être collés. Cette règle est rappelée en tête du
gabarit, car une fiche d'incident est le lieu naturel où l'on colle « tout le
contexte » sans réfléchir — sur un dépôt **public**, ce serait une fuite.

### Étiquettes

| Étiquette | Usage |
|---|---|
| `bug` | Anomalie fonctionnelle (posée par le gabarit) |
| `incident` | Indisponibilité constatée en production |
| `supervision` | Ouverte par une sonde ; sert aussi à l'anti-doublon du workflow |
| `dependances` | Montée de version ou vulnérabilité de dépendance |
| `securite` | Anomalie à conséquence de sécurité |
| `accessibilite` | Écart RGAA |

Les étiquettes `incident` et `supervision` existent déjà sur le dépôt, créées
lors de l'exercice de la chaîne d'alerte du 18 août 2026.

### Identification des fiches

Format : `ANO-AAAA-MM-NNN`, où `NNN` est un compteur par mois de détection. Les
anomalies antérieures à la mise en place de ce processus conservent leur
identifiant historique `BUG-NNN` de `docs/05-Plan-correction-bugs.md`, rappelé
dans la fiche pour que les deux documents restent raccordables.

## 4. Grille de gravité et délais de traitement

| Gravité | Définition | Exemple issu du projet | Délai visé |
|---|---|---|---|
| **Critique** | Service indisponible, redirections cassées ou données en péril | Base MongoDB injoignable, `ADMIN_API_KEY` perdue au redéploiement | correction immédiate |
| **Majeure** | Fonction essentielle dégradée, contournement pénible | Focus non restauré après fermeture de modale (BUG-007) : navigation clavier inutilisable | sous 48 h |
| **Mineure** | Défaut visible sans blocage fonctionnel | Hiérarchie de titres non séquentielle (ANO-2026-07-008) | sous 2 semaines |
| **Cosmétique** | Aucune conséquence fonctionnelle | Écart d'espacement | prochaine version |

Une anomalie de sécurité est relevée d'un niveau par rapport à sa gravité
fonctionnelle : la vulnérabilité `ip-address` du § 8 n'empêchait aucun usage,
mais a été traitée le jour même.

## 5. Cycle de vie d'une anomalie

```
détection (canal 1 à 6)
        │
        ▼
consignation  ──►  issue ouverte, gabarit renseigné, étiquettes posées
        │
        ▼
triage        ──►  gravité confirmée, doublon écarté, analyse et
        │          préconisation ajoutées à la fiche
        ▼
correction    ──►  branche dédiée, correctif, test de non-régression
        │          (processus détaillé dans docs/11-Traitement-anomalie.md)
        ▼
vérification  ──►  CI verte, puis contrôle sur l'environnement où
        │          l'anomalie avait été observée
        ▼
clôture       ──►  issue fermée par la fusion (`Fixes #n`), entrée au
                   CHANGELOG, mention au journal des versions
```

Deux règles encadrent ce cycle :

- **aucune clôture sans vérification** dans l'environnement d'origine du constat :
  une anomalie vue en production se referme sur la production, pas en local ;
- **une anomalie détectée automatiquement se referme automatiquement** lorsque la
  sonde repasse au vert, avec un commentaire horodaté qui borne la durée exacte
  de l'indisponibilité.

## 6. Consignation produite par les machines

Le workflow de supervision rédige lui-même une fiche lorsqu'une sonde critique
tombe. Elle contient les mêmes informations qu'une fiche humaine : horodatage,
canal, sonde en défaut avec l'écart attendu/obtenu, tableau complet de l'état des
sondes, lien vers l'exécution, et renvoi vers la procédure de réaction.

Exemple réellement produit le 18 août 2026 (issue **#1**, étiquetée `incident` et
`supervision`) lors de l'exercice de test de la chaîne d'alerte :

```
## Detection automatique
- Detecte le : 2026-08-18T12:33:01.896Z
- Declencheur : `workflow_dispatch`
- Execution de supervision : .../actions/runs/32137376348

## Sondes critiques en echec
- **API /health (vivacite)** : attendu HTTP 200 + motif `"status":"alive"`,
  obtenu HTTP 404 (3 tentatives)

## Etat detaille des sondes
| Sonde | Criticite | Attendu | Obtenu | Latence | Etat |
| API /health (vivacite) | critique | 200 | 404 | 225 ms | KO |
| API /health/ready | critique | 200 | 200 | 218 ms | OK |
| Frontend Vercel | critique | 200 | 200 | 516 ms | OK |
```

L'issue a été **fermée automatiquement** à l'exécution verte suivante, avec le
commentaire de rétablissement : début et fin de l'incident sont donc datés sans
intervention humaine.

## 7. Fiche de consignation — ANO-2026-07-008

Anomalie **détectée en production** par un audit d'accessibilité, corrigée et
redéployée. C'est celle dont le traitement complet est présenté dans
`docs/11-Traitement-anomalie.md`.

| Champ | Contenu |
|---|---|
| **Identifiant** | ANO-2026-07-008 (référencée BUG-008 dans `docs/05`) |
| **Titre** | Hiérarchie de titres non séquentielle sur le tableau de bord |
| **Date de détection** | 24 juillet 2026 |
| **Canal de détection** | Audit d'accessibilité (canal 5) — Lighthouse sur la production |
| **Gravité** | Mineure — défaut de conformité RGAA sans blocage fonctionnel |
| **Étiquettes** | `bug`, `accessibilite` |
| **Environnement et version** | Production `https://short-link-omega.vercel.app`, version 1.0.1, Chrome (Lighthouse, catégorie Accessibility), tableau de bord **connecté** |

### Étapes de reproduction

1. Ouvrir `https://short-link-omega.vercel.app`.
2. Se connecter avec une clé d'administration valide (le tableau de bord doit
   afficher au moins un lien : l'anomalie est portée par les cartes de liens).
3. Ouvrir les outils de développement Chrome, onglet *Lighthouse*.
4. Sélectionner la seule catégorie *Accessibility*, puis lancer l'analyse.
5. Lire la section des audits en échec.

### Résultat attendu

Score Accessibility de 100 et hiérarchie de titres séquentielle, chaque niveau
de titre suivant immédiatement son parent.

### Résultat obtenu

Score **96**. Audit en échec : « **Heading elements are not in a
sequentially-descending order** ». L'inspection du document confirme la séquence
`h1` (« Liens créés ») puis directement `h3` (titre de chaque carte de lien),
sans `h2` intermédiaire.

### Fréquence et périmètre

Systématique, dès qu'au moins un lien est affiché. Indépendant du navigateur : le
défaut est dans la structure du document, pas dans son rendu. La page publique
non connectée n'est **pas** concernée, ce qui explique que l'anomalie ait échappé
au premier audit, mené sur l'écran de connexion.

### Analyse et cause racine

Les cartes de liens rendaient leur titre dans un `<h3>`, choisi pour sa **taille
visuelle** et non pour son **niveau sémantique**. Placées directement sous le
`<h1>` de la section, ces cartes créaient un saut de niveau `h1 → h3`.

Un lecteur d'écran construit son plan de navigation sur cette hiérarchie : le
saut lui fait annoncer un niveau de profondeur qui n'existe pas, et laisse
supposer une section intermédiaire manquante. Le critère RGAA sur la hiérarchie
des titres n'est donc pas respecté.

Fichier concerné : `client/src/main.jsx`, rendu de la carte de lien.

### Préconisation de correction

Passer le titre de carte de `<h3>` à `<h2>`, et **rétablir la taille visuelle par
le CSS** plutôt que par le niveau de titre — une classe `.link-title` dans
`client/src/styles.css`. La distinction est le cœur du correctif : le niveau de
titre exprime la structure, la feuille de style exprime l'apparence ; les
confondre est la cause de l'anomalie.

Vérification de non-régression attendue : contrôle automatisé de la séquence des
titres du tableau de bord (aucun saut de niveau), puis nouvel audit Lighthouse
**sur la production** — l'anomalie ayant été constatée là, c'est là qu'elle doit
être vérifiée close.

| Champ | Contenu |
|---|---|
| **Statut** | Corrigé et vérifié en production |
| **Traitement** | `docs/11-Traitement-anomalie.md` |

## 8. Fiche de consignation — ANO-2026-08-002

Anomalie d'un type différent, retenue parce qu'elle montre que le processus ne
traite pas que des défauts d'interface : celle-ci est une **régression de
sécurité introduite par une opération de maintenance**.

| Champ | Contenu |
|---|---|
| **Identifiant** | ANO-2026-08-002 (la fiche 001 du mois couvre les 5 vulnérabilités traitées par `5a3a278`) |
| **Titre** | Une montée mineure de `geoip-lite` réintroduit une vulnérabilité haute |
| **Date de détection** | 18 août 2026 |
| **Canal de détection** | Audit de sécurité (canal 5) — `npm audit` lors de la revue des dépendances |
| **Gravité** | Majeure — vulnérabilité haute dans une dépendance de production, relevée d'un niveau au titre de la règle du § 4 |
| **Étiquettes** | `dependances`, `securite` |
| **Environnement et version** | Poste de développement, Node v24.14.1 / npm 11.11.0, ShortLink 1.1.0 |

### Étapes de reproduction

1. Partir d'un dépôt où `package.json` déclare `"geoip-lite": "^1.2.2"` et où
   `npm audit` ne remonte aucune vulnérabilité.
2. Exécuter `npm outdated` : `geoip-lite` apparaît en `Current 1.2.2` /
   `Wanted 1.4.10` — une montée est disponible dans la plage déclarée.
3. Exécuter `npm update`.
4. Exécuter `npm audit`.

### Résultat attendu

Une montée de version **mineure**, restant dans la plage semver déclarée, ne doit
pas dégrader l'état de sécurité du projet.

### Résultat obtenu

`npm audit` remonte **2 vulnérabilités (1 haute, 1 modérée)** là où il n'y en
avait aucune, toutes deux portées par la dépendance transitive `ip-address` :

- XSS dans les méthodes `Address6` génératrices de HTML (modérée) ;
- décodage des octets à zéro initial en décimal au lieu d'octal, permettant un
  contournement de frontière de confiance et une SSRF (haute).

### Fréquence et périmètre

Systématique et reproductible sur tout poste. Le périmètre est la seule
utilisation du paquet : `geoip.lookup()` dans `src/services/analyticsService.js`,
appelée pour enrichir les statistiques de clic.

### Analyse et cause racine

Trois faits s'enchaînent :

1. `geoip-lite` est vulnérable sur toute la plage `1.3.0 - 2.0.1` ; la 1.2.2
   installée en était **hors**.
2. La contrainte `^1.2.2` autorisait pourtant 1.4.10 : la protection reposait sur
   le **hasard du lockfile**, pas sur une règle.
3. Le correctif est hors d'atteinte de la branche 1.x : `geoip-lite@1.4.10` fige
   `ip-address` à `5.8.9 - 5.9.4`, alors que l'avis est corrigé en 10.3.1.

L'historique Git montre que le commit `ce90682` du 24 juillet 2026 avait **déjà**
rétrogradé ce paquet de `^1.4.10` vers `^1.2.2` pour cette raison — en conservant
le caret. Le correctif de juillet était donc **fragile par construction** :
n'importe quel `npm update` le défaisait silencieusement. C'est la cause racine
réelle, et elle est de nature procédurale, non technique.

### Préconisation de correction

1. **Pincer la version exacte** : `"geoip-lite": "1.2.2"`, sans caret. C'est le
   retrait du caret, et non le choix de la version, qui corrige durablement.
2. **Ne pas monter en 2.x** : cette branche corrige la vulnérabilité mais exige
   `node >=24.0.0`, ce qui ferait tomber le support de Node 22 déclaré dans
   `engines` et testé en intégration continue. Décision reportée, avec échéance
   documentée (fin du support de Node 22, avril 2027).
3. **Rendre l'incompatibilité d'environnement bloquante** : ajouter
   `engine-strict=true` dans `.npmrc`. Sans cela, une montée exigeant Node ≥ 24
   passe l'intégration continue au vert — ce qui a effectivement été observé sur
   la demande de fusion #5.

Vérification de non-régression attendue : `npm audit` à 0, les 89 tests, le build
frontend, et `npm ci` cohérent avec le lockfile.

| Champ | Contenu |
|---|---|
| **Statut** | Corrigé — commits `5a3a278` et `59df1ff` |
| **Détail du traitement** | `docs/09-Maintenance-dependances.md`, § 7 et § 10 |

## 9. Bilan des canaux, au 18 août 2026

| Canal | Anomalies détectées à ce jour |
|---|---|
| Sondes de supervision | 1 — exercice de la chaîne d'alerte (issue #1) |
| Audit des dépendances | 7 vulnérabilités — 1 le 24/07 (via la CI), 5 le 18/08, 2 réintroduites puis écartées (ANO-2026-08-002) |
| Intégration continue | 2 — BUG-004 (erreur 429 pendant les tests) et la CI rouge du 24/07 restée inaperçue faute d'alerte planifiée |
| Recette et essais de développement | 5 — BUG-001 expiration, BUG-002 affichage des dates, BUG-003 titre non enregistré, BUG-005 taille de QR, BUG-006 collision de code |
| Audits accessibilité et sécurité | 3 — contraste insuffisant, BUG-007 focus non restauré, ANO-2026-07-008 hiérarchie des titres |
| Journaux et observation directe | 0 anomalie consignée à ce jour |

Enseignement tiré de ce relevé : **aucune anomalie n'est venue d'un signalement
utilisateur**, ce qui confirme le choix d'une collecte d'abord automatique décrit
au § 1.

## 10. Limites du processus

1. **Pas de canal pour le visiteur anonyme** (§ 2) : une anomalie purement
   visuelle sur la page d'aperçu ne serait vue qu'à la prochaine recette.
2. **Consignation a posteriori pour les canaux 4 à 6** : la recette et les audits
   produisent des constats qui doivent être recopiés en fiche par un humain, avec
   le risque d'oubli que cela implique.
3. **Pas de mesure du délai de traitement** : les dates d'ouverture et de clôture
   sont disponibles dans GitHub, mais aucun indicateur agrégé (délai moyen de
   correction) n'est calculé.
4. **Mainteneur unique** : le triage n'est pas contradictoire. Personne ne relit
   l'évaluation de gravité, ce qui expose à sous-estimer une anomalie.
5. **Dépôt public** : la règle d'expurgation des secrets (§ 3) repose sur la
   discipline du rédacteur ; aucun contrôle automatique ne l'applique.
