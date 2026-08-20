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

function initials(username) {
  return username.trim().slice(0, 2).toUpperCase();
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

let currentMembers = [];

async function checkSession() {
  const res = await fetch("/api/admin/session");
  const data = await res.json();
  if (!data.isAdmin) {
    window.location.href = "/admin/login";
  }
}

/* ---------- membri ---------- */

async function loadMembers() {
  const res = await fetch("/api/members");
  currentMembers = await res.json();
  renderMemberList();
  renderAuthorPicker();
}

function renderMemberList() {
  const container = document.getElementById("member-list");
  if (currentMembers.length === 0) {
    container.innerHTML = '<p class="empty">nessun membro ancora.</p>';
    return;
  }
  container.innerHTML = currentMembers
    .map((m) => {
      const avatar = m.photoDataUrl
        ? `<img class="m-avatar" src="${m.photoDataUrl}" alt="" />`
        : `<div class="m-avatar">${initials(m.username)}</div>`;
      return `
        <div class="admin-member-row" data-id="${m.id}">
          ${avatar}
          <div class="m-username">${escapeHtml(m.username)}</div>
          <button class="btn danger" data-delete-member="${m.id}">rimuovi</button>
        </div>
      `;
    })
    .join("");

  container.querySelectorAll("[data-delete-member]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.getAttribute("data-delete-member");
      btn.disabled = true;
      const res = await fetch(`/api/admin/members/${id}`, { method: "DELETE" });
      if (res.ok) {
        await loadMembers();
        loadAdminPasteList();
      } else {
        btn.disabled = false;
        alert("errore durante la rimozione.");
      }
    });
  });
}

function renderAuthorPicker() {
  const picker = document.getElementById("author-picker");
  if (currentMembers.length === 0) {
    picker.innerHTML = '<span class="hint" style="margin:0">nessun membro disponibile: aggiungine uno sopra</span>';
    return;
  }
  picker.innerHTML = currentMembers
    .map((m) => {
      const avatar = m.photoDataUrl
        ? `<img class="mini-avatar" src="${m.photoDataUrl}" alt="" />`
        : `<span class="mini-avatar">${initials(m.username)}</span>`;
      return `
        <label class="author-pill">
          <input type="checkbox" value="${escapeHtml(m.username)}" />
          ${avatar}${escapeHtml(m.username)}
        </label>
      `;
    })
    .join("");

  picker.querySelectorAll(".author-pill").forEach((pill) => {
    const input = pill.querySelector("input");
    input.addEventListener("change", () => {
      pill.classList.toggle("checked", input.checked);
    });
  });
}

document.getElementById("member-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = e.target;
  const msg = document.getElementById("member-msg");
  msg.textContent = "";
  msg.className = "msg";

  const username = form.username.value.trim();
  const fileInput = document.getElementById("m-photo");
  let photoDataUrl = null;

  try {
    if (fileInput.files && fileInput.files[0]) {
      photoDataUrl = await fileToDataUrl(fileInput.files[0]);
    }

    const res = await fetch("/api/admin/members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, photoDataUrl }),
    });
    const data = await res.json();

    if (!res.ok) {
      msg.textContent = data.error || "errore sconosciuto.";
      msg.className = "msg error";
      return;
    }

    form.reset();
    msg.textContent = "membro aggiunto.";
    msg.className = "msg ok";
    await loadMembers();
  } catch (err) {
    msg.textContent = "errore di rete.";
    msg.className = "msg error";
  }
});

/* ---------- post ---------- */

async function loadAdminPasteList() {
  const container = document.getElementById("admin-list");
  const res = await fetch("/api/pastes");
  const pastes = await res.json();

  if (pastes.length === 0) {
    container.innerHTML = '<p class="empty">nessun post pubblicato.</p>';
    return;
  }

  container.innerHTML = pastes
    .map((p) => {
      const authors = (p.authors || []).map(escapeHtml).join(", ");
      return `
      <div class="admin-row" data-id="${p.id}">
        <div>
          <div class="a-title">${escapeHtml(p.title)}</div>
          <div class="a-author">${authors} · ${formatDate(p.createdAt)}</div>
        </div>
        <button class="btn danger" data-delete="${p.id}">elimina</button>
      </div>
    `;
    })
    .join("");

  container.querySelectorAll("[data-delete]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.getAttribute("data-delete");
      btn.disabled = true;
      const res = await fetch(`/api/admin/pastes/${id}`, { method: "DELETE" });
      if (res.ok) {
        loadAdminPasteList();
      } else {
        btn.disabled = false;
        alert("errore durante l'eliminazione.");
      }
    });
  });
}

document.getElementById("paste-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = e.target;
  const msg = document.getElementById("form-msg");
  msg.textContent = "";
  msg.className = "msg";

  const checked = document.querySelectorAll("#author-picker input[type=checkbox]:checked");
  const authors = Array.from(checked).map((el) => el.value);

  if (authors.length === 0) {
    msg.textContent = "seleziona almeno un autore tra i membri.";
    msg.className = "msg error";
    return;
  }

  const payload = {
    title: form.title.value.trim(),
    authors,
    content: form.content.value,
  };

  try {
    const res = await fetch("/api/pastes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();

    if (!res.ok) {
      msg.textContent = data.error || "errore sconosciuto.";
      msg.className = "msg error";
      return;
    }

    form.reset();
    document
      .querySelectorAll("#author-picker .author-pill")
      .forEach((p) => p.classList.remove("checked"));
    msg.textContent = "pubblicato.";
    msg.className = "msg ok";
    loadAdminPasteList();
  } catch (err) {
    msg.textContent = "errore di rete.";
    msg.className = "msg error";
  }
});

document.getElementById("logout-link").addEventListener("click", async (e) => {
  e.preventDefault();
  await fetch("/api/admin/logout", { method: "POST" });
  window.location.href = "/";
});

checkSession();
loadMembers();
loadAdminPasteList();
