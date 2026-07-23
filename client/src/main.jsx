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
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingLink, setEditingLink] = useState(null);
  const [linkNotice, setLinkNotice] = useState(null);
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

    function refreshLinksOnFocus() {
      loadLinks();
    }

    window.addEventListener('focus', refreshLinksOnFocus);

    return () => {
      window.removeEventListener('focus', refreshLinksOnFocus);
    };
  }, []);

  useEffect(() => {
    const isModalOpen = isCreateOpen || Boolean(editingLink) || Boolean(linkNotice);

    if (!isModalOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    function handleKeyDown(event) {
      if (event.key !== 'Escape') return;
      setIsCreateOpen(false);
      setEditingLink(null);
      setLinkNotice(null);
      setError('');
    }

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isCreateOpen, editingLink, linkNotice]);

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

  function openCreateModal() {
    setResult(null);
    setError('');
    setCopyLabel('Copier');
    setIsCreateOpen(true);
  }

  function closeCreateModal() {
    setIsCreateOpen(false);
    setError('');
  }

  function startEdit(link) {
    setError('');
    setEditingLink(link);
    setEditForm({
      title: link.title || '',
      originalUrl: link.originalUrl || '',
      tags: Array.isArray(link.tags) ? link.tags.join(', ') : '',
      isActive: Boolean(link.isActive),
      expiresAt: formatDateTimeLocal(link.expiresAt),
    });
  }

  function closeEditModal() {
    setEditingLink(null);
    setError('');
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

  function openLink(link) {
    if (!link.isActive) {
      setLinkNotice({
        title: 'Lien désactivé',
        message: 'Ce lien a été désactivé et ne peut pas être ouvert.',
      });
      return;
    }

    if (link.expiresAt && new Date(link.expiresAt).getTime() <= Date.now()) {
      setLinkNotice({
        title: 'Lien expiré',
        message: `Ce lien a expiré le ${formatDisplayDate(link.expiresAt)}.`,
      });
      return;
    }

    window.open(buildShortUrl(link), '_blank', 'noopener,noreferrer');
  }

  return (
    <main className="page-shell">
      <section className="panel links-panel">
        <div className="heading row-heading">
          <div>
            <p className="eyebrow">Gestion</p>
            <h1>Liens créés</h1>
          </div>
          <div className="header-actions">
            <button type="button" className="secondary-button" onClick={loadLinks}>Rafraîchir</button>
            <button type="button" className="primary-button" onClick={openCreateModal}>Créer un lien</button>
          </div>
        </div>

        {error && !isCreateOpen && !editingLink && (
          <p className="message error" role="alert">{error}</p>
        )}

        <div className="links-list">
          {links.length === 0 && (
            <p className="empty-state">Aucun lien créé pour le moment.</p>
          )}

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
                  </p>
                </div>

                <div className="card-actions">
                  <button type="button" className="secondary-link button-reset" onClick={() => openLink(link)}>Ouvrir</button>
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
      </section>

      {isCreateOpen && (
        <Modal title="Créer un lien court" titleId="create-modal-title" onClose={closeCreateModal}>
          <form className="shorten-form" onSubmit={handleSubmit}>
            <label htmlFor="originalUrl">URL longue</label>
            <input
              id="originalUrl"
              type="url"
              placeholder="https://example.com/article/tres-long"
              value={originalUrl}
              onChange={(event) => setOriginalUrl(event.target.value)}
              autoFocus
              required
            />

            <label htmlFor="title">Titre</label>
            <input
              id="title"
              type="text"
              placeholder="Campagne Google"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />

            <label htmlFor="customAlias">Alias personnalisé</label>
            <input
              id="customAlias"
              type="text"
              placeholder="mon-lien"
              value={customAlias}
              onChange={(event) => setCustomAlias(event.target.value)}
            />

            <label htmlFor="expiresAt">Date d'expiration</label>
            <input
              id="expiresAt"
              type="datetime-local"
              value={expiresAt}
              onChange={(event) => setExpiresAt(event.target.value)}
            />

            <button type="submit" disabled={isLoading}>
              {isLoading ? 'Création...' : 'Créer le lien'}
            </button>
          </form>

          {error && <p className="message error" role="alert">{error}</p>}

          {result && resultLinks && (
            <section className="result" aria-live="polite">
              <p className="result-label">Lien court</p>
              <a className="short-url" href={result.shortUrl} target="_blank" rel="noreferrer">{result.shortUrl}</a>

              <div className="actions">
                <button type="button" className="secondary-button" onClick={copyShortUrl}>{copyLabel}</button>
                <a className="secondary-link" href={resultLinks.previewUrl} target="_blank" rel="noreferrer">
                  Prévisualiser {resultLinks.previewPath}
                </a>
              </div>

              <div className="qr-wrap">
                <img src={resultLinks.qrUrl} alt={`QR Code pour ${resultLinks.code}`} />
              </div>
            </section>
          )}
        </Modal>
      )}

      {editingLink && (
        <Modal title="Modifier le lien" titleId="edit-modal-title" onClose={closeEditModal}>
          <form className="edit-form" onSubmit={submitEdit}>
            <label htmlFor="edit-title">Titre</label>
            <input
              id="edit-title"
              value={editForm.title}
              onChange={(event) => setEditForm({ ...editForm, title: event.target.value })}
              autoFocus
            />

            <label htmlFor="edit-original-url">URL de destination</label>
            <input
              id="edit-original-url"
              type="url"
              value={editForm.originalUrl}
              onChange={(event) => setEditForm({ ...editForm, originalUrl: event.target.value })}
              required
            />

            <label htmlFor="edit-tags">Tags séparés par des virgules</label>
            <input
              id="edit-tags"
              value={editForm.tags}
              onChange={(event) => setEditForm({ ...editForm, tags: event.target.value })}
            />

            <label htmlFor="edit-expires-at">Date d'expiration</label>
            <input
              id="edit-expires-at"
              type="datetime-local"
              value={editForm.expiresAt}
              onChange={(event) => setEditForm({ ...editForm, expiresAt: event.target.value })}
            />

            <label className="checkbox-line">
              <input
                type="checkbox"
                checked={editForm.isActive}
                onChange={(event) => setEditForm({ ...editForm, isActive: event.target.checked })}
              />
              Lien actif
            </label>

            <div className="actions">
              <button type="submit" className="secondary-button">Enregistrer</button>
              <button type="button" className="secondary-link button-reset" onClick={closeEditModal}>Annuler</button>
            </div>
          </form>

          {error && <p className="message error" role="alert">{error}</p>}
        </Modal>
      )}

      {linkNotice && (
        <Modal
          title={linkNotice.title}
          titleId="link-notice-modal-title"
          onClose={() => setLinkNotice(null)}
        >
          <div className="link-notice" role="alert">
            <span className="link-notice-icon" aria-hidden="true">!</span>
            <p>{linkNotice.message}</p>
          </div>
          <div className="actions notice-actions">
            <button type="button" className="secondary-button" onClick={() => setLinkNotice(null)}>
              Fermer
            </button>
          </div>
        </Modal>
      )}
    </main>
  );
}

function Modal({ title, titleId, onClose, children }) {
  function handleBackdropClick(event) {
    if (event.target === event.currentTarget) {
      onClose();
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={handleBackdropClick}>
      <section
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className="modal-header">
          <div>
            <p className="eyebrow">ShortLink</p>
            <h2 id={titleId}>{title}</h2>
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Fermer la fenêtre">
            ×
          </button>
        </div>
        {children}
      </section>
    </div>
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
