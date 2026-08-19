# Collaboration avec le support — ShortLink

Date de mise à jour : 19 août 2026
Compétence visée : **C4.3.3** — collaborer avec les équipes de support, en
fournissant une expertise technique, en répondant aux retours clients et en
résolvant des problèmes complexes.

Ce document présente **un problème réellement résolu par un aller-retour entre le
retour d'usage et l'expertise technique** : le contexte du retour et le problème à
résoudre (§ 2), la résolution apportée (§ 3), et la contribution de chaque partie
prenante (§ 4). Le § 5 décrit ce que le projet met à disposition d'une fonction de
support, et le § 6 ce que cet épisode a changé durablement dans les méthodes.

## 1. Contexte organisationnel, sans enjoliver

**ShortLink n'a pas d'équipe de support constituée.** Le périmètre arrêté au
cadrage est celui d'un service mono-administrateur, et l'analyse SWOT du dossier de
cadrage retient explicitement l'absence d'organisation de support comme une
limite assumée du projet.

Il serait donc faux de présenter ici une collaboration entre services. Ce qui a
réellement existé, et qui est présenté, c'est la **fonction** de support, tenue
dans des rôles distincts :

| Fonction | Qui la tient dans ce projet | Ce que cela implique |
|---|---|---|
| Remontée depuis l'usage réel | l'exploitant du service, en situation d'utilisation | Il mesure dans les conditions réelles, pas dans celles du développement |
| Qualification et diagnostic | l'expertise technique | Reproduire, trouver la cause, écrire le correctif |
| Validation de la résolution | l'exploitant, à nouveau | Celui qui a constaté est celui qui déclare clos |
| Arbitrage en cas de désaccord | un référentiel outillé (Lighthouse / RGAA) | La divergence est tranchée par une mesure, non par autorité |

Cette séparation n'est pas cosmétique : le cas ci-dessous montre que
**l'exploitant a contredit la conclusion de l'expertise technique, et qu'il avait
raison**. Sans la distinction des rôles, l'anomalie serait restée close à tort.

## 2. Le retour et le problème à résoudre

### Ce qui avait été annoncé

Le 24 juillet 2026, un audit d'accessibilité Lighthouse est mené sur la
production. Résultat : **94 / 100**, avec un défaut de contraste sur le vert de
marque. Le contraste est corrigé (`#16a34a` → `#15803d`), un nouvel audit est
lancé, il retourne **100 / 100**, et le sujet est déclaré clos.

### Le retour qui contredit cette conclusion

L'exploitant relance l'audit **dans ses conditions d'usage** — connecté, sur le
tableau de bord affichant ses liens — et obtient **96 / 100**. Il transmet la
capture d'écran, sur laquelle figure l'audit en échec, nommément :

> **Heading elements are not in a sequentially-descending order**

Le retour est donc précis : ce n'est pas « ça ne marche pas », c'est une mesure
reproductible qui contredit une affirmation.

### Le problème à résoudre, à deux niveaux

**Niveau technique.** Le tableau de bord enchaînait un `<h1>` de section
directement suivi de `<h3>` pour les titres des cartes de liens, sans niveau
intermédiaire. Un lecteur d'écran construit son plan de navigation sur cette
hiérarchie : le saut de niveau lui fait annoncer une profondeur qui n'existe pas et
laisse supposer une section manquante. Le critère RGAA sur la hiérarchie des titres
n'était pas respecté.

**Niveau méthodologique, et c'est le vrai problème.** Pourquoi deux mesures du même
audit donnaient-elles deux résultats ? La confrontation des deux rapports conservés
apporte la réponse :

| Rapport | Environnement mesuré | État de la page | Score |
|---|---|---|---|
| `21a-lighthouse-PROD-page-publique-avant-94.html` | **production** | page publique, non connectée | 94 |
| `21b-lighthouse-LOCAL-apres-contraste-100.html` | **`http://127.0.0.1:5173`** | page publique, non connectée | 100 |
| Capture de l'exploitant | **production** | **tableau de bord connecté, avec liens affichés** | **96** |

Deux écarts se cumulaient donc : le « 100 » annoncé provenait d'une mesure
**locale**, et surtout d'un **état de page où le défaut ne peut pas apparaître** —
l'écran de connexion ne contient aucune carte de lien, donc aucun `<h3>` fautif.

La démonstration est directement lisible dans les rapports conservés : l'audit
`heading-order` y est **passant dans les deux cas**. Aucun des deux ne pouvait donc
détecter l'anomalie, quelle que fût l'attention portée à leur lecture. Le score de
94 puis 100 mesurait un tout autre défaut — le contraste — et le « 100 » n'était pas
un faux résultat : c'était un **résultat juste sur un périmètre trop étroit**.

