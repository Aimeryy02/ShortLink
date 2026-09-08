const { parseRetentionDays, DEFAULT_CLICK_RETENTION_DAYS } = require('./privacy');

describe('config/privacy.parseRetentionDays', () => {
  test('retient 395 jours (13 mois) par défaut', () => {
    expect(DEFAULT_CLICK_RETENTION_DAYS).toBe(395);
    expect(parseRetentionDays(undefined)).toBe(395);
    expect(parseRetentionDays('')).toBe(395);
  });

  test('accepte une durée entière positive fournie par la configuration', () => {
    expect(parseRetentionDays('30')).toBe(30);
    expect(parseRetentionDays('760')).toBe(760);
  });

  test('retombe sur la valeur par défaut si la configuration est invalide', () => {
    expect(parseRetentionDays('0')).toBe(395);
    expect(parseRetentionDays('-12')).toBe(395);
    expect(parseRetentionDays('treize mois')).toBe(395);
  });

  test('lit la variable CLICK_RETENTION_DAYS au chargement', () => {
    jest.resetModules();
    process.env.CLICK_RETENTION_DAYS = '400';
    process.env.PRIVACY_CONTACT = '  dpo@exemple.fr ';

    const config = require('./privacy');

    expect(config.CLICK_RETENTION_DAYS).toBe(400);
    expect(config.PRIVACY_CONTACT).toBe('dpo@exemple.fr');

    delete process.env.CLICK_RETENTION_DAYS;
    delete process.env.PRIVACY_CONTACT;
  });
});
