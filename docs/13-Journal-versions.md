# Journal des versions déployées — ShortLink

Date de mise à jour : 19 août 2026
Compétence visée : **C4.3.2** — établir un journal des versions déployées en y
intégrant la documentation des correctifs réalisés.

Le journal lui-même est le fichier **`CHANGELOG.md`**, à la racine du dépôt. Le
présent document en présente les règles de tenue (§ 1 à § 3), la chaîne de
traçabilité qui relie une anomalie à sa mise en production (§ 4), la procédure de
publication (§ 5), puis l'audit qui a conduit à sa remise en ordre le 19 août 2026
(§ 6).

## 1. Support, conventions et périmètre

| Élément | Choix retenu |
|---|---|
| Support du journal | `CHANGELOG.md`, versionné dans le dépôt |
| Format | inspiré de *Keep a Changelog* : une section par version, des rubriques stables (Ajouté, Modifié, Corrigé, Sécurité, Tests) |
| Numérotation | versionnage sémantique — majeur pour une rupture, mineur pour un ajout compatible, correctif pour un correctif seul |
| Marquage technique | une étiquette Git annotée `vX.Y.Z` par version |
| Source de la date de mise en production | l'API de déploiement de GitHub, et non une saisie manuelle |

Le journal est dans le dépôt, et non dans un outil externe, pour une raison
précise : une version se lit alors **au même endroit que le code qu'elle décrit**,
et toute correction du journal passe par le même contrôle que le code.

### Ce qui figure au journal, et ce qui n'y figure pas

| Type de modification | Entrée au journal |
|---|---|
| Nouvelle fonctionnalité visible par un utilisateur | oui |
| Correctif d'anomalie | oui, avec son identifiant d'anomalie |
| Correctif de sécurité ou montée de dépendance vulnérable | oui, rubrique Sécurité |
| Modification de comportement même mineure | oui, rubrique Modifié |
| Documentation seule | non — sauf lorsqu'elle accompagne une version, où elle est mentionnée dans les ajouts |
| Remaniement interne sans effet observable | non |

## 2. Contenu exigé d'une entrée

Chaque section de version porte, en tête, les trois éléments qui la rendent
vérifiable :

```
## [1.0.2] - 2026-07-24

Étiquette `v1.0.2` · commit `aea4aab` · déployée le 24/07/2026 à 17:18:27 UTC.
```

Puis les rubriques utiles. Un correctif y est décrit selon quatre points, faute de
quoi il n'est pas documenté mais seulement mentionné :

1. **l'identifiant de l'anomalie**, qui renvoie à sa fiche de consignation ;
2. **le symptôme constaté**, dans les termes de l'utilisateur ;
3. **ce qui a été changé**, sans obliger à lire le diff ;
4. **la preuve que l'anomalie est résolue**, avec sa mesure avant/après.

L'entrée 1.0.2 du journal illustre ces quatre points sur un cas réel : anomalie
ANO-2026-07-008, saut de niveau de titre, passage de `<h3>` à `<h2>` avec la taille
portée par le CSS, audit Lighthouse du tableau de bord de 96 à 100.

## 3. Versions publiées

| Version | Étiquette | Commit | Mise en production | Nature |
|---|---|---|---|---|
| 1.1.0 | `v1.1.0` | `59df1ff` | 18/08/2026 13:31:54 UTC | Supervision, alertes, maîtrise des dépendances |
| 1.0.2 | `v1.0.2` | `aea4aab` | 24/07/2026 17:18:27 UTC | Correctif d'accessibilité |
| 1.0.1 | `v1.0.1` | `d1efaee` | non déployée isolément | Correctifs d'accessibilité |
| 1.0.0 | `v1.0.0` | `ce90682` | 24/07/2026 00:29:18 UTC | Première version complète |

Les jalons 0.1.0 à 0.3.0 sont conservés au journal comme mémoire des étapes de
développement, en signalant qu'ils ne correspondent à aucun commit de l'historique
actuel (§ 6, constat g).

## 4. Chaîne de traçabilité, de l'anomalie à la production

C'est la propriété que le journal doit rendre possible : partir d'un défaut
constaté et remonter jusqu'à la preuve de sa disparition.