C'est ce qui rend le retour de l'exploitant irremplaçable : il n'a pas corrigé une
erreur de lecture, il a couvert un périmètre que l'expertise technique n'avait pas
mesuré.

Le nommage des fichiers de preuve entretenait la confusion : celui intitulé
« après 100 » ne mesurait pas la production. Les deux rapports ont depuis été
renommés pour porter leur environnement et leur état de page dans leur nom.

## 3. La résolution apportée

### Le correctif

Commit `aea4aab`. Le titre de carte passe de `<h3>` à `<h2>`, et sa taille visuelle
est portée par une classe CSS au lieu du niveau de balise :

```diff
-                  <h3>{link.title || 'Sans titre'}</h3>
+                  <h2 className="link-title">{link.title || 'Sans titre'}</h2>
```

```css
.link-title { margin: 0 0 4px; font-size: 1.15rem; font-weight: 700; }
```

La séquence devient `h1 → h2`, et le rendu reste **identique à l'œil** : aucun
utilisateur ne voit de changement, seule la structure annoncée aux technologies
d'assistance est corrigée.

### Ce qui a été vérifié, et où

| Étape | Environnement | Résultat |
|---|---|---|
| Contrôle automatisé de la séquence des titres, après connexion | pile locale | `h1 → h2`, aucun saut de niveau |
| Suite de tests unitaires | local | 70 tests verts (état du 24/07) |
| Intégration continue | GitHub Actions | tests Node 22.x et 24.x verts, construction du frontend verte |
| Déploiement | Vercel | mis en ligne le 24/07/2026 à 17:18:27 UTC |
| **Nouvelle mesure par l'exploitant** | **production, tableau de bord connecté** | **100 / 100**, audit passant |

C'est la dernière ligne qui clôt l'anomalie : la vérification a lieu **là où le
défaut avait été constaté**, par **celui qui l'avait constaté**.

Contre-vérification menée 25 jours plus tard, directement sur les fichiers servis
par le CDN, pour s'assurer que le correctif est toujours celui qu'exécutent les
utilisateurs :

```
GET /assets/index-DEBVEcjo.css → .link-title{margin:0 0 4px;font-size:1.15rem;font-weight:700}
GET /assets/index-FT_8mQWS.js  → jsx(`h2`,{className:`link-title`,children:e.title||`Sans titre`})
```

Traçabilité complète : fiche de consignation ANO-2026-07-008 dans
`docs/10-Gestion-anomalies.md`, traitement détaillé dans
`docs/11-Traitement-anomalie.md`, version **1.0.2** au journal des versions.

## 4. Contribution des différentes parties prenantes

| Partie prenante | Contribution effective | Ce qui se serait passé sans elle |
|---|---|---|
| **Exploitant du service**, en usage réel | A mesuré dans ses conditions d'usage — connecté, avec des données — a fourni une capture nommant l'audit en échec, a contredit la conclusion de clôture, puis a validé la correction en production | L'anomalie restait ouverte tout en étant déclarée résolue. C'est la contribution décisive |
| **Expertise technique** | A accepté la mesure contradictoire, reproduit l'anomalie, identifié la cause racine — un niveau de titre choisi pour sa taille et non pour sa sémantique — écrit un correctif minimal, ajouté un contrôle de non-régression et documenté l'ensemble | Un retour précis sans diagnostic reste un constat sans correctif |
| **Référentiel outillé** (Lighthouse, critères RGAA) | A servi d'arbitre : le désaccord entre « 100 » et « 96 » a été tranché par une mesure reproductible, pas par un argument d'autorité | Le désaccord se réglait à l'opinion, avec le risque que la position du développeur l'emporte |
| **Chaîne d'intégration et de déploiement continu** | A validé le correctif sur deux versions de Node et l'a porté en production sans aucune action manuelle | Le correctif dépendait d'une mise en ligne manuelle, avec le risque d'un écart entre ce qui est validé et ce qui est livré |
| **Plateforme d'hébergement** | A fourni les enregistrements de déploiement qui datent précisément la mise en ligne | La date de mise en production reposait sur un souvenir |

Le point de collaboration à retenir n'est pas la répartition des tâches, mais
**l'acceptation d'une contradiction**. L'expertise technique avait conclu à tort ;
le retour de terrain était juste. La qualité de la collaboration s'est jouée là :
non pas dans la défense de la première conclusion, mais dans la recherche de
l'écart entre les deux mesures.

## 5. L'expertise technique mise à disposition d'une fonction de support

Répondre à un retour est une chose ; **outiller celui qui remonte** en est une
autre. Le projet fournit six moyens qu'une personne assurant le support peut
utiliser sans être développeur.

