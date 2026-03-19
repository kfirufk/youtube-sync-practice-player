# Practice Sync Player

A Go + PostgreSQL practice player for syncing a tutorial video and an official clip on one shared timeline.

## What changed

- Songs now load from PostgreSQL through a Go server instead of being fetched directly from inline JSON.
- `api/db/patches/*.sql` are applied automatically on startup.
- `api/config.yaml` holds the server, PostgreSQL, Supabase, and site settings.
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
2. Create a database that matches the `database` section in `api/config.yaml`.
3. Edit `api/config.yaml` with your real PostgreSQL credentials.
4. Run:

```bash
./start-server.sh
```

The Go server applies any new SQL patches from `api/db/patches/` before it starts serving the app.

On a Mac development machine you can also run:

```bash
./start-dev.sh
```

`start-dev.sh` waits for the app to become healthy, opens the browser automatically, and still applies any new SQL patches through the Go startup flow.

## Production deploy

Use:

```bash
./deploy-production.sh
```

What it does:

- runs `git pull --ff-only`
- builds the Go server binary into `api/youtube-sync-practice-player`
- copies the static client files into `/var/www/sync.tvguitar.com` by default
- creates or restarts `sync-tvguitar.service`
- prints an nginx example that serves the client and reverse-proxies `/api/` to the Go server

Default assumptions in this repo:

```bash
user/group: ufk
project path: /Volumes/extreme-ssd/projects/youtube-sync-practice-player
client root: /var/www/sync.tvguitar.com
service: sync-tvguitar.service
domain: sync.tvguitar.com
backend: 127.0.0.1:8028
```

If you need to override something, use flags instead of environment variables:

```bash
./deploy-production.sh --client-dir /var/www/sync.tvguitar.com --port 8028
```

Example config files are included at:

- `deploy/systemd/sync-tvguitar.service.example`
- `deploy/nginx/sync-tvguitar.conf.example`

## Project layout

- `api/`: Go server, PostgreSQL config, seed import, and SQL patches
- `client/`: browser UI, styles, and legal pages
- `start-server.sh`, `start-dev.sh`, `start-server.ps1`: root-level convenience scripts that point at the `api/` app

## Important files

- `api/main.go`: HTTP server, API routes, and static-file serving
- `api/store.go`: PostgreSQL access
- `api/seed.go`: one-time import of the legacy Rihanna seed into PostgreSQL
- `api/config.yaml`: local runtime configuration
- `api/db/patches/001_initial_schema.sql`: initial schema patch
- `client/index.html`, `client/styles.css`, `client/app.js`: browser UI

## Auth note

Supabase is used only for authentication. Song data and user profile defaults live in your PostgreSQL database.

Self-serve account deletion requires a Supabase service role key in `api/config.yaml`. Without that key, the UI explains that deletion is not yet enabled server-side.
