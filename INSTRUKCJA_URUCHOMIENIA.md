# Instrukcja uruchomienia aplikacji MusicWeb

## Szybki start (Docker - zalecane)

### Wymagania
- Docker
- Docker Compose

### Krok 1: Przejdź do katalogu z docker-compose

```bash
cd compose/dev
```

### Krok 2: Utwórz plik `.env`

Utwórz plik `.env` w katalogu `compose/dev/` z następującą zawartością:

```env
POSTGRES_USER=postgres
POSTGRES_PASSWORD=password
POSTGRES_DB=musicweb
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
JWT_SECRET=your-secret-key-here-change-in-production
JWT_EXPIRES_IN=24h
NODE_ENV=development
PORT=3000
```

### Krok 3: Uruchom aplikację

```bash
docker compose up --build
```

**Uwaga:** Przy pierwszym uruchomieniu może to zająć kilka minut, ponieważ Docker pobiera obrazy i buduje kontenery.

### Krok 4: Sprawdź czy aplikacja działa

Po uruchomieniu aplikacja będzie dostępna pod adresami:
- **Frontend:** http://localhost
- **Backend API:** http://localhost/api
- **Healthcheck:** http://localhost/api/health

---

## Dane logowania

### Domyślne konto administratora

Po pierwszym uruchomieniu aplikacji automatycznie tworzone jest konto administratora:

- **Email:** `admin@example.com`
- **Hasło:** `password`
- **Rola:** ADMIN (pełny dostęp do wszystkich funkcji)

### Tworzenie nowego konta użytkownika

Możesz również utworzyć nowe konto użytkownika:

1. Przejdź do http://localhost
2. Kliknij **"Sign up"** w prawym górnym rogu
3. Wypełnij formularz rejestracji:
   - Username (min. 3 znaki)
   - Email
   - Password (min. 6 znaków)
   - First Name (opcjonalne)
   - Last Name (opcjonalne)
4. Kliknij **"REGISTER"**

Nowy użytkownik będzie miał domyślnie rolę **USER** (podstawowe uprawnienia).

---

## Zatrzymanie aplikacji

Aby zatrzymać aplikację:

```bash
cd compose/dev
docker compose down
```

Aby zatrzymać i usunąć wszystkie dane (w tym bazę danych):

```bash
docker compose down -v
```

---

## Uruchomienie bez Dockera (development)

### Backend

1. **Przejdź do katalogu backend:**
   ```bash
   cd backend
   ```

2. **Zainstaluj zależności:**
   ```bash
   npm install
   ```

3. **Utwórz plik `.env` w katalogu `backend/`:**
   ```env
   POSTGRES_USER=postgres
   POSTGRES_PASSWORD=password
   POSTGRES_DB=musicweb
   POSTGRES_HOST=localhost
   POSTGRES_PORT=5432
   JWT_SECRET=your-secret-key-here-change-in-production
   JWT_EXPIRES_IN=24h
   NODE_ENV=development
   PORT=3000
   ```

4. **Upewnij się, że PostgreSQL działa lokalnie** (lub użyj Dockera tylko dla bazy danych)

5. **Uruchom serwer:**
   ```bash
   npm run dev
   ```

   Backend będzie dostępny na: http://localhost:3000

### Frontend

1. **Przejdź do katalogu frontend:**
   ```bash
   cd frontend
   ```

2. **Zainstaluj zależności:**
   ```bash
   npm install
   ```

3. **Uruchom serwer deweloperski:**
   ```bash
   npm run dev
   ```

   Frontend będzie dostępny na: http://localhost:5173

4. **Upewnij się, że w pliku `frontend/src/config/axios.ts` baseURL wskazuje na backend:**
   ```typescript
   baseURL: 'http://localhost:3000/api'
   ```

---

## Rozwiązywanie problemów

### Problem: Port już zajęty

Jeśli port 80, 3000 lub 5432 jest już zajęty:

1. **Zmień porty w `docker-compose.yml`:**
   ```yaml
   ports:
     - "8080:80"  # zamiast "80:80" dla nginx
     - "3001:3000"  # zamiast "3000:3000" dla backendu
   ```

2. **Lub zatrzymaj aplikację używającą tych portów**

### Problem: Baza danych nie inicjalizuje się

1. **Sprawdź logi:**
   ```bash
   docker compose logs postgres
   ```

2. **Usuń wolumeny i uruchom ponownie:**
   ```bash
   docker compose down -v
   docker compose up --build
   ```

### Problem: Backend nie łączy się z bazą danych

1. **Sprawdź czy plik `.env` istnieje i ma poprawne wartości**
2. **Sprawdź logi:**
   ```bash
   docker compose logs backend
   ```
3. **Upewnij się, że postgres jest healthy:**
   ```bash
   docker compose ps
   ```

### Problem: Token wygasł

Token JWT wygasa po 24 godzinach (domyślnie). Po wygaśnięciu:
1. Wyloguj się
2. Zaloguj się ponownie

---

## Struktura uprawnień

### Role użytkowników:

- **ADMIN** - pełny dostęp do wszystkich funkcji (zarządzanie użytkownikami, muzyką, opiniami)
- **EDITOR** - zarządzanie muzyką i opiniami
- **USER** - podstawowe funkcje (przeglądanie, dodawanie opinii)

### Domyślne uprawnienia:

- **ADMIN** ma wszystkie uprawnienia:
  - `users:read`, `users:create`, `users:update`, `users:delete`
  - `music:create`, `music:update`, `music:delete`
  - `reviews:read`, `reviews:create`, `reviews:update`, `reviews:delete`

- **EDITOR** ma uprawnienia:
  - `music:create`, `music:update`, `music:delete`
  - `reviews:read`, `reviews:create`, `reviews:update`, `reviews:delete`

- **USER** ma uprawnienia:
  - `reviews:read`, `reviews:create` (własne opinie)

---

## Funkcjonalności aplikacji

Po zalogowaniu możesz:

1. **Przeglądać bibliotekę muzyczną** (`/music`)
   - Filtrowanie po gatunku, roku
   - Wyszukiwanie po tytule/artyście
   - Sortowanie i paginacja
   - Dodawanie/edycja/usuwanie utworów (dla ADMIN/EDITOR)

2. **Przeglądać opinie** (`/reviews`)
   - Filtrowanie po ocenie
   - Wyszukiwanie w tytułach i komentarzach
   - Dodawanie/edycja/usuwanie opinii

3. **Zarządzać profilem** (`/profile`)
   - Aktualizacja username, email, imienia, nazwiska
   - Zmiana hasła

4. **Zarządzać użytkownikami** (tylko ADMIN)
   - Przez API: `/api/users`

---

## Kontakt i wsparcie

W razie problemów sprawdź:
- Logi Docker: `docker compose logs`
- Logi konkretnego serwisu: `docker compose logs [nazwa_serwisu]`
- Dokumentację API w pliku `README.md`
