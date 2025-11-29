# JS2025-ns
## Skład grupy:
- Dariusz Korolczuk
- Adrian Mogielnicki
- Bartosz Regucki

## MusicWeb - Filmweb ale do muzyki

Aplikacja webowa do zarządzania biblioteką muzyczną, inspirowana serwisem Filmweb. Umożliwia przeglądanie, dodawanie i ocenianie utworów muzycznych.

### Funkcjonalności:
- ✅ System rejestracji i logowania użytkowników
- ✅ Zarządzanie użytkownikami z systemem uprawnień (ADMIN, EDITOR, USER)
- ✅ Biblioteka muzyczna z pełnym CRUD
- ✅ System opinii i ocen utworów
- ✅ Wyszukiwarka i filtrowanie muzyki
- ✅ Responsywny interfejs użytkownika
- ✅ System motywów (jasny/ciemny)

---

## Szybki start (Docker)

### Wymagania
- Docker
- Docker Compose

### Uruchomienie

1. **Przejdź do katalogu z docker-compose:**
   ```bash
   cd compose/dev
   ```

2. **Utwórz plik `.env`** (jeśli nie istnieje) z następującymi zmiennymi:
   ```env
   POSTGRES_USER=postgres
   POSTGRES_PASSWORD=password
   POSTGRES_NAME=musicweb
   POSTGRES_HOST=postgres
   POSTGRES_PORT=5432
   JWT_SECRET=your-secret-key-here-change-in-production
   PORT=3000
   ```

3. **Uruchom kontenery:**
   ```bash
   docker compose up --build
   ```

4. **Aplikacja będzie dostępna pod adresem:**
   - Frontend: `http://localhost`
   - Backend API: `http://localhost/api`
   - Healthcheck: `http://localhost/api/health`

### Domyślne konto administratora

- **Email:** `admin@example.com`
- **Hasło:** `password`

### Zatrzymanie

```bash
docker compose down
```

---

## Backend API - Node.js + Express + TypeScript

### Struktura projektu

```
backend/
├── src/
│   ├── config/          # Konfiguracja (database, passport)
│   ├── controllers/     # Kontrolery (users, music, reviews, auth)
│   ├── middleware/      # Middleware (auth, permissions)
│   ├── models/          # Modele TypeScript
│   ├── routes/          # Definicje routingu
│   └── index.ts         # Główny plik serwera
├── package.json
└── tsconfig.json
```

### Instalacja i uruchomienie (bez Dockera)

1. **Instalacja zależności:**
   ```bash
   cd backend
   npm install
   ```

2. **Uruchomienie serwera:**
   ```bash
   # Tryb deweloperski (z auto-reload)
   npm run dev
   ```

3. **Serwer domyślnie działa na porcie 3000:**
   - URL: `http://localhost:3000`
   - API Base URL: `http://localhost:3000/api`

### Technologie backendu

- **Node.js** - środowisko uruchomieniowe
- **Express** - framework webowy
- **TypeScript** - język programowania
- **PostgreSQL** - baza danych
- **Passport.js** - autentykacja JWT
- **bcryptjs** - hashowanie haseł
- **pg** - klient PostgreSQL

### API Endpoints

#### Users API (`/api/users`)

- **GET `/api/users`** - Pobierz wszystkich użytkowników
  - Response: `200 OK` - tablica użytkowników
  - Auth: Wymagane (users:read)
  
- **GET `/api/users/:id`** - Pobierz użytkownika po ID
  - Response: `200 OK` - obiekt użytkownika
  - Error: `404 Not Found` - użytkownik nie istnieje
  - Auth: Wymagane (users:read)

- **POST `/api/users`** - Utwórz nowego użytkownika
  - Body (JSON):
    ```json
    {
      "username": "string (required)",
      "email": "string (required)",
      "password": "string (required)",
      "first_name": "string (optional)",
      "last_name": "string (optional)",
      "role": "string (optional, default: 'USER')"
    }
    ```
  - Response: `201 Created` - utworzony użytkownik
  - Error: `400 Bad Request` - brakuje wymaganych pól
  - Error: `409 Conflict` - użytkownik już istnieje
  - Auth: Wymagane (users:create)

- **PUT/PATCH `/api/users/:id`** - Aktualizuj użytkownika
  - Body (JSON): częściowe lub pełne dane do aktualizacji
  - Response: `200 OK` - zaktualizowany użytkownik
  - Error: `404 Not Found` - użytkownik nie istnieje
  - Error: `400 Bad Request` - błędy walidacji
  - Auth: Wymagane (users:update)

