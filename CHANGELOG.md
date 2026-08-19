# Journal des versions — ShortLink

Toutes les évolutions notables du logiciel sont consignées dans ce fichier.

Format inspiré de [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/) et
versionnage sémantique selon [SemVer](https://semver.org/lang/fr/).

Les règles de tenue de ce journal, la procédure de publication d'une version et
l'audit de traçabilité dont il est issu sont décrits dans
`docs/13-Journal-versions.md`.

## Versions publiées

Chaque version renvoie à son étiquette Git, au commit qu'elle désigne et à la date
de sa mise en production, telle qu'enregistrée par la plateforme d'hébergement.

| Version | Étiquette | Commit | Mise en production |
|---|---|---|---|
| 1.1.0 | `v1.1.0` | `59df1ff` | 18/08/2026 à 13:31:54 UTC |
| 1.0.2 | `v1.0.2` | `aea4aab` | 24/07/2026 à 17:18:27 UTC |
| 1.0.1 | `v1.0.1` | `d1efaee` | non déployée isolément — contenu mis en ligne avec la 1.0.2 |
| 1.0.0 | `v1.0.0` | `ce90682` | 24/07/2026 à 00:29:18 UTC |

---

## [1.1.0] - 2026-08-18

Étiquette `v1.1.0` · commit `59df1ff` · déployée le 18/08/2026 à 13:31:54 UTC.

Version consacrée au maintien en condition opérationnelle : supervision,
alertes et maîtrise des dépendances.

### Ajouté

- Sonde de vivacité `GET /health` : état du processus, version, temps de
  fonctionnement, environnement.
- Sonde d'aptitude au service `GET /health/ready` : vérifie par un `ping` effectif
  la connexion à MongoDB, la présence de la clé d'administration côté serveur et
  la mémoire du processus. Répond `200` si le service est apte, `503` s'il est
  dégradé, avec le détail de la sonde en défaut.
- Supervision automatisée (`.github/workflows/supervision.yml`) : quatre contrôles
  de production toutes les 30 minutes, tolérants au démarrage à froid, avec
  ouverture puis clôture automatiques d'une issue d'incident.
- Mode exercice de la chaîne d'alerte, pour vérifier le circuit de signalement
  sans provoquer de panne réelle.
- Surveillance des dépendances : `.github/dependabot.yml` (versions npm chaque
  semaine, actions GitHub chaque mois) et audit planifié
  (`.github/workflows/audit-dependances.yml`) qui ouvre puis clôt un signalement
  étiqueté `dependances` / `securite`.
- Gabarit de consignation d'anomalie `.github/ISSUE_TEMPLATE/anomalie.yml`.
- Documentation d'exploitation : supervision (`docs/08`), maintenance des
  dépendances (`docs/09`), gestion des anomalies (`docs/10`), traitement d'un
  correctif (`docs/11`), axes d'amélioration (`docs/12`).

### Modifié

- En-tête `Cache-Control: no-store` sur les points d'entrée de supervision, afin
  qu'aucun intermédiaire ne serve un état de santé périmé.
- Version du paquet alignée sur ce journal : 1.0.0 → 1.1.0. Le champ `version` de
  `package.json` n'avait pas été incrémenté lors des versions 1.0.1 et 1.0.2.
- `helmet` 8.2.0 → 8.3.0 et `vite` 8.1.5 → 8.2.1 (montées mineures, dans les
  plages de compatibilité déjà déclarées).

### Sécurité

- Correction de 5 vulnérabilités remontées par `npm audit`, apparues sans aucune
  modification du code : `brace-expansion`, `js-yaml`, `mongoose`, `nanoid` et
  `postcss` (montées de niveau correctif).
- `geoip-lite` **pincé** à la version exacte 1.2.2. La contrainte `^1.2.2`
  autorisait la 1.4.10, qui réintroduit une vulnérabilité haute par la dépendance
  transitive `ip-address`. La branche 2.x, qui corrige cette faille, exige
  Node ≥ 24 et ferait tomber le support de Node 22 : décision reportée et
  documentée.
- `engine-strict=true` dans `.npmrc` : l'installation échoue désormais si une
  dépendance exige une version de Node incompatible, en local comme en
  intégration continue. Sans ce garde-fou, une telle incompatibilité passait les
  contrôles au vert.

### Tests

- 89 tests unitaires répartis en 14 suites, dont 19 dédiés aux sondes de
  supervision. Couverture mesurée : 93,05 % des instructions.

---

## [1.0.2] - 2026-07-24

Étiquette `v1.0.2` · commit `aea4aab` · déployée le 24/07/2026 à 17:18:27 UTC.

### Corrigé

- **ANO-2026-07-008 (BUG-008)** — hiérarchie de titres non séquentielle sur le
  tableau de bord. Les titres de cartes de liens passaient de `<h3>` alors que le
  niveau précédent était `<h1>`, créant un saut de niveau contraire au RGAA. Le
  titre est désormais un `<h2>`, sa taille visuelle étant portée par la classe
  `.link-title` et non plus par le niveau de balise.
  Effet vérifié en production : audit Lighthouse Accessibility du tableau de bord
  **96 → 100**, sans modification de l'apparence.
  Traitement détaillé dans `docs/11-Traitement-anomalie.md`.

---

## [1.0.1] - 2026-07-24

Étiquette `v1.0.1` · commit `d1efaee`.

Cette version n'a pas fait l'objet d'un déploiement propre : elle a été poussée en
même temps que d'autres commits, et son contenu a été mis en ligne avec la
version 1.0.2. Le fait est consigné ici plutôt que corrigé après coup.

### Corrigé

- Contraste insuffisant du vert de marque au regard du RGAA : `#16a34a` →
  `#15803d`, sur l'interface d'administration comme sur la page d'aperçu servie
  par l'API. Audit Lighthouse de la page publique : **94 → 100**.
- **BUG-007** — le focus n'était pas restitué à l'élément déclencheur après la
  fermeture d'une fenêtre modale, rendant la navigation au clavier impraticable.
  Cause : l'attribut `autoFocus` du premier champ s'exécutait avant la mémorisation
  du déclencheur.
- Mise en cache des liens expirés ou désactivés évitée, afin qu'un état
  d'indisponibilité ne soit pas servi depuis un cache.

### Modifié

- Documents de travail et pièces d'évaluation retirés du suivi Git (`perso/`).

---

## [1.0.0] - 2026-07-24

Étiquette `v1.0.0` · commit `ce90682` · déployée le 24/07/2026 à 00:29:18 UTC.

Première version considérée comme complète et exploitable : périmètre fonctionnel
attendu, administration protégée et documentation d'exploitation.

### Ajouté — fonctionnalités

- Raccourcissement d'URL avec code court de 6 caractères et prise en charge d'un
  alias personnalisé.
- Redirection publique, page d'aperçu avant redirection, génération de QR code.
- Métadonnées de lien : titre, étiquettes, date d'expiration, activation et
  désactivation.
- Liste paginée avec recherche et filtrage par étiquette ; modification et
  suppression d'un lien.
- Statistiques de clics : volume, provenance géographique, appareil, système,
  navigateur et référent.
- Interface d'administration React servie par Vercel, avec fenêtres modales pour
  la création et la modification.

### Ajouté — administration et exploitation

- Protection de toutes les opérations de gestion par une clé d'administration
  transmise dans l'en-tête `X-Admin-Key`, avec écran de connexion dédié et clé
  conservée uniquement en `sessionStorage`.
- Documentation d'exploitation : manuel de déploiement, manuel d'utilisation,
  manuel de mise à jour, cahier de recettes, plan de correction des bogues,
  dossier sécurité et accessibilité, harnais de tests (`docs/01` à `docs/07`).

### Sécurité

- Comparaison de la clé d'administration à temps constant après empreinte
  SHA-256 ; réponse `503` si la clé du serveur est absente ou trop courte, `401`
  générique si elle est erronée. La clé n'est jamais journalisée.
- CORS restreint aux origines autorisées en production.
- En-têtes de sécurité par Helmet, limitation de débit sur l'API et sur les
  redirections, corps de requête limité à 20 Ko.
- Validation systématique des entrées par schémas Zod ; protocoles limités à HTTP
  et HTTPS ; métacaractères d'expression régulière échappés dans la recherche.
- Détection d'URL d'hameçonnage avant création d'un lien.
- Pseudonymisation des adresses IP avant enregistrement des clics.
- Retrait des dépendances `bcryptjs` et `useragent`, devenues inutiles ou
  vulnérables.

### Tests

- 70 cas de test répartis en 12 fichiers, comptés sur le commit étiqueté.
  Couverture mesurée à cette date : 91,98 % des instructions.
- Intégration continue GitHub Actions sur Node 22.x et 24.x : tests, couverture,
  construction du frontend et audit de sécurité.

---

## Jalons antérieurs à la version 1.0.0

Les entrées ci-dessous décrivent les étapes fonctionnelles de la phase de
développement initiale. Elles ne correspondent **pas** à des commits identifiables
dans l'historique actuel : celui-ci a été consolidé le 24 juillet 2026, notamment
pour retirer du suivi des documents qui n'avaient pas à y figurer. Elles sont
conservées pour la mémoire du projet, sans prétendre à une traçabilité technique.

### [0.3.0] - 2026-07-20

- Statistiques de clics avec provenance géographique et type d'appareil.
- Application effective de l'expiration des liens.
- Suivi du référent, détection de l'appareil, du système et du navigateur.

### [0.2.0] - 2026-07-19

- Génération de QR code, page d'aperçu, alias personnalisé.
- Métadonnées de lien, points d'entrée de modification, liste paginée et filtrée.
- Gestion centralisée des erreurs et validation par schémas Zod.

### [0.1.0] - 2026-07-18

- Raccourcissement d'URL et redirection de base.
- Génération du code court, stockage MongoDB, mise en place de l'API Express.
- Amorce du frontend React et de la chaîne de construction Vite.
