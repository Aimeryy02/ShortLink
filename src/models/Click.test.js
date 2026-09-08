const Click = require('./Click');
const { CLICK_RETENTION_DAYS } = require('../config/privacy');

describe('modèle Click — minimisation et conservation', () => {
  test("ne définit ni champ d'adresse IP ni referer complet", () => {
    expect(Click.schema.path('ip')).toBeUndefined();
    expect(Click.schema.path('referer')).toBeUndefined();
    expect(Click.schema.path('refererDomain')).toBeDefined();
    expect(Click.schema.path('country')).toBeDefined();
  });

  test('déclare un index TTL sur clickedAt égal à la durée de conservation', () => {
    const ttlIndex = Click.schema
      .indexes()
      .find(([keys, options]) => keys.clickedAt === 1 && options.expireAfterSeconds);

    expect(ttlIndex).toBeDefined();
    expect(ttlIndex[1].expireAfterSeconds).toBe(CLICK_RETENTION_DAYS * 24 * 60 * 60);
    expect(ttlIndex[1].expireAfterSeconds).toBe(395 * 86400);
  });

  test('laisse la création des index au démarrage explicite du serveur', () => {
    // autoIndex désactivé : l'index TTL remplace un index simple existant sur
    // clickedAt, ce que seule une synchronisation explicite peut faire sans conflit.
    expect(Click.schema.options.autoIndex).toBe(false);
  });
});