| Anomalie | Correctif | Version | Mise en production | Preuve de résolution |
|---|---|---|---|---|
| Contraste insuffisant du vert de marque (RGAA) | `d1efaee` | 1.0.1 | avec la 1.0.2 | Lighthouse page publique 94 → 100 |
| **BUG-007** — focus non restitué après fermeture d'une modale | `d1efaee` | 1.0.1 | avec la 1.0.2 | Parcours clavier automatisé : focus rendu au déclencheur |
| **ANO-2026-07-008** — hiérarchie de titres non séquentielle | `aea4aab` | 1.0.2 | 24/07/2026 17:18:27 UTC | Lighthouse tableau de bord 96 → 100, et contrôle des fichiers servis par le CDN 25 jours après |
| 5 vulnérabilités de dépendances | `5a3a278` | 1.1.0 | 18/08/2026 13:31:54 UTC | `npm audit` de 5 avis à 0 |
| **ANO-2026-08-002** — montée mineure réintroduisant une vulnérabilité haute | `59df1ff` | 1.1.0 | 18/08/2026 13:31:54 UTC | `npm audit` à 0, `engine-strict` vérifié par un échec `EBADENGINE` provoqué |

Les anomalies BUG-001 à BUG-006, détectées avant la version 1.0.0, sont tracées
dans `docs/05-Plan-correction-bugs.md`, section « Traçabilité des corrections ».

## 5. Procédure de publication d'une version

1. Vérifier que la branche est à jour et que la chaîne d'intégration est verte.
2. Choisir le numéro selon SemVer, en fonction de la nature des modifications
   accumulées.
3. Incrémenter le champ `version` de `package.json` — il est exposé par la sonde
   `GET /health`, ce qui permet de lire depuis l'extérieur la version réellement en
   ligne.
4. Rédiger la section du journal : rubriques, identifiants d'anomalies, mesures
   avant/après.
5. **Regrouper ces deux modifications dans un seul commit**, afin que la version
   du paquet et l'entrée du journal ne puissent pas diverger.
6. Pousser **ce commit seul**, puis créer l'étiquette annotée sur lui :

   ```bash
   git tag -a v1.1.0 -m "Version 1.1.0 — supervision et maintenance"
   git push origin v1.1.0
   ```

7. Relever la date de mise en production effective et la reporter dans l'entrée :

   ```bash
   gh api "repos/Aimeryy02/ShortLink/deployments?sha=$(git rev-parse v1.1.0)" \
     --jq '.[0] | "\(.environment) \(.created_at)"'
   ```

8. Publier la version sur GitHub (*Releases*), en reprenant la section du journal
   comme corps de la publication.
9. Vérifier que la version annoncée est bien celle qui est en ligne :

   ```bash
   curl -s https://shortlink-whkw.onrender.com/health
   ```

L'étape 6 mérite une explication, car elle découle d'une observation et non d'une
préférence : **un push contenant plusieurs commits ne produit qu'un seul
déploiement, celui du commit de tête**. Une étiquette posée sur un commit
intermédiaire désigne donc du code qui n'a jamais été déployé tel quel — c'est
précisément ce qui est arrivé à la version 1.0.1.

## 6. Audit de traçabilité du 19 août 2026

Le journal existait avant cet audit, mais plusieurs de ses affirmations ne
résistaient pas à la confrontation avec l'historique Git et les enregistrements de
déploiement. Les constats sont listés avec la correction appliquée.

