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

async function loadPastes() {
  const list = document.getElementById("paste-list");
  const countBadge = document.getElementById("feed-count");
  try {
    const res = await fetch("/api/pastes");
    const pastes = await res.json();

    if (countBadge) countBadge.textContent = `— ${pastes.length}`;

    if (pastes.length === 0) {
      list.innerHTML = '<p class="empty">archivio vuoto.</p>';
      return;
    }

    list.innerHTML = pastes
      .map((p, i) => {
        const authors = (p.authors || []).map(escapeHtml).join(", ");
        const hasCover = !!p.coverPhotoDataUrl;
        const cover = hasCover
          ? `<img class="feed-cover" src="${p.coverPhotoDataUrl}" alt="" />`
          : "";
        return `
        <a class="feed-item${hasCover ? " has-cover" : ""}" href="/paste/${p.id}">
          <div class="feed-item-inner">
            ${cover}
            <div class="idx">${String(pastes.length - i).padStart(2, "0")}</div>
            <h2 class="title">${escapeHtml(p.title)}</h2>
            <div class="meta"><span class="author">${authors}</span> · ${formatDate(p.createdAt)}</div>
          </div>
        </a>
      `;
      })
      .join("");
  } catch (err) {
    list.innerHTML = '<p class="empty">errore nel caricamento.</p>';
  }
}

loadPastes();