- **DELETE `/api/users/:id`** - Usuń użytkownika
  - Response: `200 OK` - komunikat o sukcesie
  - Error: `404 Not Found` - użytkownik nie istnieje
  - Auth: Wymagane (users:delete)

#### Music API (`/api/music`)

- **GET `/api/music`** - Pobierz wszystkie wpisy muzyczne
  - Response: `200 OK` - tablica wpisów muzycznych
  - Auth: Nie wymagane

- **GET `/api/music/:id`** - Pobierz wpis muzyczny po ID
  - Response: `200 OK` - obiekt wpisu muzycznego
  - Error: `404 Not Found` - wpis nie istnieje
  - Auth: Nie wymagane

- **POST `/api/music`** - Dodaj nowy wpis muzyczny
  - Body (JSON):
    ```json
    {
      "title": "string (required)",
      "artist": "string (required)",
      "album": "string (optional)",
      "year": "number (optional)",
      "genre": "string (optional)"
    }
    ```
  - Response: `201 Created` - utworzony wpis muzyczny
  - Error: `400 Bad Request` - brakuje wymaganych pól
  - Auth: Wymagane (music:create)

- **PUT/PATCH `/api/music/:id`** - Aktualizuj wpis muzyczny
  - Body (JSON): częściowe lub pełne dane do aktualizacji
  - Response: `200 OK` - zaktualizowany wpis
  - Error: `404 Not Found` - wpis nie istnieje
  - Error: `400 Bad Request` - błędy walidacji
  - Auth: Wymagane (music:update)

- **DELETE `/api/music/:id`** - Usuń wpis muzyczny
  - Response: `200 OK` - komunikat o sukcesie
  - Error: `404 Not Found` - wpis nie istnieje
  - Auth: Wymagane (music:delete)

#### Reviews API (`/api/reviews`)

- **GET `/api/reviews`** - Pobierz wszystkie opinie
  - Response: `200 OK` - tablica opinii
  - Auth: Wymagane (reviews:read)

- **GET `/api/reviews/:id`** - Pobierz opinię po ID
  - Response: `200 OK` - obiekt opinii
  - Error: `404 Not Found` - opinia nie istnieje
  - Auth: Wymagane (reviews:read)

- **POST `/api/reviews`** - Utwórz nową opinię
  - Body (JSON):
    ```json
    {
      "userId": "string (required, UUID)",
      "musicId": "string (required, UUID)",
      "rating": "number (required, 1-5)",
      "title": "string (optional)",
      "comment": "string (optional)"
    }
    ```
  - Response: `201 Created` - utworzona opinia
  - Error: `400 Bad Request` - brakuje wymaganych pól lub nieprawidłowa ocena
  - Error: `404 Not Found` - użytkownik lub wpis muzyczny nie istnieje
  - Auth: Wymagane (reviews:create)

- **PUT/PATCH `/api/reviews/:id`** - Aktualizuj opinię
  - Body (JSON): częściowe lub pełne dane do aktualizacji
  - Response: `200 OK` - zaktualizowana opinia
  - Error: `404 Not Found` - opinia nie istnieje
  - Error: `400 Bad Request` - błędy walidacji
  - Auth: Wymagane (reviews:update)

- **DELETE `/api/reviews/:id`** - Usuń opinię
  - Response: `200 OK` - komunikat o sukcesie
  - Error: `404 Not Found` - opinia nie istnieje
  - Auth: Wymagane (reviews:delete)

#### Healthcheck API

- **GET `/api/health`** - Sprawdź status aplikacji i bazy danych
  - Response: `200 OK` - status aplikacji
  - Auth: Nie wymagane

### Testowanie w Postmanie

#### Konfiguracja Postman

1. **Utwórz nowy Collection:**
   - Nazwa: "MusicWeb API"
   - Base URL: `http://localhost:3000/api`

