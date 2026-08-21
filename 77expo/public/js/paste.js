function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleString("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getIdFromPath() {
  const parts = window.location.pathname.split("/");
  return parts[parts.length - 1];
}

async function loadPost() {
  const container = document.getElementById("post-full");
  const id = getIdFromPath();

  try {
    const res = await fetch(`/api/pastes/${id}`);
    if (!res.ok) {
      container.innerHTML = `
        <a href="/" class="back-link">&larr; torna al feed</a>
        <p class="empty">post non trovato.</p>
      `;
      return;
    }
    const p = await res.json();
    const authors = (p.authors || []).map(escapeHtml).join(", ");

    container.innerHTML = `
      <a href="/" class="back-link">&larr; torna al feed</a>
      <h1>${escapeHtml(p.title)}</h1>
      <div class="meta"><span class="author">${authors}</span> · ${formatDate(p.createdAt)}</div>
      <pre>${escapeHtml(p.content)}</pre>
    `;
  } catch (err) {
    container.innerHTML = `
      <a href="/" class="back-link">&larr; torna al feed</a>
      <p class="empty">errore nel caricamento.</p>
    `;
  }
}

loadPost();
