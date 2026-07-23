const { generateShortCode } = require('./shortCodeService');

describe('shortCodeService.generateShortCode', () => {
  test('génère un code de longueur par défaut', () => {
    const code = generateShortCode();
    expect(typeof code).toBe('string');
    expect(code.length).toBeGreaterThanOrEqual(4);
  });

  test('respecte la longueur demandée', () => {
    const code = generateShortCode(8);
    expect(code.length).toBe(8);
  });

  test('contient uniquement des caractères valides', () => {
    const code = generateShortCode(10);
    expect(code).toMatch(/^[0-9a-zA-Z]+$/);
  });
});
