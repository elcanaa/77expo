function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function initials(username) {
  return username.trim().slice(0, 2).toUpperCase();
}

async function loadMembers() {
  const grid = document.getElementById("member-grid");
  try {
    const res = await fetch("/api/members");
    const members = await res.json();

    if (members.length === 0) {
      grid.innerHTML = '<p class="empty">nessun membro ancora.</p>';
      return;
    }

    grid.innerHTML = members
      .map((m) => {
        const avatar = m.photoDataUrl
          ? `<img class="member-avatar" src="${m.photoDataUrl}" alt="${escapeHtml(m.username)}" />`
          : `<div class="member-avatar">${initials(m.username)}</div>`;
        return `
          <div class="member-card">
            ${avatar}
            <div class="member-username">${escapeHtml(m.username)}</div>
          </div>
        `;
      })
      .join("");
  } catch (err) {
    grid.innerHTML = '<p class="empty">errore nel caricamento.</p>';
  }
}

loadMembers();