2. **Przykładowe requesty:**

   **GET All Users:**
   - Method: `GET`
   - URL: `http://localhost:3000/api/users`
   - Headers: (brak)

   **GET User by ID:**
   - Method: `GET`
   - URL: `http://localhost:3000/api/users/1`
   - Headers: (brak)

   **POST Create User:**
   - Method: `POST`
   - URL: `http://localhost:3000/api/users`
   - Headers: `Content-Type: application/json`
   - Body (raw JSON):
     ```json
     {
       "username": "new_user",
       "email": "newuser@example.com",
       "password": "password123",
       "role": "user"
     }
     ```

   **GET All Music:**
   - Method: `GET`
   - URL: `http://localhost:3000/api/music`
   - Headers: (brak)

   **POST Create Music:**
   - Method: `POST`
   - URL: `http://localhost:3000/api/music`
   - Headers: `Content-Type: application/json`
   - Body (raw JSON):
     ```json
     {
       "title": "Bohemian Rhapsody",
       "artist": "Queen",
       "album": "A Night at the Opera",
       "year": 1975,
       "genre": "Rock"
     }
     ```

   **GET All Reviews:**
   - Method: `GET`
   - URL: `http://localhost:3000/api/reviews`
   - Headers: (brak)

   **POST Create Review:**
   - Method: `POST`
   - URL: `http://localhost:3000/api/reviews`
   - Headers: `Content-Type: application/json`
   - Body (raw JSON):
     ```json
     {
       "userId": 2,
       "musicId": 1,
       "rating": 5,
       "comment": "Amazing album!"
     }
     ```

#### Wskazówki do testowania

1. **Upewnij się, że serwer działa** przed testowaniem w Postmanie
2. **Sprawdź Content-Type header** - dla POST requestów ustaw `Content-Type: application/json`
3. **Testuj w kolejności:**
   - Najpierw utwórz użytkownika (POST /api/users)
   - Następnie dodaj muzykę (POST /api/music)
   - Na końcu dodaj opinię (POST /api/reviews) - wymaga istniejącego userId i musicId
4. **Sprawdź odpowiedzi błędów** - API zwraca szczegółowe komunikaty błędów w formacie JSON

---

## Frontend - Vue 3 + TypeScript

### Struktura projektu

```
frontend/
├── src/
│   ├── assets/          # Style i zasoby
│   ├── components/      # Komponenty Vue (Navbar, Footer)
│   ├── config/          # Konfiguracja (axios)
│   ├── router/          # Vue Router
│   ├── views/           # Widoki (Home, About, Music, Login)
│   ├── App.vue          # Główny komponent
│   └── main.ts           # Punkt wejścia
├── package.json
└── vite.config.ts
```

### Technologie frontendu

- **Vue 3** - framework JavaScript
- **TypeScript** - język programowania
- **Vite** - narzędzie buildowe
- **Vue Router** - routing
- **Bootstrap 5** - framework CSS
- **Axios** - klient HTTP

### Instalacja i uruchomienie (bez Dockera)

1. **Instalacja zależności:**
   ```bash
   cd frontend
   npm install
   ```

2. **Uruchomienie serwera deweloperskiego:**
   ```bash
   npm run dev
   ```

2. **Build produkcyjny:**
   ```bash
   npm run build
   ```

---

## Baza danych

### Struktura

Baza danych PostgreSQL jest automatycznie inicjalizowana przez skrypty SQL w `db/initdb/`:

1. **`1_create_schema.sql`** - tworzenie tabel (users, music, reviews, genres, permissions)
2. **`2_permissions.sql`** - dodanie uprawnień i przypisanie do ról
3. **`3_admin_user.sql`** - utworzenie użytkownika administratora
4. **`4_seed_music.sql`** - seed danych muzycznych (20 przykładowych utworów)

### Tabele

- **users** - użytkownicy systemu
- **music** - utwory muzyczne
- **reviews** - opinie o utworach
- **genres** - gatunki muzyczne
- **artists** - artyści (tabela przygotowana na przyszłość)
- **permissions** - uprawnienia
- **user_permissions** - przypisanie uprawnień do użytkowników
- **role_permissions** - przypisanie uprawnień do ról

### Role i uprawnienia

- **ADMIN** - pełny dostęp do wszystkich funkcji
- **EDITOR** - zarządzanie muzyką i opiniami
- **USER** - podstawowe funkcje (przeglądanie, dodawanie opinii)

---

## Autoryzacja

Aplikacja używa JWT (JSON Web Tokens) do autoryzacji:

1. Użytkownik loguje się przez `/api/auth/login`
2. Serwer zwraca token JWT
3. Token jest przechowywany w `localStorage`
4. Token jest automatycznie dodawany do wszystkich żądań przez axios interceptor
5. Token wygasa po 1 godzinie

### Headers

Wszystkie chronione endpointy wymagają nagłówka:
```
Authorization: Bearer <token>
```

---

## Dokumentacja zmian

Szczegółowy opis wszystkich zmian znajduje się w pliku [CHANGELOG_DEV.md](./CHANGELOG_DEV.md).

---

## Licencja

Projekt edukacyjny - JS2025