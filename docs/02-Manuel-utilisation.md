# Manuel d’utilisation — ShortLink

Date de mise à jour : 24 juillet 2026

Application de production :
<https://short-link-omega.vercel.app>

## 1. Présentation

ShortLink permet de créer et gérer des liens courts à partir d’URL HTTP ou
HTTPS. L’interface affiche directement la liste des liens existants.

Fonctions disponibles dans l’interface :

- création d’un lien avec titre, alias personnalisé et expiration facultatifs ;
- génération automatique d’un code lorsque l’alias est vide ;
- copie du lien court ;
- prévisualisation de la destination ;
- affichage du QR code ;
- modification du titre, de la destination, des tags et de l’expiration ;
- désactivation et réactivation ;
- affichage du nombre total de clics ;
- messages dédiés pour les liens expirés ou désactivés.

La recherche, la pagination interactive, la suppression depuis l’interface,
les statistiques détaillées et l’export CSV ne font pas partie de cette
version du prototype.

## 2. Accès administrateur

ShortLink est un outil mono-administrateur. Au premier accès, l’application
affiche l’écran **Accès administrateur** et demande la **clé d’administration**.

1. Saisir la clé fournie par le responsable de l’instance.
2. Valider : le tableau de bord (liste des liens et actions de gestion)
   s’affiche.
3. La clé est conservée uniquement pour la session du navigateur
   (`sessionStorage`) et un bouton permet de se **déconnecter**.

Sans clé valide, seules les fonctions publiques restent accessibles
(redirection d’un lien court, prévisualisation, QR code). Une clé absente ou
incorrecte renvoie un refus et aucune donnée de gestion n’est exposée.

## 3. Créer un lien court

1. Cliquer sur **Créer un lien**, à côté de **Rafraîchir**.
2. Une fenêtre de création s’ouvre.
3. Renseigner l’**URL longue**. Elle doit commencer par `http://` ou
   `https://`.
4. Ajouter, si nécessaire :
   - un titre ;
   - un alias personnalisé ;
   - une date et une heure d’expiration.
5. Cliquer sur **Créer le lien**.

Après la création, la fenêtre affiche :

- le lien court ;
- le bouton **Copier** ;
- le bouton de prévisualisation ;
- le QR code.

Lorsque l’alias est vide, ShortLink génère automatiquement un code court
aléatoire.

## 4. Utiliser un alias personnalisé

Un alias remplace le code généré automatiquement.

Exemple :

```text
https://shortlink-whkw.onrender.com/mon-projet
```

Caractères autorisés :

- lettres ;
- chiffres ;
- tirets.

Les espaces, tirets bas et caractères spéciaux sont refusés. Un alias doit
également être unique. Si l’alias existe déjà, la création est refusée et un
message apparaît dans la fenêtre.

## 5. Gérer les liens

Chaque carte contient :

- le titre ;
- l’URL de destination ;
- le lien court ;
- le nombre de clics ;
- l’état actif ou inactif ;
- la date d’expiration ;
- les tags ;
- les actions **Ouvrir**, **Preview**, **QR**, **Modifier** et
  **Désactiver/Réactiver**.

Le bouton **Rafraîchir** recharge la liste. Lorsque l’utilisateur ouvre un lien
et revient sur l’application, la liste est également resynchronisée
automatiquement.

## 6. Modifier un lien

1. Cliquer sur **Modifier** dans la carte concernée.
2. Une fenêtre de modification s’ouvre.
3. Modifier un ou plusieurs champs :
   - titre ;
   - URL de destination ;
   - tags séparés par des virgules ;
   - date d’expiration ;
   - état actif.
4. Cliquer sur **Enregistrer**.

La liste est rechargée après l’enregistrement.

## 7. Expiration et activation

### Lien désactivé

Cliquer sur **Désactiver**. La carte passe à l’état `Inactif` et le bouton
devient **Réactiver**. Si l’utilisateur essaie ensuite de l’ouvrir depuis le
tableau de bord, une fenêtre **Lien désactivé** apparaît.

### Lien expiré

Lorsque la date d’expiration est dépassée, l’ouverture depuis le tableau de
bord affiche une fenêtre **Lien expiré** avec la date concernée.

Après modification d’une expiration passée vers une date future, le lien
redevient accessible. Les réponses de redirection ne sont pas mises en cache,
afin d’éviter de conserver un ancien état expiré.

## 8. Preview et QR code

### Preview

Le bouton **Preview** affiche la destination avant la redirection. L’utilisateur
peut continuer vers la destination ou annuler.

### QR code

Le bouton **QR** ouvre le QR code PNG associé au lien. Après une création, le
QR code est également affiché directement dans la fenêtre de résultat.

Pour enregistrer l’image : clic droit sur le QR code, puis
**Enregistrer l’image sous**.

## 9. Validation et sécurité visibles

- seules les URL HTTP et HTTPS sont acceptées ;
- les alias sont contrôlés et doivent être uniques ;
- HTTPS est actif sur Vercel et Render ;
- CORS autorise le frontend
  `https://short-link-omega.vercel.app` ;
- les entrées sont validées côté serveur ;
- les opérations de gestion exigent la clé d’administration (`X-Admin-Key`) ;
- l’API applique des en-têtes de sécurité et une limitation de requêtes ;
- les erreurs sont affichées sans faire planter l’interface.

Les opérations de gestion (création, liste, modification, désactivation) sont
protégées par une clé d’administration : l’application la demande au premier
accès puis l’envoie via l’en-tête HTTP `X-Admin-Key`. Les redirections, la
prévisualisation et le QR code restent publics.

Conformément au périmètre du MVP, ShortLink ne gère pas de comptes utilisateurs
multiples : c’est un outil mono-administrateur. Cette limite de périmètre, déjà
identifiée dans le SWOT du dossier de conception (« absence de base
d’utilisateurs »), est détaillée dans le dossier de sécurité.

## 10. Utilisation mobile

À moins de 600 pixels de largeur :

- la liste s’adapte à la largeur de l’écran ;
- les actions sont réorganisées ;
- les fenêtres de création et de modification apparaissent en panneau depuis
  le bas ;
- leur contenu reste défilable ;
- les champs et boutons restent accessibles.

## 11. Résolution des problèmes

| Problème | Solution |
|---|---|
| Alias déjà utilisé | Choisir un autre alias ou laisser le champ vide |
| Validation refusée | Vérifier que l’URL commence par `http://` ou `https://` |
| Lien désactivé | Cliquer sur **Réactiver** |
| Lien expiré | Modifier la date d’expiration vers une date future |
| QR absent | Actualiser après le réveil éventuel du service Render |
| Données anciennes | Cliquer sur **Rafraîchir** |

## 12. Preuves à intégrer au PDF

- liste des liens et boutons de gestion ;
- fenêtre de création et résultat avec QR ;
- fenêtre de modification et résultat enregistré ;
- refus d’un alias déjà utilisé ;
- refus du protocole FTP ;
- fenêtres **Lien désactivé** et **Lien expiré** ;
- en-tête CORS en production ;
- affichage responsive à 400 pixels.

