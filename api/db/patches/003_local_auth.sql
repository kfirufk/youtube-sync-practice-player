alter table user_profiles
  alter column user_id set default gen_random_uuid();

alter table user_profiles
  add column if not exists email_normalized text,
  add column if not exists email_verified_at timestamptz,
  add column if not exists google_subject text,
  add column if not exists last_login_at timestamptz;

update user_profiles
set email_normalized = nullif(lower(btrim(email)), '')
where email_normalized is null
  and nullif(btrim(email), '') is not null;

create unique index if not exists user_profiles_email_normalized_uidx
  on user_profiles (email_normalized);

create unique index if not exists user_profiles_google_subject_uidx
  on user_profiles (google_subject);

create table if not exists email_auth_tokens (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  email_normalized text not null,
  requested_display_name text not null default '',
  flow text not null,
  token_hash text not null unique,
  expires_at timestamptz not null,
  used_at timestamptz,
  requested_ip inet,
  user_agent text not null default '',
  created_at timestamptz not null default now(),
  constraint email_auth_tokens_flow_check check (flow in ('login', 'signup'))
);

create index if not exists email_auth_tokens_email_expires_idx
  on email_auth_tokens (email_normalized, expires_at desc);

create table if not exists user_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references user_profiles(user_id) on delete cascade,
  session_hash text not null unique,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  requested_ip inet,
  user_agent text not null default '',
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create index if not exists user_sessions_user_expires_idx
  on user_sessions (user_id, expires_at desc);
