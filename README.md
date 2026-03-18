# Practice Sync Player

A Go + PostgreSQL practice player for syncing a tutorial video and an official clip on one shared timeline.

## What changed

- Songs now load from PostgreSQL through a Go server instead of being fetched directly from inline JSON.
- `db/patches/*.sql` are applied automatically on startup.
- `config.yaml` holds the server, PostgreSQL, Supabase, and site settings.
- Supabase handles email/password login for the browser UI.
- User defaults like shortcut mappings and fullscreen behavior are stored in the authenticated user profile.
- The public lobby shows published songs first, while editing/publishing is limited to logged-in owners.

## Stack

- Go HTTP server
- PostgreSQL
- Vanilla HTML / CSS / JavaScript
- YouTube IFrame API
- Supabase auth (email/password)

## Local setup

1. Install Go and PostgreSQL.
2. Create a database that matches the `database` section in `config.yaml`.
3. Edit `config.yaml` with your real PostgreSQL credentials.
4. Run:

```bash
./start-server.sh
```

The Go server applies any new SQL patches from `db/patches/` before it starts serving the app.

## Important files

- `main.go`: HTTP server, API routes, and static-file serving
- `store.go`: PostgreSQL access
- `seed.go`: one-time import of the legacy Rihanna seed into PostgreSQL
- `config.yaml`: local runtime configuration
- `db/patches/001_initial_schema.sql`: initial schema patch
- `index.html`, `styles.css`, `app.js`: browser UI

## Auth note

Supabase is used only for authentication. Song data and user profile defaults live in your PostgreSQL database.

Self-serve account deletion requires a Supabase service role key in `config.yaml`. Without that key, the UI explains that deletion is not yet enabled server-side.
