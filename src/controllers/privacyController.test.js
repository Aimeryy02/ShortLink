describe('privacyController.renderPrivacyPage', () => {
  afterEach(() => {
    jest.resetModules();
    delete process.env.CLICK_RETENTION_DAYS;
    delete process.env.PRIVACY_CONTACT;
  });

  function render() {
    const { renderPrivacyPage } = require('./privacyController');
    const res = { set: jest.fn(), type: jest.fn(), send: jest.fn() };

    renderPrivacyPage({}, res);

    return { res, html: res.send.mock.calls[0][0] };
  }

  test("sert une page HTML en français, en cache public d'une heure", () => {
    const { res, html } = render();

    expect(res.type).toHaveBeenCalledWith('html');
    expect(res.set).toHaveBeenCalledWith('Cache-Control', 'public, max-age=3600');
    expect(html).toContain('<html lang="fr">');
    expect(html).toContain('<h1>Données personnelles</h1>');
    expect(html).not.toContain('undefined');
  });

  test('annonce les engagements vérifiables dans le code', () => {
    const { html } = render();

    expect(html).toContain("aucune adresse IP n'est stockée");
    expect(html).toContain('aucun cookie ni traceur');
    expect(html).toContain('Nom de domaine uniquement');
    expect(html).toContain('article 6, paragraphe 1, point f');
  });

  test('affiche la durée de conservation réellement configurée', () => {
    expect(render().html).toContain('395 jours (environ 13 mois)');

    jest.resetModules();
    process.env.CLICK_RETENTION_DAYS = '30';
    expect(render().html).toContain('<strong>30 jours</strong>');
  });

  test('sans point de contact configuré, renvoie vers l’exploitant', () => {
    const { html } = render();

    expect(html).toContain("l'exploitant de cette instance");
    expect(html).not.toContain('mailto:');
  });

  test('avec un point de contact configuré, l’affiche échappé et cliquable', () => {
    process.env.PRIVACY_CONTACT = 'dpo@exemple.fr';
    expect(render().html).toContain('<a href="mailto:dpo@exemple.fr">dpo@exemple.fr</a>');

    jest.resetModules();
    process.env.PRIVACY_CONTACT = 'https://exemple.fr/contact?<x>';
    const { html } = render();
    expect(html).toContain('https://exemple.fr/contact?&lt;x&gt;');
    expect(html).not.toContain('<x>');
  });
});
