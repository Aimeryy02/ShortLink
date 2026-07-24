# Preuves C2.2.2 — Harnais de tests unitaires

Date de vérification : 24 juillet 2026

## Objectif

Démontrer que le projet dispose d'un harnais de tests unitaires reproductible,
automatisé et assorti de seuils de couverture bloquants.

## Commandes

Depuis la racine du projet :

```powershell
npm test
npm run test:coverage
```

Le rapport HTML détaillé est généré dans :

```text
coverage/lcov-report/index.html
```

## Résultats vérifiés

La commande `npm.cmd run test:coverage -- --runInBand` se termine avec succès :

| Indicateur | Résultat |
|---|---:|
| Suites | 12 réussies sur 12 |
| Tests | 70 réussis sur 70 |
| Statements | 91,98 % |
| Branches | 80 % |
| Fonctions | 98 % |
| Lignes | 93,43 % |

Le fichier `jest.config.js` impose un seuil global minimal de 70 % pour chacun
des quatre indicateurs. Une baisse sous ces seuils rend la commande de
couverture — et donc la CI — défaillante.

## Exécution dans la CI

Le workflow `.github/workflows/ci.yml` lance automatiquement les tests sous
Node.js 22 et Node.js 24, génère la couverture et la transmet à Codecov.

Preuve vérifiée :

- GitHub Actions, exécution no 12 ;
- commit `c1ce2da` ;
- statut final `success` ;
- URL :
  `https://github.com/Aimeryy02/ShortLink/actions/runs/30054927121`.

## Périmètre et limite annoncée

La couverture mesure le périmètre unitaire déclaré dans `jest.config.js`.
`src/config/**`, `src/routes/**`, `src/middlewares/**` et `src/app.js` sont
exclus des statistiques. Les tests reposant sur des mocks vérifient les unités
de manière isolée ; ils complètent les recettes fonctionnelles et ne s'y
substituent pas.

## Captures à intégrer au PDF

1. Le terminal montrant `12 passed`, `70 passed` et le tableau de couverture.
2. La page GitHub Actions de l'exécution no 12 avec les cinq jobs verts.
3. Facultatif : le résumé HTML de `coverage/lcov-report/index.html`.

## Conclusion

Le harnais est exécutable localement et dans la CI, les seuils sont
automatiques et les résultats dépassent les niveaux attendus. C2.2.2 est
considéré comme acquis sur le périmètre de couverture déclaré.
