create extension if not exists pgcrypto;

create table if not exists user_profiles (
  user_id uuid primary key,
  email text not null default '',
  display_name text not null default '',
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists songs (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  artist text not null,
  summary text not null default '',
  description text not null default '',
  owner_user_id uuid,
  owner_display_name text not null default '',
  official_clip_url text not null,
  tutorial_url text not null,
  song_start_sec numeric(10,3) not null default 0,
  tutorial_start_sec numeric(10,3) not null default 0,
  countdown_sec integer not null default 4,
  metronome_bpm integer not null default 92,
  metronome_beats_per_bar integer not null default 4,
  loop_repeat_target integer not null default 4,
  lyrics text not null default '',
  markers jsonb not null default '[]'::jsonb,
  sections jsonb not null default '[]'::jsonb,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists songs_published_updated_idx on songs (published, updated_at desc);
create index if not exists songs_owner_updated_idx on songs (owner_user_id, updated_at desc);
