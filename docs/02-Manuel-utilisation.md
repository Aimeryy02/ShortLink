# Manuel d'Utilisation - ShortLink

## Table des matières

1. [Introduction](#introduction)
2. [Créer un lien court](#créer-un-lien-court)
3. [Gérer les liens](#gérer-les-liens)
4. [Utiliser les alias](#utiliser-les-alias)
5. [QR Codes](#qr-codes)
6. [Statistiques](#statistiques)
7. [Sécurité](#sécurité)

---

## Introduction

ShortLink permet de transformer de longues URLs en liens courts, facilement partageables et traçables.

**Application**: [https://shortlink.vercel.app](https://shortlink.vercel.app)

---

## Créer un lien court

### Étape 1: Accéder à la page d'accueil

Ouvrir l'application ShortLink

### Étape 2: Saisir l'URL

1. Dans le champ "URL originale", entrer une URL valide:
   ```
   https://www.example.com/page/very-long-url
   ```

2. **Optionnel** - Ajouter un titre pour mémoriser le lien:
   ```
   Mon article important
   ```

### Étape 3: Cliquer "Raccourcir"

Le lien court apparaît avec:
- Code court: `abc123` → `https://shortlink.app/abc123`
- Bouton "Copier"

### Exemple

| Élément | Contenu |
|---|---|
| URL originale | `https://www.verylongurlexample.com/article/2024/very-important-topic` |
| URL raccourcie | `https://shortlink.app/abc123` |
| Code court | `abc123` |

---

## Gérer les liens

### Voir la liste des liens

1. Cliquer sur "Mes liens"
2. La liste s'affiche avec:
   - Titre du lien
   - URL originale
   - Code court
   - Nombre de clics
   - Date de création

### Filtrer et rechercher

**Recherche par titre:**
```
Tapez "article" - affiche tous les liens contenant "article"
```

**Pagination:**
- Par défaut: 20 liens par page
- Utiliser "Suivant" / "Précédent"

### Modifier un lien

1. Cliquer sur le lien dans la liste
2. Modifier:
   - ✅ Titre
   - ✅ Tags
   - ✅ État (actif/inactif)
   - ✅ Date d'expiration
   - ❌ URL originale (non modifiable)

3. Cliquer "Enregistrer"

### Désactiver/Réactiver

1. Sélectionner le lien
2. Cliquer "Désactiver"
3. Le lien n'est plus accessible
4. Pour réactiver: cliquer "Activer"

### Supprimer un lien

1. Cliquer "Supprimer"
2. Confirmer la suppression
3. Le lien et ses statistiques sont perdus

⚠️ **Action irréversible**

---

## Utiliser les alias

### Créer un alias personnalisé

Au lieu de `abc123`, créer un lien memorable: `mon-projet`

**Règles:**
- Caractères alphanumériques et tirets
- 3-30 caractères
- Pas d'espaces
- Sensible à la casse

**Exemples valides:**
- ✅ `mon-lien`
- ✅ `cv-2024`
- ✅ `portfolio-github`
- ✅ `article-blog-01`

**Exemples invalides:**
- ❌ `mon lien` (espace)
- ❌ `mon_lien` (tiret bas)
- ❌ `mon!lien` (caractère spécial)

### Comment créer

1. Lors de la création, cocher "Alias personnalisé"
2. Saisir le texte désiré
3. Vérifier que l'alias est disponible
4. Cliquer "Raccourcir"

**Résultat**: `https://shortlink.app/mon-lien`

---

## QR Codes

### Générer un QR code

1. Cliquer sur le lien
2. Cliquer sur "Afficher QR Code"
3. Une fenêtre affiche le code scannable

### Tailles disponibles

| Taille | Pixels | Usage |
|---|---|---|
| Petit | 200×200 | Impression A4 |
| Moyen | 400×400 | Affichage écran |
| Grand | 600×600 | Poster/Bannière |

### Télécharger le QR code

1. Clic droit sur l'image
2. "Enregistrer l'image"
3. Format PNG

### Utiliser le QR code

- Poster en ligne (blog, email)
- Imprimer sur document
- Afficher en présentation
- Partager sur réseaux sociaux

---

## Statistiques

### Consulter les stats d'un lien

1. Cliquer sur le lien dans "Mes liens"
2. Onglet "Statistiques"
3. Voir:
   - **Total des clics** - Nombre total de redirections
   - **Clics par jour** - Évolution temporelle
   - **Par navigateur** - Chrome, Firefox, Safari, etc.
   - **Par pays** - Géolocalisation des visiteurs
   - **Par appareil** - Desktop, mobile, tablette
   - **Top referers** - Sites d'où provient le trafic

### Filtrer par période

```
Période: [Tous les temps ▼]
         [7 derniers jours]
         [30 derniers jours]
         [Tous les temps]
```

### Exporter les données

Cliquer "Exporter CSV" pour analyser dans Excel/Google Sheets

---

## Sécurité

### Avant de cliquer sur un lien ShortLink

La page de **preview** affiche:
1. ✅ L'URL cible
2. ✅ Un avertissement de sécurité
3. Options:
   - "Continuer" → Accéder au lien
   - "Annuler" → Retourner en arrière

**Pourquoi?** Prévenir les clics accidentels et les phishing

### Protection anti-phishing

ShortLink refuse les URLs:
- ❌ Contenant "PayPal verify"
- ❌ Contenant "Amazon account suspend"
- ❌ Pointant vers des domaines bloqués
- ❌ Utilisant des TLDs suspects (.tk, .ga, .ml)

### Conseils de sécurité

1. **Avant de partager** un lien ShortLink:
   - Vérifier l'URL originale
   - Éviter les URLs suspectes

2. **Avant de cliquer** sur un lien reçu:
   - Vérifier la source
   - Lire la preview
   - Hésiter si l'URL est étrange

3. **Partage sûr**:
   - Ajouter un titre explicite
   - Ajouter une description
   - Utiliser sur vos propres canaux

---

## Troubleshooting

| Problème | Solution |
|---|---|
| "URL invalide" | Vérifier http:// ou https:// |
| "Alias déjà pris" | Choisir un autre alias |
| "URL détectée comme phishing" | L'URL ne peut pas être raccourcie (sécurité) |
| Lien ne redirige pas | Vérifier que le lien est actif |
| Stats vides | Attendre que des clics se produisent |
| QR code ne se scanne pas | Vérifier la qualité de l'image |

---

## FAQ

**Q: Combien de liens je peux créer?**  
R: Illimité

**Q: Les liens expirent-ils automatiquement?**  
R: Non, sauf si une date d'expiration est définie

**Q: Je peux modifier l'URL originale?**  
R: Non, créer un nouveau lien et supprimer l'ancien

**Q: Comment connaître qui a cliqué?**  
R: Les stats montrent le pays, navigateur, etc., mais pas l'identité

**Q: Ma donnée est-elle sécurisée?**  
R: Oui, chiffrage HTTPS, pas de partage, conformité RGAA

---

## Support

Problème? → [Créer une issue GitHub](https://github.com/Aimeryy02/ShortLink/issues)
