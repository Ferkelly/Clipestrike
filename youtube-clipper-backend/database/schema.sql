-- Users
create table users (
  id uuid default gen_random_uuid() primary key,
  email text unique not null,
  name text,
  password_hash text,
  avatar text,
  google_id text unique,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Channels
create table channels (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references users(id),
  youtube_channel_id text unique not null,
  channel_name text,
  access_token text,
  refresh_token text,
  is_active boolean default true,
  last_check timestamp with time zone,
  instagram_account_id text,
  instagram_token text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Videos
create table videos (
  id uuid default gen_random_uuid() primary key,
  channel_id uuid references channels(id),
  youtube_video_id text unique not null,
  title text,
  description text,
  thumbnail_url text,
  published_at timestamp with time zone,
  status text default 'pending', -- pending, processing, completed, failed
  transcription text,
  processed_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Clips
create table clips (
  id uuid default gen_random_uuid() primary key,
  video_id uuid references videos(id),
  title text,
  start_time text,
  end_time text,
  viral_score integer,
  file_url text,
  status text default 'ready', -- ready, posted, failed
  hook text,
  reason text,
  posted_at timestamp with time zone,
  platforms jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Notifications
create table notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references users(id),
  type text,
  message text,
  data jsonb,
  read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now())
);
