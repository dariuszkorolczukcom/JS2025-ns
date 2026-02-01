# 04 — Baza danych

Źródło: skrypty w `db/initdb/`, wykonywane alfabetycznie przy pierwszym starcie kontenera PostgreSQL (Docker: `docker-entrypoint-initdb.d`).

---

## Schemat — `1_create_schema.sql`

**Rozszerzenia:** `citext` (case-insensitive text), `pgcrypto` (UUID).

**Enum:** `user_role` — wartości: `'ADMIN'`, `'EDITOR'`, `'USER'`.

### Tabele

| Tabela | Klucz główny | Opis |
|--------|--------------|------|
| **users** | id (uuid, DEFAULT gen_random_uuid()) | Użytkownicy: email (citext UNIQUE), password_hash, username (citext UNIQUE), first_name, last_name, phone, role (user_role), is_active, created_at, updated_at, last_login_at. |
| **permissions** | name (TEXT PRIMARY KEY) | Słownik uprawnień: name, description. |
| **user_permissions** | (user_id, permission_name) PK | Przypisanie uprawnień do użytkownika. user_id → users(id) ON DELETE CASCADE, permission_name → permissions(name) ON DELETE CASCADE. |
| **role_permissions** | (role, permission_name) PK | Przypisanie uprawnień do roli. role (user_role), permission_name → permissions(name) ON DELETE CASCADE. |
| **artists** | id (uuid) | Artyści: name, created_at. |
| **genres** | slug (text PRIMARY KEY) | Gatunki: slug, name. |
| **music** | id (uuid) | Utwory: title, artist, album, year, genre_slug → genres(slug) ON DELETE CASCADE, youtube_url, created_at. |
| **reviews** | id (uuid) | Opinie: user_id → users(id) ON DELETE CASCADE, music_id → music(id) ON DELETE CASCADE, rating (CHECK 1–5), title, comment, created_at, updated_at. |

**Klucze obce i CASCADE:**

- `user_permissions.user_id` → `users(id)` ON DELETE CASCADE — usunięcie użytkownika usuwa jego wpisy w user_permissions.
- `user_permissions.permission_name` → `permissions(name)` ON DELETE CASCADE.
- `role_permissions.permission_name` → `permissions(name)` ON DELETE CASCADE.
- `music.genre_slug` → `genres(slug)` ON DELETE CASCADE — usunięcie gatunku usuwa powiązane utwory (ostrożnie w produkcji).
- `reviews.user_id` → `users(id)` ON DELETE CASCADE — usunięcie użytkownika usuwa jego opinie.
- `reviews.music_id` → `music(id)` ON DELETE CASCADE — usunięcie utworu usuwa opinie do tego utworu.

---

## Uprawnienia i role — `2_permissions.sql`

**INSERT INTO permissions:**  
users:create, users:read, users:update, users:delete;  
music:create, music:read, music:update, music:delete;  
reviews:create, reviews:read, reviews:update, reviews:delete;  
artists:create, artists:read, artists:update, artists:delete;  
genres:create, genres:read, genres:update, genres:delete.

**role_permissions:**

- **ADMIN:** wszystkie powyższe uprawnienia.
- **EDITOR:** music:*, artists:*, genres:*, reviews:*, users:read (bez users:create/update/delete).
- **USER:** music:read, artists:read, genres:read, reviews:create, reviews:read, reviews:update, reviews:delete.

(Uwaga: backend nie używa wszystkich tych uprawnień — np. artists/genres w kontrolerach są ograniczone do music/reviews.)

---

## Admin i seed — `3_admin_user.sql`, `4_seed_music.sql`, `5_update_user_permissions.sql`

- **3_admin_user.sql:** INSERT użytkownika z email `admin@example.com`, hasło zahashowane (odpowiednik `password`), first_name `Admin`, role `ADMIN`, is_active true. Nie ustawia `username` (kolumna może być NULL). Następnie INSERT do `user_permissions` — wszystkie uprawnienia z role_permissions dla ADMIN.
- **4_seed_music.sql:** INSERT gatunków (rock, pop, jazz, classical, electronic, hip-hop, blues, country) ON CONFLICT DO NOTHING; INSERT 20 utworów (title, artist, album, year, genre_slug, youtube_url).
- **5_update_user_permissions.sql:** UPDATE admin@example.com (role ADMIN), przebudowa user_permissions dla admina; UPDATE/INSERT użytkownika dkorolczuk86@gmail.com jako EDITOR, usunięcie jego user_permissions (używa uprawnień z roli).

---

## Migracja — `6_add_youtube_url.sql`

Dodaje kolumnę `youtube_url` (TEXT) do tabeli `music`, jeśli jeszcze nie istnieje (sprawdzenie w information_schema).

---

## Relacje (diagram ASCII)

```
users
  │
  ├── user_permissions ──► permissions
  │
  └── reviews ──► music ──► genres

role_permissions ──► permissions (role = user_role enum)

music.genre_slug ──► genres.slug
reviews.user_id   ──► users.id
reviews.music_id  ──► music.id
```

---

## Podsumowanie kluczy i CASCADE

| Tabela / FK | Odniesienie | CASCADE |
|-------------|-------------|---------|
| user_permissions.user_id | users(id) | ON DELETE CASCADE |
| user_permissions.permission_name | permissions(name) | ON DELETE CASCADE |
| role_permissions.permission_name | permissions(name) | ON DELETE CASCADE |
| music.genre_slug | genres(slug) | ON DELETE CASCADE |
| reviews.user_id | users(id) | ON DELETE CASCADE |
| reviews.music_id | music(id) | ON DELETE CASCADE |

Usunięcie użytkownika → usuwa wpisy w `user_permissions` i wszystkie jego `reviews`.  
Usunięcie utworu (`music`) → usuwa wszystkie `reviews` do tego utworu.  
Usunięcie gatunku → usuwa wszystkie `music` z tym genre_slug (i w efekcie ich reviews).
