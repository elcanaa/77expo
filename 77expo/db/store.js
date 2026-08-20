// Storage semplice su file JSON. Per un progetto scolastico è più che sufficiente
// e non richiede moduli nativi da compilare (a differenza di sqlite3/better-sqlite3).

const fs = require("fs");
const path = require("path");

const DATA_FILE = path.join(__dirname, "data.json");

function defaultData() {
  return {
    admin: {
      passwordHash: null, // impostato da db/init.js
    },
    pastes: [], // { id, title, content, author, createdAt }
    members: [], // { id, username, photoDataUrl, createdAt }
  };
}

function read() {
  if (!fs.existsSync(DATA_FILE)) {
    write(defaultData());
  }
  const raw = fs.readFileSync(DATA_FILE, "utf-8");
  return JSON.parse(raw);
}

function write(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
}

function nextId(pastes) {
  return pastes.reduce((max, p) => Math.max(max, p.id), 0) + 1;
}

module.exports = { read, write, nextId, DATA_FILE };