| Moyen fourni | À quelle question il répond | Particularité utile au support |
|---|---|---|
| `GET /health` | « Le service est-il debout ? » | **Aucun identifiant requis** |
| `GET /health/ready` | « Le service est-il réellement utilisable ? » | Distingue *service tombé* de *base injoignable* ou *configuration perdue*, et le dit explicitement dans sa réponse |
| Grille de gravité (`docs/10`, § 4) | « Est-ce urgent ? » | Quatre niveaux définis avec un délai de traitement associé : la qualification ne dépend pas du ressenti |
| Gabarit de consignation (`.github/ISSUE_TEMPLATE/anomalie.yml`) | « Qu'est-ce que je dois transmettre ? » | Formulaire qui **refuse la soumission** sans étapes de reproduction, résultat attendu et résultat obtenu |
| Procédure de réaction (`docs/08`, § 7) | « Que faire face à cette alerte ? » | Diagnostic et action par type d'alerte, sans avoir à lire le code |
| Journal des versions (`CHANGELOG.md`) | « Est-ce corrigé, et depuis quand ? » | Chaque version porte son étiquette, son commit et sa date de mise en production |

Les deux premiers points méritent d'être soulignés : les sondes sont **publiques et
non authentifiées**, ce qui est un choix délibéré. Une personne au support peut
qualifier un incident sans détenir la clé d'administration — donc sans qu'il faille
lui confier un secret pour qu'elle fasse son travail.

À l'inverse, une limite doit être nommée : **le visiteur anonyme n'a aucun canal de
signalement**. La fonction de support ne peut donc s'exercer que sur ce que
l'exploitant constate lui-même. C'est l'objet de la recommandation R5 de
`docs/12-Axes-amelioration.md`.

## 6. Ce que cet épisode a changé durablement

Un incident bien traité laisse une règle derrière lui, pas seulement un correctif.
Trois enseignements ont été inscrits dans les procédures :

1. **Aucune clôture sans vérification dans l'environnement d'origine du constat.**
   Une anomalie vue en production se referme sur la production, jamais en local.
   Règle inscrite au § 5 de `docs/10-Gestion-anomalies.md` — elle vient de cet
   épisode.
2. **La vérification porte sur l'état de page où le défaut a été observé.** Mesurer
   l'écran de connexion ne dit rien du tableau de bord contenant des données. La
   fiche de consignation de ANO-2026-07-008 le précise dans ses étapes de
   reproduction : « le tableau de bord doit afficher au moins un lien ».
3. **Une preuve porte son environnement dans son nom.** Les deux rapports
   Lighthouse ont été renommés pour indiquer l'environnement et l'état de page
   mesurés, le nommage précédent ayant lui-même contribué à la confusion.

## 7. Limites de cette présentation

1. **Il n'y a pas d'équipe de support**, donc pas de collaboration
   inter-équipes : les rôles sont distincts, les personnes peu nombreuses. Cette
   présentation décrit une fonction remplie, pas une organisation.
2. **Un seul cas de cette nature** sur la durée du projet, ce qui interdit toute
   généralisation statistique sur la qualité du circuit de retour.
3. **Aucun engagement de service contractuel** : les délais de la grille de gravité
   sont des objectifs internes, pas des engagements envers un client.
4. **Pas d'outil de suivi ouvert aux utilisateurs finaux** : GitHub Issues sert la
   consignation interne, il n'est pas un guichet client. Traité par R5 de
   `docs/12-Axes-amelioration.md`.

## 8. Bilan face aux critères de la compétence

| Critère d'évaluation | Réponse |
|---|---|
| « Le contexte du retour client avec une explication du problème à résoudre » | § 2 : le retour intervient **contre** une conclusion de clôture ; le problème est exposé aux deux niveaux, technique (saut de niveau `h1 → h3` et son effet sur un lecteur d'écran) et méthodologique (deux mesures divergentes, dont l'écart d'environnement et d'état de page est établi par confrontation des rapports conservés) |
| « La résolution apportée » | § 3 : le correctif exact, ce qui a été vérifié et **dans quel environnement**, la mise en ligne datée par la plateforme, la validation par le demandeur, et une contre-vérification 25 jours plus tard sur les fichiers réellement servis |
| « Une explication de la contribution des différentes parties prenantes » | § 4 : cinq parties prenantes, leur contribution effective et ce qui serait arrivé sans elles. Le point central est assumé : l'expertise technique avait conclu à tort, le retour de terrain était juste |
| « en fournissant une expertise technique » | § 5 : six moyens outillés mis à disposition d'une fonction de support, dont deux sondes publiques utilisables **sans identifiant** |
| « afin d'améliorer le logiciel » | § 6 : trois règles durables issues de l'épisode, inscrites dans les procédures de consignation et de vérification |
| Honnêteté du cadre | § 1 et § 7 : l'absence d'équipe de support est déclarée d'entrée, et les quatre limites de la présentation sont explicites |
