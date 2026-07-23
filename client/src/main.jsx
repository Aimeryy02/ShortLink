import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

function App() {
  const [originalUrl, setOriginalUrl] = useState('');
  const [customAlias, setCustomAlias] = useState('');
  const [title, setTitle] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [result, setResult] = useState(null);
  const [links, setLinks] = useState([]);
  const [editingLink, setEditingLink] = useState(null);
  const [editForm, setEditForm] = useState({ title: '', originalUrl: '', tags: '', isActive: true, expiresAt: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copyLabel, setCopyLabel] = useState('Copier');

  const resultLinks = useMemo(() => {
    if (!result) return null;
    const code = getCodeFromShortUrl(result.shortUrl) || result.shortCode;
    return {
      code,
      qrUrl: `${API_BASE_URL}/api/qr/${encodeURIComponent(code)}`,
      previewUrl: `${getShortUrlOrigin(result.shortUrl)}/${encodeURIComponent(code)}+`,
      previewPath: `/${code}+`,
    };
  }, [result]);

  useEffect(() => {
    loadLinks();
  }, []);

  async function loadLinks() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/links`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || 'Impossible de charger les liens');
      setLinks(data.links || []);
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setResult(null);
    setCopyLabel('Copier');
    setIsLoading(true);

    try {
      const payload = { originalUrl: originalUrl.trim() };
      if (customAlias.trim()) payload.customAlias = customAlias.trim();
      if (title.trim()) payload.title = title.trim();
      if (expiresAt) {
        payload.expiresAt = new Date(expiresAt).toISOString();
      }

      const response = await fetch(`${API_BASE_URL}/api/shorten`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || 'Impossible de créer le lien court');

      setResult(data);
      setOriginalUrl('');
      setCustomAlias('');
      setTitle('');
      setExpiresAt('');
      await loadLinks();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsLoading(false);
    }
  }

  async function copyShortUrl() {
    if (!result?.shortUrl) return;
    await navigator.clipboard.writeText(result.shortUrl);
    setCopyLabel('Copié');
  }

  function startEdit(link) {
    setEditingLink(link);
    setEditForm({
      title: link.title || '',
      originalUrl: link.originalUrl || '',
      tags: Array.isArray(link.tags) ? link.tags.join(', ') : '',
      isActive: Boolean(link.isActive),
      expiresAt: formatDateTimeLocal(link.expiresAt),
    });
  }

  async function submitEdit(event) {
    event.preventDefault();
    if (!editingLink) return;

    try {
      const payload = {
        title: editForm.title.trim(),
        originalUrl: editForm.originalUrl.trim(),
        tags: editForm.tags
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean),
        isActive: editForm.isActive,
        expiresAt: editForm.expiresAt
          ? new Date(editForm.expiresAt).toISOString()
          : null,
      };

      const response = await fetch(`${API_BASE_URL}/api/links/${editingLink.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || 'Impossible de modifier le lien');

      setEditingLink(null);
      await loadLinks();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function toggleActive(link) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/links/${link.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !link.isActive }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || 'Impossible de modifier le statut');

      await loadLinks();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  function buildShortUrl(link) {
    const code = link.customAlias || link.shortCode;
    return `${getBackendOrigin()}/${code}`;
  }

  function getBackendOrigin() {
    return API_BASE_URL || 'http://localhost:3000';
  }

  return (
    <main className="page-shell">
      <section className="panel">
        <div className="heading">
          <p className="eyebrow">ShortLink</p>
          <h1>Créer un lien court</h1>
        </div>

        <form className="shorten-form" onSubmit={handleSubmit}>
          <label htmlFor="originalUrl">URL longue</label>
          <input id="originalUrl" type="url" placeholder="https://example.com/article/tres-long" value={originalUrl} onChange={(e) => setOriginalUrl(e.target.value)} required />

          <label htmlFor="title">Titre</label>
          <input id="title" type="text" placeholder="Campagne Google" value={title} onChange={(e) => setTitle(e.target.value)} />

          <label htmlFor="customAlias">Alias personnalisé</label>
          <input id="customAlias" type="text" placeholder="mon-lien" value={customAlias} onChange={(e) => setCustomAlias(e.target.value)} />

          <label htmlFor="expiresAt">Date d'expiration</label>
          <input
            id="expiresAt"
            type="datetime-local"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
          />

          <button type="submit" disabled={isLoading}>{isLoading ? 'Création...' : 'Créer le lien'}</button>
        </form>

        {error && <p className="message error">{error}</p>}

        {result && resultLinks && (
          <section className="result" aria-live="polite">
            <p className="result-label">Lien court</p>
            <a className="short-url" href={result.shortUrl} target="_blank" rel="noreferrer">{result.shortUrl}</a>

            <div className="actions">
              <button type="button" className="secondary-button" onClick={copyShortUrl}>{copyLabel}</button>
              <a className="secondary-link" href={resultLinks.previewUrl} target="_blank" rel="noreferrer">Prévisualiser {resultLinks.previewPath}</a>
            </div>

            <div className="qr-wrap">
              <img src={resultLinks.qrUrl} alt={`QR Code pour ${resultLinks.code}`} />
            </div>
          </section>
        )}
      </section>

      <section className="panel links-panel">
        <div className="heading row-heading">
          <div>
            <p className="eyebrow">Gestion</p>
            <h2>Liens créés</h2>
          </div>
          <button type="button" className="secondary-button" onClick={loadLinks}>Rafraîchir</button>
        </div>

        <div className="links-list">
          {links.map((link) => {
            const shortUrl = buildShortUrl(link);
            const code = link.customAlias || link.shortCode;

            return (
              <article className="link-card" key={link.id}>
                <div>
                  <h3>{link.title || 'Sans titre'}</h3>
                  <p className="muted">{link.originalUrl}</p>
                  <a href={shortUrl} target="_blank" rel="noreferrer">{shortUrl}</a>
                  <p className="meta">
                    {link.clicks} clic(s)
                    {' · '}
                    {link.isActive ? 'Actif' : 'Inactif'}
                    {' · '}
                    Expiration : {formatDisplayDate(link.expiresAt)}
                    {' · '}
                    {(link.tags || []).join(', ') || 'Aucun tag'}
                  </p>                </div>

                <div className="card-actions">
                  <a className="secondary-link" href={shortUrl} target="_blank" rel="noreferrer">Ouvrir</a>
                  <a className="secondary-link" href={`${shortUrl}+`} target="_blank" rel="noreferrer">Preview</a>
                  <a className="secondary-link" href={`${API_BASE_URL}/api/qr/${code}`} target="_blank" rel="noreferrer">QR</a>
                  <button type="button" className="secondary-button" onClick={() => startEdit(link)}>Modifier</button>
                  <button type="button" className="danger-button" onClick={() => toggleActive(link)}>
                    {link.isActive ? 'Désactiver' : 'Réactiver'}
                  </button>
                </div>
              </article>
            );
          })}
        </div>

        {editingLink && (
          <form className="edit-form" onSubmit={submitEdit}>
            <h3>Modifier le lien</h3>

            <label>Titre</label>
            <input value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} />

            <label>URL de destination</label>
            <input type="url" value={editForm.originalUrl} onChange={(e) => setEditForm({ ...editForm, originalUrl: e.target.value })} />

            <label>Tags séparés par des virgules</label>
            <input value={editForm.tags} onChange={(e) => setEditForm({ ...editForm, tags: e.target.value })} />

            <label>Date d'expiration</label>
            <input
              type="datetime-local"
              value={editForm.expiresAt}
              onChange={(e) =>
                setEditForm({
                  ...editForm,
                  expiresAt: e.target.value,
                })
              }
            />

            <label className="checkbox-line">
              <input type="checkbox" checked={editForm.isActive} onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })} />
              Lien actif
            </label>

            <div className="actions">
              <button type="submit" className="secondary-button">Enregistrer</button>
              <button type="button" className="secondary-link button-reset" onClick={() => setEditingLink(null)}>Annuler</button>
            </div>
          </form>
        )}
      </section>
    </main>
  );
}

function getCodeFromShortUrl(shortUrl) {
  try {
    const url = new URL(shortUrl);
    return url.pathname.replace('/', '');
  } catch {
    return '';
  }
}

function getShortUrlOrigin(shortUrl) {
  try {
    return new URL(shortUrl).origin;
  } catch {
    return 'http://localhost:3000';
  }
}
function formatDateTimeLocal(value) {
  if (!value) return '';

  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60 * 1000);

  return localDate.toISOString().slice(0, 16);
}

function formatDisplayDate(value) {
  if (!value) return 'Jamais';

  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
}

createRoot(document.getElementById('root')).render(<App />);