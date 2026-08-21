# 77 EXPOSED

Archivio pubblico di post (solo titolo visibile nel feed, contenuto completo
in una pagina dedicata a schermo intero), una sezione "Official Member" con
i membri del gruppo (username + logo personale), e un pannello admin protetto
da password gestita lato server da cui si gestisce tutto.

## Cosa contiene

- `server.js` — server Express con tutte le rotte e l'autenticazione
- `db/store.js` / `db/init.js` — storage su file JSON (`db/data.json`) e script di inizializzazione
- `views/` — le pagine HTML (feed, post singolo, official member, login admin, dashboard admin)
- `public/` — CSS e JS lato client

## Installazione

Serve [Node.js](https://nodejs.org/) (versione 18 o successiva).

```bash
cd dox-school
npm install
```

Poi crea il file `.env` copiando l'esempio:

```bash
cp .env.example .env
```

Apri `.env` e imposta:

- `ADMIN_INITIAL_PASSWORD` — la password che userai per entrare in `/admin`
- `SESSION_SECRET` — una stringa lunga e casuale qualsiasi (serve per firmare i cookie)

## Inizializzazione del database

```bash
npm run seed
```

Crea `db/data.json`, hasha la password admin con bcrypt (non viene mai
salvata in chiaro), aggiunge un membro demo ("admin") e qualche post di
esempio. Rieseguendo `npm run seed` in futuro aggiorni solo la password
admin, senza toccare membri e post già presenti.

## Avvio

```bash
npm start
```

Poi apri [http://localhost:3000](http://localhost:3000).

- `/` — feed pubblico, solo titoli
- `/paste/:id` — pagina a schermo intero con il post completo
- `/official-member` — membri del gruppo (username + logo)
- `/admin/login` — accesso admin
- `/admin` — pannello per gestire i membri e pubblicare/eliminare post (raggiungibile solo dopo il login)

## Come funziona

- **Membri**: dal pannello admin aggiungi un username e, opzionalmente, un
  logo/immagine (caricato come file, convertito in base64 e salvato nel
  database). Compaiono nella pagina pubblica "Official Member".
- **Post**: quando pubblichi un post, scegli uno o più autori tra i membri
  già registrati (menu a selezione multipla a "pillole"). Non è possibile
  indicare autori che non siano già presenti tra i membri — il server lo
  valida anche lato API, non solo nell'interfaccia.
- **Autenticazione**: password admin hashata con `bcryptjs`, confrontata
  lato server ad ogni login. Sessione con cookie `httpOnly`
  (`express-session`). Tutte le rotte di scrittura (creazione/eliminazione
  post e membri) controllano la sessione lato server.

## Idee per estendere il progetto

- Rate limiting sulla pubblicazione (es. `express-rate-limit`)
- Paginazione del feed
- Editing dei post esistenti, non solo eliminazione
- Log delle azioni admin
