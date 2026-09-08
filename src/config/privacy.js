// Paramètres de protection des données personnelles.
//
// Durée de conservation des clics, en jours. La valeur par défaut, 395 jours
// (13 mois), est la borne haute retenue par la CNIL pour les traceurs de mesure
// d'audience. La CNIL tolère jusqu'à 25 mois pour les données collectées : on
// retient la plus courte des deux, la finalité (statistiques par lien) n'exigeant
// pas davantage.
const DEFAULT_CLICK_RETENTION_DAYS = 395;

function parseRetentionDays(rawValue) {
  const parsed = Number.parseInt(rawValue, 10);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return DEFAULT_CLICK_RETENTION_DAYS;
  }

  return parsed;
}

const CLICK_RETENTION_DAYS = parseRetentionDays(process.env.CLICK_RETENTION_DAYS);

// Point de contact affiché sur la page d'information des personnes. Facultatif :
// sans valeur, la page renvoie vers l'exploitant de l'instance.
const PRIVACY_CONTACT = (process.env.PRIVACY_CONTACT || '').trim();

module.exports = {
  DEFAULT_CLICK_RETENTION_DAYS,
  CLICK_RETENTION_DAYS,
  PRIVACY_CONTACT,
  parseRetentionDays,
};
