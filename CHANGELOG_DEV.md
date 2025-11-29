# CHANGELOG_DEV.md

## Zmiany wprowadzone w projekcie MusicWeb

### Backend

#### 1. Seed danych muzycznych
- **Plik:** `db/initdb/4_seed_music.sql`
- **Opis:** Dodano skrypt SQL z przykładowymi danymi muzycznymi (20 utworów z różnych gatunków i lat)
- **Uruchomienie:** Automatycznie przy inicjalizacji bazy danych przez Docker

#### 2. Healthcheck endpoint
- **Plik:** `backend/src/controllers/commonController.ts`
- **Endpoint:** `GET /api/health`
- **Opis:** Endpoint sprawdzający status aplikacji i połączenia z bazą danych
- **Odpowiedź:**
  ```json
  {
    "status": "ok",
    "timestamp": "2025-01-XX...",
    "database": {
      "status": "connected",
      "responseTime": "ok"
    },
    "uptime": 123.45
  }
  ```

#### 3. Poprawki w kontrolerach
- **Plik:** `backend/src/controllers/commonController.ts`
- **Zmiana:** Poprawiono sprawdzanie uprawnień użytkownika (dodano sprawdzenie czy `permissions` istnieje)

### Frontend

#### 1. Konfiguracja Axios z interceptorem JWT
- **Plik:** `frontend/src/config/axios.ts`
- **Opis:** 
  - Utworzono centralną konfigurację axios z baseURL
  - Dodano request interceptor automatycznie dodający token JWT do wszystkich żądań
  - Dodano response interceptor obsługujący błędy 401 (przekierowanie do logowania)
- **Użycie:** Wszystkie komponenty używają `apiClient` zamiast bezpośrednio `axios`

#### 2. Route guards
- **Plik:** `frontend/src/router/index.ts`
- **Zmiany:**
  - Dodano `meta: { requiresAuth: true }` dla trasy `/music`
  - Dodano `meta: { requiresGuest: true }` dla trasy `/login`
  - Rozbudowano logikę `beforeEach` o sprawdzanie uprawnień
  - Dodano przekierowanie z parametrem `redirect` dla niezalogowanych użytkowników

#### 3. Rozbudowa HomeView
- **Plik:** `frontend/src/views/HomeView.vue`
- **Dodano:**
  - Sekcję hero z opisem aplikacji i CTA
  - Sekcję "Ostatnio dodane utwory" (pobiera 6 ostatnich utworów z API)
  - Sekcję "Funkcje" z opisem możliwości aplikacji
  - Obsługę stanów: loading, error, empty
  - Responsywny grid layout dla kart muzycznych

#### 4. Rozbudowa AboutView
- **Plik:** `frontend/src/views/AboutView.vue`
- **Dodano:**
  - Opis projektu
  - Sekcję autorów (Dariusz Korolczuk, Adrian Mogielnicki, Bartosz Regucki)
  - Sekcję technologii (Frontend, Backend, Infrastruktura)
  - Sekcję funkcjonalności aplikacji
  - Responsywny layout z kartami

#### 5. Rozbudowa MusicListView
- **Plik:** `frontend/src/views/MusicListView.vue`
- **Dodano:**
  - **Wyszukiwanie i filtrowanie:**
    - Wyszukiwanie tekstowe po tytule i artyście
    - Dropdown z gatunkami (dynamicznie generowany z istniejących danych)
    - Przycisk czyszczenia filtrów
  - **Formularz dodawania/edycji:**
    - Modal z formularzem
    - Walidacja pól (tytuł, artysta wymagane; rok w zakresie 1900-aktualny+1)
    - Obsługa błędów walidacji
    - Datalist z dostępnymi gatunkami
  - **Funkcje admina:**
    - Przyciski "Edytuj" i "Usuń" widoczne tylko dla ADMIN/EDITOR
    - Potwierdzenie przed usunięciem (confirm dialog)
    - Sprawdzanie uprawnień użytkownika
  - **Ulepszona tabela:**
    - Kolumna "Akcje" dla adminów
    - Lepsze formatowanie dat
    - Responsywny design

### Ulepszenia UX/UI

1. **Spójność stylu:** Wszystkie nowe komponenty używają tego samego brutalistycznego stylu (bez zaokrągleń, uppercase, border-based)
2. **Obsługa błędów:** Wszystkie komponenty mają stany loading, error i empty
3. **Responsywność:** Wszystkie widoki są responsywne i działają na różnych rozdzielczościach
4. **Dostępność:** Dodano odpowiednie etykiety, komunikaty błędów i feedback dla użytkownika

### Bezpieczeństwo

1. **Autoryzacja:** Wszystkie operacje wymagające uprawnień są chronione przez route guards i sprawdzanie roli użytkownika
2. **JWT:** Token jest automatycznie dodawany do wszystkich żądań przez interceptor
3. **Walidacja:** Walidacja danych zarówno po stronie frontendu jak i backendu

---

## Run (dev with Docker)

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
   JWT_SECRET=your-secret-key-here
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

### Struktura bazy danych

Baza danych jest automatycznie inicjalizowana przy pierwszym uruchomieniu przez skrypty SQL w `db/initdb/`:
1. `1_create_schema.sql` - tworzenie tabel
2. `2_permissions.sql` - dodanie uprawnień
3. `3_admin_user.sql` - utworzenie użytkownika admin
4. `4_seed_music.sql` - seed danych muzycznych (20 utworów)

### Zatrzymanie

```bash
docker compose down
```

### Logi

```bash
docker compose logs -f [service_name]
```

Gdzie `[service_name]` to: `frontend`, `backend`, `postgres`, `nginx`

