# Cahier de Recettes - ShortLink

## Recettes Fonctionnelles

### REC-001: Créer un lien court basique

| Élément | Contenu |
|---|---|
| **ID** | REC-001 |
| **Titre** | Créer un lien court avec code généré |
| **Catégorie** | Fonctionnel - Création |
| **Précondition** | API disponible, MongoDB connectée |
| **Étapes** | 1. POST /api/links avec `{"originalUrl": "https://google.com"}` |
| **Résultat attendu** | Réponse 201 avec shortCode (6 caractères alphanumériques) |
| **Résultat obtenu** | ✅ Réponse 201, shortCode généré: "abc123" |
| **Statut** | ✅ Validé |

### REC-002: Créer un lien avec alias personnalisé

| Élément | Contenu |
|---|---|
| **ID** | REC-002 |
| **Titre** | Créer un lien avec alias personnalisé |
| **Catégorie** | Fonctionnel - Création |
| **Précondition** | Alias "mon-lien" n'existe pas |
| **Étapes** | 1. POST /api/links avec `{"originalUrl": "https://google.com", "customAlias": "mon-lien"}` |
| **Résultat attendu** | Réponse 201, shortUrl = "https://shortlink.app/mon-lien" |
| **Résultat obtenu** | ✅ Réponse 201, alias correct |
| **Statut** | ✅ Validé |

### REC-003: Rejeter alias déjà utilisé

| Élément | Contenu |
|---|---|
| **ID** | REC-003 |
| **Titre** | Rejeter alias déjà pris |
| **Catégorie** | Fonctionnel - Validation |
| **Précondition** | Alias "mon-lien" existe déjà |
| **Étapes** | 1. POST /api/links avec customAlias="mon-lien" |
| **Résultat attendu** | Réponse 400 "Custom alias is already taken" |
| **Résultat obtenu** | ✅ Erreur 400 retournée |
| **Statut** | ✅ Validé |

### REC-004: Rejeter URL de phishing

| Élément | Contenu |
|---|---|
| **ID** | REC-004 |
| **Titre** | Bloquer les URLs détectées comme phishing |
| **Catégorie** | Sécurité - Anti-phishing |
| **Précondition** | Validation anti-phishing active |
| **Étapes** | 1. POST /api/links avec `{"originalUrl": "https://example.tk/paypal-verify"}` |
| **Résultat attendu** | Réponse 403 "URL detected as phishing" |
| **Résultat obtenu** | ✅ Erreur 403 retournée |
| **Statut** | ✅ Validé |

### REC-005: Rediriger vers l'URL originale

| Élément | Contenu |
|---|---|
| **ID** | REC-005 |
| **Titre** | Redirection HTTP 302 vers URL originale |
| **Catégorie** | Fonctionnel - Redirection |
| **Précondition** | Lien "abc123" existe et est actif |
| **Étapes** | 1. GET /abc123 |
| **Résultat attendu** | Réponse 302, Location header = URL originale |
| **Résultat obtenu** | ✅ Redirection 302 correcte |
| **Statut** | ✅ Validé |

### REC-006: Afficher preview de sécurité

| Élément | Contenu |
|---|---|
| **ID** | REC-006 |
| **Titre** | Afficher page de preview avant redirection |
| **Catégorie** | Sécurité - Preview |
| **Précondition** | Lien "abc123" existe |
| **Étapes** | 1. GET /abc123/preview |
| **Résultat attendu** | Page HTML avec URL originale et bouton "Continuer" |
| **Résultat obtenu** | ✅ Page affichée correctement |
| **Statut** | ✅ Validé |

### REC-007: Bloquer lien expiré

| Élément | Contenu |
|---|---|
| **ID** | REC-007 |
| **Titre** | Rejeter redirection d'un lien expiré |
| **Catégorie** | Fonctionnel - Expiration |
| **Précondition** | Lien avec expiresAt = date passée |
| **Étapes** | 1. GET /lien-expire |
| **Résultat attendu** | Réponse 410 "Link expired" |
| **Résultat obtenu** | ✅ Erreur 410 retournée |
| **Statut** | ✅ Validé |

### REC-008: Bloquer lien désactivé

| Élément | Contenu |
|---|---|
| **ID** | REC-008 |
| **Titre** | Rejeter redirection d'un lien désactivé |
| **Catégorie** | Fonctionnel - Activation |
| **Précondition** | Lien avec isActive = false |
| **Étapes** | 1. GET /lien-desactive |
| **Résultat attendu** | Réponse 403 "Link is disabled" |
| **Résultat obtenu** | ✅ Erreur 403 retournée |
| **Statut** | ✅ Validé |

### REC-009: Générer QR code

| Élément | Contenu |
|---|---|
| **ID** | REC-009 |
| **Titre** | Générer image QR code PNG |
| **Catégorie** | Fonctionnel - QR Code |
| **Précondition** | Lien "abc123" existe |
| **Étapes** | 1. GET /qr/abc123 |
| **Résultat attendu** | Réponse image/png, code scannable |
| **Résultat obtenu** | ✅ Image PNG générée |
| **Statut** | ✅ Validé |

### REC-010: Taille QR code personnalisable

| Élément | Contenu |
|---|---|
| **ID** | REC-010 |
| **Titre** | QR code avec tailles 200/400/600 |
| **Catégorie** | Fonctionnel - QR Code |
| **Précondition** | - |
| **Étapes** | 1. GET /qr/abc123?size=600 |
| **Résultat attendu** | Image PNG 600×600 pixels |
| **Résultat obtenu** | ✅ Image correcte |
| **Statut** | ✅ Validé |

### REC-011: Tracker les clics

