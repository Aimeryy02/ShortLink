const { CLICK_RETENTION_DAYS, PRIVACY_CONTACT } = require('../config/privacy');

const LAST_UPDATE = '8 septembre 2026';

// Information des personnes (RGPD, article 13). La page est servie par l'API,
// c'est-à-dire par le domaine sur lequel les clics sont collectés : la personne
// redirigée peut la consulter depuis la page de prévisualisation d'un lien.
function renderPrivacyPage(req, res) {
  res.set('Cache-Control', 'public, max-age=3600');
  res.type('html');
  res.send(buildPrivacyPage());
}

function formatRetention(days) {
  const months = Math.round(days / 30.44);
  return months >= 2 ? `${days} jours (environ ${months} mois)` : `${days} jours`;
}

function buildContactSection() {
  if (!PRIVACY_CONTACT) {
    return `<p>Pour toute question ou demande relative à vos données, adressez-vous à
      l'exploitant de cette instance de ShortLink.</p>`;
  }

  const safeContact = escapeHtml(PRIVACY_CONTACT);
  const isEmail = PRIVACY_CONTACT.includes('@');
  const href = isEmail ? `mailto:${safeContact}` : safeContact;

  return `<p>Pour toute question ou demande relative à vos données :
      <a href="${href}">${safeContact}</a>.</p>`;
}

function buildPrivacyPage() {
  const retention = formatRetention(CLICK_RETENTION_DAYS);

  return `<!doctype html>
<html lang="fr">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Données personnelles — ShortLink</title>
    <style>
      :root {
        color-scheme: light;
        font-family: Arial, Helvetica, sans-serif;
        color: #1f2937;
        background: #f3f4f6;
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        padding: 24px;
        background: #f3f4f6;
        line-height: 1.55;
      }

      main {
        width: min(100%, 760px);
        margin: 0 auto;
        padding: 32px;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        background: #ffffff;
      }

      h1 {
        margin: 0 0 8px;
        font-size: clamp(1.6rem, 4vw, 2.1rem);
        line-height: 1.2;
      }

      h2 {
        margin: 28px 0 10px;
        font-size: 1.2rem;
      }

      p, li {
        margin: 0 0 10px;
      }

      .meta {
        color: #4b5563;
        font-size: 0.95rem;
      }

      table {
        width: 100%;
        border-collapse: collapse;
        margin: 8px 0 12px;
      }

      caption {
        text-align: left;
        font-weight: 700;
        padding: 0 0 8px;
      }

      th, td {
        text-align: left;
        vertical-align: top;
        padding: 8px 10px;
        border: 1px solid #d1d5db;
      }

      th {
        background: #f9fafb;
      }

      a {
        color: #15803d;
      }

      a:focus-visible {
        outline: 3px solid #15803d;
        outline-offset: 2px;
      }

      @media (max-width: 480px) {
        body {
          padding: 12px;
        }

        main {
          padding: 20px;
        }
      }
    </style>
  </head>
  <body>
    <main>
      <h1>Données personnelles</h1>
      <p class="meta">Information des personnes prévue par l'article 13 du RGPD.
        Dernière mise à jour : ${LAST_UPDATE}.</p>

      <h2>Ce que fait ShortLink</h2>
      <p>ShortLink raccourcit des adresses web. Lorsque vous ouvrez un lien court,
        vous êtes redirigé vers l'adresse d'origine et ce clic est comptabilisé pour
        fournir des statistiques d'audience au créateur du lien.</p>

      <h2>Ce qui est enregistré lors d'un clic</h2>
      <table>
        <caption>Données conservées pour chaque clic</caption>
        <thead>
          <tr>
            <th scope="col">Donnée</th>
            <th scope="col">Précision</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>Date et heure du clic</td><td>—</td></tr>
          <tr><td>Pays</td><td>Déduit de l'adresse IP au moment du clic ; l'adresse IP
            elle-même n'est pas conservée.</td></tr>
          <tr><td>Navigateur, système et type d'appareil</td><td>Familles génériques
            (par exemple « Chrome », « Android », « mobile »), sans numéro de version
            complet.</td></tr>
          <tr><td>Langue du navigateur</td><td>Code de langue principal.</td></tr>
          <tr><td>Site de provenance</td><td>Nom de domaine uniquement, jamais
            l'adresse complète de la page.</td></tr>
        </tbody>
      </table>

      <h2>Ce qui n'est pas collecté</h2>
      <ul>
        <li>aucune adresse IP n'est stockée, ni en clair ni sous forme hachée ;</li>
        <li>aucun cookie ni traceur n'est déposé sur votre appareil ;</li>
        <li>aucun compte, nom, adresse électronique ou identifiant de visiteur ;</li>
        <li>aucun croisement entre vos clics : les données servent à des totaux
          par lien, pas à suivre une personne.</li>
      </ul>

      <h2>Finalité et base légale</h2>
      <p>Les données servent exclusivement à produire des statistiques agrégées par
        lien (nombre de clics, répartition par pays, par navigateur, par provenance)
        et à protéger le service contre les abus. Ce traitement repose sur l'intérêt
        légitime de l'exploitant (article 6, paragraphe 1, point f du RGPD). Sans
        adresse IP ni traceur, il n'est pas soumis au consentement préalable.</p>

      <h2>Durée de conservation</h2>
      <p>Chaque clic est supprimé automatiquement par la base de données au bout
        de <strong>${retention}</strong>. Aucune donnée de clic n'est conservée
        au-delà.</p>

      <h2>Hébergement et destinataires</h2>
      <p>Les données sont traitées par l'application, hébergée chez Render, et
        stockées dans une base MongoDB Atlas. Elles ne sont ni vendues, ni
        transmises à des tiers à des fins publicitaires. Seul le créateur du lien
        accède aux statistiques agrégées de ses liens.</p>

      <h2>Vos droits</h2>
      <p>Vous disposez des droits d'accès, de rectification, d'effacement,
        d'opposition et de limitation prévus par le RGPD. Les données conservées ne
        permettant pas de vous identifier, aucun clic ne peut être rattaché à une
        personne : les demandes d'accès ou d'effacement ne peuvent donc pas porter
        sur un clic précis. Vous pouvez introduire une réclamation auprès de la
        <a href="https://www.cnil.fr" rel="noopener noreferrer">CNIL</a>.</p>

      <h2>Contact</h2>
      ${buildContactSection()}
    </main>
  </body>
</html>`;
}

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

module.exports = {
  renderPrivacyPage,
  buildPrivacyPage,
};
