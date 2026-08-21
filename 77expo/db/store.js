// Storage persistente su MongoDB Atlas (piano gratuito).
// Tutti i dati (admin, pastes, members) vivono in UN SOLO documento
// nella collection "appdata", cosi' la forma dei dati resta identica
// a prima (stesso oggetto { admin, pastes, members }).

const { MongoClient } = require("mongodb");

const MONGODB_URI = process.env.MONGODB_URI;
const DOC_ID = "77expo-data"; // id fisso: c'e' sempre e solo un documento

if (!MONGODB_URI) {
  console.error(
    "Manca MONGODB_URI. Impostala nelle Environment Variables (vedi .env.example)."
  );
  process.exit(1);
}

let clientPromise = null;
let collectionPromise = null;

function getCollection() {
  if (!collectionPromise) {
    const client = new MongoClient(MONGODB_URI);
    clientPromise = client.connect();
    collectionPromise = clientPromise.then((c) => {
      console.log("Connesso a MongoDB Atlas.");
      return c.db("expo77").collection("appdata");
    });
  }
  return collectionPromise;
}

function defaultData() {
  return {
    admin: {
      passwordHash: null, // impostato da db/init.js
    },
    pastes: [], // { id, title, content, authors, createdAt }
    members: [], // { id, username, photoDataUrl, createdAt }
  };
}

async function read() {
  const col = await getCollection();
  const doc = await col.findOne({ _id: DOC_ID });
  if (!doc) {
    const fresh = defaultData();
    await write(fresh);
    return fresh;
  }
  const { _id, ...data } = doc;
  return data;
}

async function write(data) {
  const col = await getCollection();
  await col.updateOne({ _id: DOC_ID }, { $set: data }, { upsert: true });
}

function nextId(items) {
  return items.reduce((max, p) => Math.max(max, p.id), 0) + 1;
}

module.exports = { read, write, nextId };