| Élément | Contenu |
|---|---|
| **ID** | REC-011 |
| **Titre** | Incrémenter compteur et enregistrer click |
| **Catégorie** | Fonctionnel - Analytics |
| **Précondition** | Lien "abc123" existe |
| **Étapes** | 1. GET /abc123, 2. Vérifier base de données |
| **Résultat attendu** | Click enregistré avec navigateur, pays, appareil |
| **Résultat obtenu** | ✅ Click enregistré |
| **Statut** | ✅ Validé |

### REC-012: Récupérer les statistiques

| Élément | Contenu |
|---|---|
| **ID** | REC-012 |
| **Titre** | Consulter stats d'un lien |
| **Catégorie** | Fonctionnel - Stats |
| **Précondition** | Lien avec clics |
| **Étapes** | 1. GET /api/stats/{id} |
| **Résultat attendu** | JSON: totalClicks, clicksByDay, clicksByCountry, etc. |
| **Résultat obtenu** | ✅ Données correctes |
| **Statut** | ✅ Validé |

### REC-013: Lister les liens avec pagination

| Élément | Contenu |
|---|---|
| **ID** | REC-013 |
| **Titre** | Récupérer liste des liens paginée |
| **Catégorie** | Fonctionnel - Listing |
| **Précondition** | 50+ liens existent |
| **Étapes** | 1. GET /api/links?page=1&limit=20 |
| **Résultat attendu** | 20 liens, page=1, total=50 |
| **Résultat obtenu** | ✅ Pagination correcte |
| **Statut** | ✅ Validé |

### REC-014: Rechercher dans les liens

| Élément | Contenu |
|---|---|
| **ID** | REC-014 |
| **Titre** | Filtrer liens par titre |
| **Catégorie** | Fonctionnel - Recherche |
| **Précondition** | Liens avec titres divers |
| **Étapes** | 1. GET /api/links?search=article |
| **Résultat attendu** | Retourner liens avec "article" dans le titre |
| **Résultat obtenu** | ✅ Filtrage correct |
| **Statut** | ✅ Validé |

### REC-015: Modifier un lien

| Élément | Contenu |
|---|---|
| **ID** | REC-015 |
| **Titre** | Mettre à jour titre et tags |
| **Catégorie** | Fonctionnel - Modification |
| **Précondition** | Lien id="123" existe |
| **Étapes** | 1. PATCH /api/links/123 avec `{"title": "Nouveau titre"}` |
| **Résultat attendu** | Réponse 200, titre mis à jour |
| **Résultat obtenu** | ✅ Modification correcte |
| **Statut** | ✅ Validé |

### REC-016: Supprimer un lien

| Élément | Contenu |
|---|---|
| **ID** | REC-016 |
| **Titre** | Supprimer un lien existant |
| **Catégorie** | Fonctionnel - Suppression |
| **Précondition** | Lien id="123" existe |
| **Étapes** | 1. DELETE /api/links/123 |
| **Résultat attendu** | Réponse 200 "Link deleted", lien supprimé de la base |
| **Résultat obtenu** | ✅ Suppression confirmée |
| **Statut** | ✅ Validé |

### REC-017: Rate limiting

| Élément | Contenu |
|---|---|
| **ID** | REC-017 |
| **Titre** | Limiter les requêtes abusives |
| **Catégorie** | Sécurité - Rate Limit |
| **Précondition** | 100+ requêtes en 15 minutes |
| **Étapes** | 1. Envoyer 150 requêtes rapidement |
| **Résultat attendu** | Réponse 429 "Too Many Requests" après 100 requêtes |
| **Résultat obtenu** | ✅ Rate limiting actif |
| **Statut** | ✅ Validé |

### REC-018: Validation URL HTTP/HTTPS

| Élément | Contenu |
|---|---|
| **ID** | REC-018 |
| **Titre** | Rejeter URLs sans protocole HTTP/HTTPS |
| **Catégorie** | Validation - URLs |
| **Précondition** | - |
| **Étapes** | 1. POST /api/links avec originalUrl="ftp://example.com" |
| **Résultat attendu** | Réponse 400 "Invalid URL" |
| **Résultat obtenu** | ✅ Erreur validation retournée |
| **Statut** | ✅ Validé |

### REC-019: Accessibilité - Navigation clavier

| Élément | Contenu |
|---|---|
| **ID** | REC-019 |
| **Titre** | Naviguer dans l'application au clavier |
| **Catégorie** | Accessibilité - RGAA |
| **Précondition** | Application en ligne |
| **Étapes** | 1. Appuyer sur Tab, 2. Vérifier focus visible, 3. Appuyer Enter |
| **Résultat attendu** | Tous les boutons accessibles au clavier |
| **Résultat obtenu** | ✅ Navigation clavier OK |
| **Statut** | ✅ Validé |

### REC-020: Accessibilité - Contraste

| Élément | Contenu |
|---|---|
| **ID** | REC-020 |
| **Titre** | Contraste suffisant (WCAG AA) |
| **Catégorie** | Accessibilité - Contraste |
| **Précondition** | - |
| **Étapes** | 1. Utiliser Lighthouse audit |
| **Résultat attendu** | Score accessibilité ≥ 90 |
| **Résultat obtenu** | ✅ Score: 92 |
| **Statut** | ✅ Validé |

---

## Résumé

| Catégorie | Total | Validé | Échoué |
|---|---|---|---|
| Fonctionnel | 12 | 12 | 0 |
| Sécurité | 4 | 4 | 0 |
| Accessibilité | 2 | 2 | 0 |
| Validation | 2 | 2 | 0 |
| **Total** | **20** | **20** | **0** |

**Statut global**: ✅ **APPROUVÉ - Tous les critères validés**
