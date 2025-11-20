-- Extensions used by types and UUID defaults
CREATE EXTENSION citext;

CREATE EXTENSION pgcrypto;

-- Enums
CREATE TYPE user_role AS ENUM('ADMIN', 'EDITOR');


-- USERS
CREATE TABLE users (
id uuid PRIMARY KEY DEFAULT gen_random_uuid (),
email citext UNIQUE,
password_hash text,
first_name text,
last_name text,
phone text,
role user_role,
is_active boolean,
created_at timestamptz DEFAULT now(),
updated_at timestamptz DEFAULT now(),
last_login_at timestamptz
);

-- PERMISSIONS
CREATE TABLE permissions (
    name TEXT PRIMARY KEY,
    description TEXT
);

-- USER PERMISSIONS
CREATE TABLE user_permissions (
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    permission_name TEXT NOT NULL REFERENCES permissions(name) ON DELETE CASCADE,
    PRIMARY KEY (user_id, permission_name)
);

-- ROLE PERMISSIONS
CREATE TABLE role_permissions (
    role user_role NOT NULL,
    permission_name TEXT NOT NULL REFERENCES permissions(name) ON DELETE CASCADE,
    PRIMARY KEY (role, permission_name)
);
create table artists (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid (),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
create table genres (
    slug text PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- MUSIC
CREATE TABLE music (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid (),
    title TEXT NOT NULL,
    artist TEXT NOT NULL,
    album TEXT,
    year INTEGER,
    genre_slug TEXT NOT NULL REFERENCES genres(slug) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- REVIEWS
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    music_id INTEGER NOT NULL REFERENCES music(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    title TEXT,
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);