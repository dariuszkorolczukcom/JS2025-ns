# JS2025-ns
## Skład grupy:
- Dariusz Korolczuk
- Adrian Mogielnicki
- Bartosz Regucki

## MusicWeb - Filmweb ale do muzyki
### MVP:
- tworzenie adminow
- moliwośc rejestrowania nowych uzytkownikow i logowania
- dodawanie opinii
- dodawanie muzyki do opiniowania
- wyszukiwarka
- ranking
- podglad opinii
- blog (aktualizacje)

---

## Backend API - Node.js + Express

### Instalacja i uruchomienie

1. **Instalacja zależności:**
   ```bash
   npm install
   ```

2. **Uruchomienie serwera:**
   ```bash
   # Tryb produkcyjny
   npm start
   
   # Tryb deweloperski (z auto-reload)
   npm run dev
   ```

3. **Serwer domyślnie działa na porcie 3000:**
   - URL: `http://localhost:3000`
   - API Base URL: `http://localhost:3000/api`

### Struktura projektu

```
JS2025-ns/
├── server.js              # Główny plik serwera
├── package.json           # Konfiguracja npm
├── .gitignore            # Pliki ignorowane przez git
├── routes/               # Definicje routingu
│   ├── index.js
│   ├── users.js
│   ├── music.js
│   └── reviews.js
├── controllers/          # Logika biznesowa
│   ├── userController.js
│   ├── musicController.js
│   └── reviewController.js
└── data/                 # Mock dane (JSON)
    ├── users.json
    ├── music.json
    └── reviews.json
```

### API Endpoints

#### Users API (`/api/users`)

- **GET `/api/users`** - Pobierz wszystkich użytkowników
  - Response: `200 OK` - tablica użytkowników
  
- **GET `/api/users/:id`** - Pobierz użytkownika po ID
  - Response: `200 OK` - obiekt użytkownika
  - Error: `404 Not Found` - użytkownik nie istnieje

- **POST `/api/users`** - Utwórz nowego użytkownika
  - Body (JSON):
    ```json
    {
      "username": "string (required)",
      "email": "string (required)",
      "password": "string (required)",
      "role": "string (optional, default: 'user')"
    }
    ```
  - Response: `201 Created` - utworzony użytkownik
  - Error: `400 Bad Request` - brakuje wymaganych pól
  - Error: `409 Conflict` - użytkownik już istnieje

#### Music API (`/api/music`)

- **GET `/api/music`** - Pobierz wszystkie wpisy muzyczne
  - Response: `200 OK` - tablica wpisów muzycznych

- **GET `/api/music/:id`** - Pobierz wpis muzyczny po ID
  - Response: `200 OK` - obiekt wpisu muzycznego
  - Error: `404 Not Found` - wpis nie istnieje

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

#### Reviews API (`/api/reviews`)

- **GET `/api/reviews`** - Pobierz wszystkie opinie
  - Response: `200 OK` - tablica opinii

- **GET `/api/reviews/:id`** - Pobierz opinię po ID
  - Response: `200 OK` - obiekt opinii
  - Error: `404 Not Found` - opinia nie istnieje

- **POST `/api/reviews`** - Utwórz nową opinię
  - Body (JSON):
    ```json
    {
      "userId": "number (required)",
      "musicId": "number (required)",
      "rating": "number (required, 1-5)",
      "comment": "string (optional)"
    }
    ```
  - Response: `201 Created` - utworzona opinia
  - Error: `400 Bad Request` - brakuje wymaganych pól lub nieprawidłowa ocena
  - Error: `404 Not Found` - użytkownik lub wpis muzyczny nie istnieje

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

### Technologie

- **Node.js** - środowisko uruchomieniowe
- **Express** - framework webowy
- **CORS** - obsługa Cross-Origin Resource Sharing
- **dotenv** - zarządzanie zmiennymi środowiskowymi
- **nodemon** - auto-reload w trybie deweloperskim

### Uwagi

- Dane są przechowywane w plikach JSON (mock data)
- W produkcji hasła powinny być hashowane (obecnie przechowywane jako plain text)
- ID są generowane automatycznie (inkrementalne)
- Wszystkie daty są w formacie ISO 8601