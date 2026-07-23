const { shortenLinkSchema, listLinksQuerySchema, updateLinkSchema } = require('./linkValidation');

describe('linkValidation', () => {
  describe('shortenLinkSchema', () => {
    test('accepte URL valide', () => {
      const result = shortenLinkSchema.parse({ originalUrl: 'https://example.com' });
      expect(result.originalUrl).toBe('https://example.com');
    });

    test('conserve et nettoie le titre à la création', () => {
      const result = shortenLinkSchema.parse({
        originalUrl: 'https://example.com',
        title: '  Campagne Google  ',
      });

      expect(result.title).toBe('Campagne Google');
    });

    test('rejette un titre de plus de 120 caractères à la création', () => {
      expect(() =>
        shortenLinkSchema.parse({
          originalUrl: 'https://example.com',
          title: 'a'.repeat(121),
        }),
      ).toThrow();
    });

    test('rejette URL sans protocole', () => {
      expect(() => shortenLinkSchema.parse({ originalUrl: 'example.com' })).toThrow();
    });

    test('rejette protocole ftp', () => {
      expect(() => shortenLinkSchema.parse({ originalUrl: 'ftp://example.com' })).toThrow();
    });

    test('accepte alias valide', () => {
      const result = shortenLinkSchema.parse({ originalUrl: 'https://example.com', customAlias: 'my-link' });
      expect(result.customAlias).toBe('my-link');
    });

    test('rejette alias invalide', () => {
      expect(() => shortenLinkSchema.parse({ originalUrl: 'https://example.com', customAlias: 'my_link!' })).toThrow();
    });

    test('accepte date d\'expiration', () => {
      const futureDate = new Date(Date.now() + 86400000).toISOString();
      const result = shortenLinkSchema.parse({ originalUrl: 'https://example.com', expiresAt: futureDate });
      expect(result.expiresAt).toBeInstanceOf(Date);
    });
  });

  describe('listLinksQuerySchema', () => {
    test('définit les valeurs par défaut', () => {
      const result = listLinksQuerySchema.parse({});
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
      expect(result.sort).toBe('createdAt');
      expect(result.order).toBe('desc');
    });

    test('accepte un sort valide', () => {
      const result = listLinksQuerySchema.parse({ sort: 'clicks' });
      expect(result.sort).toBe('clicks');
    });

    test('rejette sort invalide', () => {
      expect(() => listLinksQuerySchema.parse({ sort: 'invalid' })).toThrow();
    });

    test('parse tags depuis string séparée par virgules', () => {
      const result = listLinksQuerySchema.parse({ tags: 'tag1,tag2' });
      expect(result.tags).toEqual(['tag1', 'tag2']);
    });
  });

  describe('updateLinkSchema', () => {
    test('accepte mise à jour du titre', () => {
      const result = updateLinkSchema.parse({ title: 'Nouveau titre' });
      expect(result.title).toBe('Nouveau titre');
    });

    test('accepte mise à jour isActive', () => {
      const result = updateLinkSchema.parse({ isActive: false });
      expect(result.isActive).toBe(false);
    });

    test('rejette objet vide', () => {
      expect(() => updateLinkSchema.parse({})).toThrow('At least one field must be provided');
    });

    test('rejette champs supplémentaires', () => {
      expect(() => updateLinkSchema.parse({ title: 'x', unknownField: 'y' })).toThrow();
    });
  });
});
