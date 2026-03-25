# Practice Sync Player

A Go + PostgreSQL practice player for syncing a tutorial video and an official clip on one shared timeline.

## Current stack

- Go HTTP server
- PostgreSQL
- Vanilla HTML / CSS / JavaScript
- YouTube IFrame API
- First-party auth with:
  - email magic links sent through SMTP
  - Google Identity Services for Google sign-in
  - secure HTTP-only session cookies stored locally by the app

## What changed

- Songs load from PostgreSQL through the Go server.
- `api/db/patches/*.sql` are applied automatically on startup.
- `api/config.yaml` now holds the server, PostgreSQL, auth, email SMTP, Google, and site settings.
- Supabase has been removed completely.
- User defaults like shortcut mappings and fullscreen behavior are stored in the authenticated user profile.
- The public lobby shows published songs first, while editing and publishing is limited to signed-in owners.

## Required config

Copy `api/config.example.yaml` to `api/config.yaml` and fill in:

- `database.*`
- `email.from_email`
- `email.smtp.host`
- `email.smtp.port`
- `email.smtp.user`
- `email.smtp.password`
- `google.client_id`
- `site.base_url`

Notes:

- `site.base_url` must match the public origin that receives the magic-link callback.
- `email.from_email` must be a valid sender identity for your SMTP provider.
- If you use Resend SMTP, the common settings are `smtp.resend.com`, user `resend`, and your Resend SMTP/API secret as the SMTP password.
- If `google.client_id` is left blank, Google sign-in stays hidden.
- If the email SMTP values are left blank, email magic links stay disabled.

## Local setup

1. Install Go and PostgreSQL.
2. Create a database that matches the `database` section in `api/config.yaml`.
3. Edit `api/config.yaml` with your real credentials and provider keys.
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
user/group: ufk / users
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

- `api/`: Go server, PostgreSQL config, auth, seed import, and SQL patches
- `client/`: browser UI, styles, and legal pages
- `start-server.sh`, `start-dev.sh`, `start-server.ps1`: root-level convenience scripts that point at the `api/` app

## Important files

- `api/main.go`: HTTP server, API routes, auth routes, and static-file serving
- `api/auth_http.go`: email magic-link, Google sign-in, session cookies, and request guards
- `api/auth_store.go`: PostgreSQL auth/session persistence
- `api/store.go`: song and profile persistence
- `api/config.example.yaml`: runtime configuration template
- `api/db/patches/003_local_auth.sql`: local auth tables and indexes
- `client/index.html`, `client/styles.css`, `client/app.js`: browser UI
