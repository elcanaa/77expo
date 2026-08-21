require("dotenv").config();
const express = require("express");
const session = require("express-session");
const bcrypt = require("bcryptjs");
const path = require("path");
const store = require("./db/store");

const app = express();
const PORT = process.env.PORT || 3000;

if (!process.env.SESSION_SECRET) {
  console.error("Manca SESSION_SECRET nel file .env. Copia .env.example in .env.");
  process.exit(1);
}

// limite alzato per accettare l'immagine del logo come base64 nel body JSON
app.use(express.json({ limit: "6mb" }));
app.use(express.urlencoded({ extended: true, limit: "6mb" }));

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 2, // 2 ore
    },
  })
);

app.use(express.static(path.join(__dirname, "public")));

function requireAdmin(req, res, next) {
  if (req.session && req.session.isAdmin) return next();
  return res.status(401).json({ error: "Non autenticato." });
}

// ---------- KEEP-ALIVE ----------
// Rotta leggera per i servizi di ping esterni (es. UptimeRobot),
// usata per evitare lo spin-down del piano free su Render.
app.get("/healthz", (req, res) => {
  res.status(200).send("ok");
});

// ---------- PAGINE ----------

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "index.html"));
});

app.get("/paste/:id", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "paste.html"));
});

app.get("/official-member", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "members.html"));
});

app.get("/admin/login", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "login.html"));
});

app.get("/admin", (req, res) => {
  if (!req.session || !req.session.isAdmin) {
    return res.redirect("/admin/login");
  }
  res.sendFile(path.join(__dirname, "views", "admin.html"));
});

// ---------- API PUBBLICHE: PASTE ----------

app.get("/api/pastes", async (req, res) => {
  const data = await store.read();
  const pastes = [...data.pastes].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );
  res.json(pastes);
});

app.get("/api/pastes/:id", async (req, res) => {
  const id = Number(req.params.id);
  const data = await store.read();
  const paste = data.pastes.find((p) => p.id === id);
  if (!paste) return res.status(404).json({ error: "Post non trovato." });
  res.json(paste);
});

// Creazione nuovo paste (solo admin). authors: array di username già presenti in "official member".
app.post("/api/pastes", requireAdmin, async (req, res) => {
  const { title, content, authors } = req.body;

  if (!title || !content || !Array.isArray(authors) || authors.length === 0) {
    return res
      .status(400)
      .json({ error: "title, content e almeno un autore sono obbligatori." });
  }
  if (title.length > 120) {
    return res.status(400).json({ error: "title troppo lungo." });
  }
  if (content.length > 20000) {
    return res.status(400).json({ error: "content troppo lungo (max 20000 caratteri)." });
  }

  const data = await store.read();
  const validUsernames = new Set(data.members.map((m) => m.username));
  const cleanAuthors = [...new Set(authors.map((a) => String(a).trim()))].filter(Boolean);

  if (cleanAuthors.length === 0) {
    return res.status(400).json({ error: "Seleziona almeno un autore." });
  }
  const unknown = cleanAuthors.filter((a) => !validUsernames.has(a));
  if (unknown.length > 0) {
    return res.status(400).json({
      error: `Autori non presenti in Official Member: ${unknown.join(", ")}`,
    });
  }

  const paste = {
    id: store.nextId(data.pastes),
    title: title.trim(),
    content,
    authors: cleanAuthors,
    createdAt: new Date().toISOString(),
  };
  data.pastes.push(paste);
  await store.write(data);
  res.status(201).json(paste);
});

// ---------- API PUBBLICHE: OFFICIAL MEMBER ----------

app.get("/api/members", async (req, res) => {
  const data = await store.read();
  res.json(data.members);
});

// ---------- AUTH ADMIN ----------

app.post("/api/admin/login", async (req, res) => {
  const { password } = req.body;
  const data = await store.read();

  if (!data.admin.passwordHash) {
    return res.status(500).json({
      error: "Password admin non ancora impostata. Esegui: npm run seed",
    });
  }
  if (!password || !bcrypt.compareSync(password, data.admin.passwordHash)) {
    return res.status(401).json({ error: "Password errata." });
  }

  req.session.isAdmin = true;
  res.json({ ok: true });
});

app.post("/api/admin/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ ok: true });
  });
});

app.get("/api/admin/session", (req, res) => {
  res.json({ isAdmin: !!(req.session && req.session.isAdmin) });
});

// ---------- API PROTETTE (solo admin): PASTE ----------

app.delete("/api/admin/pastes/:id", requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const data = await store.read();
  const before = data.pastes.length;
  data.pastes = data.pastes.filter((p) => p.id !== id);
  if (data.pastes.length === before) {
    return res.status(404).json({ error: "Post non trovato." });
  }
  await store.write(data);
  res.json({ ok: true });
});

// ---------- API PROTETTE (solo admin): OFFICIAL MEMBER ----------

app.post("/api/admin/members", requireAdmin, async (req, res) => {
  const { username, photoDataUrl } = req.body;

  if (!username || !username.trim()) {
    return res.status(400).json({ error: "username obbligatorio." });
  }
  if (username.length > 40) {
    return res.status(400).json({ error: "username troppo lungo." });
  }
  if (photoDataUrl && !/^data:image\/(png|jpe?g|webp|gif);base64,/.test(photoDataUrl)) {
    return res.status(400).json({ error: "formato immagine non valido." });
  }

  const data = await store.read();
  const cleanUsername = username.trim();

  if (data.members.some((m) => m.username.toLowerCase() === cleanUsername.toLowerCase())) {
    return res.status(400).json({ error: "Username già presente." });
  }

  const member = {
    id: store.nextId(data.members),
    username: cleanUsername,
    photoDataUrl: photoDataUrl || null,
    createdAt: new Date().toISOString(),
  };
  data.members.push(member);
  await store.write(data);
  res.status(201).json(member);
});

app.delete("/api/admin/members/:id", requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const data = await store.read();
  const member = data.members.find((m) => m.id === id);
  if (!member) return res.status(404).json({ error: "Membro non trovato." });

  // rimuove il membro anche come autore dai post esistenti, senza cancellare i post
  data.members = data.members.filter((m) => m.id !== id);
  data.pastes = data.pastes.map((p) => ({
    ...p,
    authors: p.authors.filter((a) => a !== member.username),
  }));

  await store.write(data);
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`Server avviato su http://localhost:${PORT}`);
});