| # | Constat établi | Correction |
|---|---|---|
| a | L'étiquette `v1.0.0` désigne `ce90682`, commit qui **contient déjà** la protection de l'administration (`adminAuthMiddleware.js` et ses tests y apparaissent). Or le journal attribuait cette protection à la version 1.0.1 | Entrée 1.0.0 réécrite pour décrire ce que le commit étiqueté contient réellement ; entrée 1.0.1 réduite aux correctifs d'accessibilité qui lui appartiennent |
| b | L'entrée 1.0.0 était datée du 21/07/2026, alors que le commit étiqueté est du 24/07 et qu'aucun commit n'existe au 21/07 | Date corrigée au 24/07/2026 |
| c | L'entrée 1.0.0 annonçait « 56+ unit tests » et une couverture de 92,83 % | Comptage sur le commit étiqueté : **70 cas de test dans 12 fichiers**. Chiffre corrigé, couverture ramenée à la valeur effectivement mesurée et datée (91,98 %) |
| d | Le commit `aea4aab`, correctif de l'anomalie ANO-2026-07-008, était **déployé en production sans figurer dans aucune version** du journal | Création de la version **1.0.2** et de son étiquette `v1.0.2`, avec la documentation complète du correctif |
| e | Le champ `version` de `package.json` valait encore 1.0.0 aux versions 1.0.1 et 1.0.2 | Aligné sur 1.1.0, et l'étape 3 de la procédure rend l'incrément obligatoire. La version est désormais exposée par `GET /health`, donc vérifiable de l'extérieur |
| f | L'étiquette `v1.0.1` ne correspond à **aucun déploiement enregistré** : poussée avec d'autres commits, son contenu n'est parvenu en production qu'avec la 1.0.2 | Consigné tel quel dans le journal plutôt que masqué ; l'étape 6 de la procédure évite que le cas se reproduise |
| g | Les entrées 0.1.0 à 0.3.0 ne correspondent à aucun commit de l'historique actuel, celui-ci ayant été consolidé le 24/07/2026 | Regroupées sous « Jalons antérieurs », avec mention explicite de l'absence de traçabilité technique |
| h | Les étiquettes `v1.0.0` et `v1.0.1` ont été créées le même jour à la même seconde, donc **après coup** | Fait non corrigeable : déplacer une étiquette publiée reviendrait à réécrire une référence partagée, ce que `docs/03-Manuel-mise-a-jour.md` proscrit. La version 1.1.0 est étiquetée selon la procédure du § 5 |
| i | Aucune publication *Release* n'existe sur GitHub | Étape 8 ajoutée à la procédure ; publication à réaliser (§ 7) |

Deux enseignements sont tirés de cet audit et inscrits dans la procédure :

- **une version n'existe que si elle a été déployée** ; c'est pourquoi la date de
  mise en production est relevée depuis l'API de déploiement et non saisie de
  mémoire ;
- **une correction déployée sans entrée au journal est une régression de
  traçabilité** : le constat *d* montre qu'un correctif d'accessibilité vérifié en
  production était resté invisible dans le journal pendant 26 jours.

## 7. Reste à faire

| Action | Pourquoi elle n'est pas encore faite |
|---|---|
| Pousser les étiquettes `v1.0.2` et `v1.1.0` | Créées localement ; la publication d'étiquettes est une opération sortante, laissée à la décision du mainteneur |
| Créer les publications *Releases* sur GitHub pour les quatre versions | Nécessite que les étiquettes soient publiées |

Commandes correspondantes :

```bash
git push origin v1.0.2 v1.1.0

gh release create v1.0.2 --title "1.0.2 — correctif d'accessibilité" --notes-file - <<'TXT'
Correction de l'anomalie ANO-2026-07-008 : hiérarchie de titres non séquentielle
sur le tableau de bord. Audit Lighthouse Accessibility : 96 → 100.
TXT

gh release create v1.1.0 --title "1.1.0 — supervision et maintenance" --notes-file - <<'TXT'
Sondes de santé, supervision automatisée avec alertes, surveillance des
dépendances, correction de 5 vulnérabilités. 89 tests, couverture 93,05 %.
TXT
```

## 8. Bilan face aux critères de la compétence

| Critère d'évaluation | Réponse |
|---|---|
| « Établir un journal des versions déployées » | `CHANGELOG.md` : 4 versions publiées, chacune avec son étiquette, son commit et sa **date de mise en production relevée depuis l'API de déploiement**. Le § 3 en donne la vue d'ensemble |
| « en y intégrant la documentation des correctifs réalisés » | § 2 : quatre points exigés pour tout correctif — identifiant d'anomalie, symptôme, changement, preuve de résolution. Appliqué aux 5 correctifs du § 4 |
| « Le journal contient les améliorations amenées par cette version (anomalies corrigées, nouvelles fonctionnalités, etc.) » | Rubriques stables Ajouté / Modifié / Corrigé / Sécurité / Tests, renseignées pour les 4 versions |
| « Les correctifs déployés sont documentés » | § 4 : chaîne anomalie → correctif → version → mise en production → preuve, pour 5 correctifs vérifiables dans le dépôt |
| Fiabilité du journal | § 6 : audit de 9 constats confrontés à l'historique Git et aux enregistrements de déploiement, avec la correction de chacun — dont une version entière qui manquait et une étiquette qui n'avait jamais été déployée |
