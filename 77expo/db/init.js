// Esegui con: npm run seed
// Crea db/data.json (se non esiste) e imposta/aggiorna l'hash della password admin
// leggendo ADMIN_INITIAL_PASSWORD da .env. La password in chiaro non viene mai salvata.

require("dotenv").config();
const bcrypt = require("bcryptjs");
const store = require("./store");

const initialPassword = process.env.ADMIN_INITIAL_PASSWORD;

if (!initialPassword) {
  console.error(
    "Manca ADMIN_INITIAL_PASSWORD nel file .env. Copia .env.example in .env e impostala."
  );
  process.exit(1);
}

const data = store.read();
const hash = bcrypt.hashSync(initialPassword, 10);
data.admin.passwordHash = hash;

// Un membro demo, se non ce ne sono ancora
if (data.members.length === 0) {
  data.members = [
    {
      id: 1,
      username: "admin",
      photoDataUrl: null,
      createdAt: new Date().toISOString(),
    },
  ];
}

// Un po' di contenuti demo, se il file è vuoto
if (data.pastes.length === 0) {
  data.pastes = [
    {
      id: 1,
      title: "hello-world.py",
      content: "print('archivio 77 exposed inizializzato')",
      authors: ["admin"],
      createdAt: new Date().toISOString(),
    },
    {
      id: 2,
      title: "quicksort.js",
      content:
        "function quicksort(arr) {\n  if (arr.length <= 1) return arr;\n  const [pivot, ...rest] = arr;\n  const left = rest.filter(x => x < pivot);\n  const right = rest.filter(x => x >= pivot);\n  return [...quicksort(left), pivot, ...quicksort(right)];\n}",
      authors: ["admin"],
      createdAt: new Date().toISOString(),
    },
    {
      id: 3,
      title: "note.txt",
      content: "Contenuto di esempio dell'archivio.",
      authors: ["admin"],
      createdAt: new Date().toISOString(),
    },
  ];
}

store.write(data);
console.log("Database inizializzato in db/data.json");
console.log("Password admin impostata correttamente (hash salvato, non in chiaro).");
