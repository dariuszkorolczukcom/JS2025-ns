# 07 — Frontend: serwisy i utilsy

## Serwisy API

Wszystkie serwisy używają `apiClient` z `config/axios.ts` (baseURL `http://localhost/api`, interceptory token/401).

---

### authService — `frontend/src/services/authService.ts`

**Metody:**

| Metoda | Endpoint | Payload / params | Zwraca | Uwagi |
|--------|----------|------------------|--------|--------|
| **login(data)** | POST /auth/login | LoginData: email, password | Promise&lt;LoginResponse&gt; (token, user?) | response.data |
| **register(data)** | POST /auth/register | RegisterData: username, email, password, first_name?, last_name? | Promise&lt;LoginResponse&gt; (token, user?) | response.data |
| **getProfile()** | GET /auth/profile | — | Promise&lt;UserProfile&gt; | Bearer z interceptor. UserProfile: id, email, username, first_name, last_name, role, permissions? |
| **updateProfile(data)** | PUT /auth/profile | ProfileUpdateData: username?, email?, first_name?, last_name? | Promise&lt;UserProfile&gt; | Bearer |
| **changePassword(data)** | POST /auth/change-password | ChangePasswordData: oldPassword, newPassword | Promise&lt;void&gt; | Bearer |
| **requestPasswordReset(email)** | POST /auth/request-password-reset | { email } | Promise&lt;{ message: string }&gt; | Endpoint może nie być zaimplementowany w backendzie |

**Interfejsy:** LoginData, RegisterData, LoginResponse, UserProfile, ProfileUpdateData, ChangePasswordData — eksportowane, używane w widokach i walidatorach.

---

### musicService — `frontend/src/services/musicService.ts`

**Metody:**

| Metoda | Endpoint | Payload / params | Zwraca | Nagłówki paginacji |
|--------|----------|------------------|--------|--------------------|
| **fetchMusic(params?)** | GET /music | MusicParams: page?, limit?, sortBy?, sortOrder?, search?, genre?, year? | Promise&lt;MusicResponse&gt;: { data: Music[], totalCount, totalPages } | totalCount z response.headers['x-total-count'], totalPages z response.headers['x-total-pages'] |
| **fetchGenres()** | GET /music/genres | — | Promise&lt;Genre[]&gt; | — |
| **fetchMusicById(id)** | GET /music/:id | id w URL | Promise&lt;Music&gt; | — |
| **createMusic(data)** | POST /music | MusicFormData: title, artist, album, year, genre, youtube_url? | Promise&lt;Music&gt; | Bearer + music:create |
| **updateMusic(id, data)** | PUT /music/:id | MusicFormData | Promise&lt;Music&gt; | Bearer + music:update |
| **deleteMusic(id)** | DELETE /music/:id | — | Promise&lt;void&gt; | Bearer + music:delete |

**Mapowanie danych:** Payload do create/update: title/artist/album/genre trim; album/year/genre/youtube_url mogą być null. Music ma pola: id, title, artist, album, year, genre, lyrics?, youtube_url, created_at (string).

---

### reviewsService — `frontend/src/services/reviewsService.ts`

**Metody:**

| Metoda | Endpoint | Payload / params | Zwraca | Nagłówki paginacji |
|--------|----------|------------------|--------|--------------------|
| **fetchReviews(params?)** | GET /reviews | ReviewParams: page?, limit?, sortBy?, sortOrder?, search?, minRating?, maxRating? | Promise&lt;ReviewResponse&gt;: { data: Review[], totalCount, totalPages } | totalCount, totalPages z headers x-total-count, x-total-pages |
| **createReview(data)** | POST /reviews | ReviewFormData: rating, title, comment, musicId? | Promise&lt;Review&gt; | Bearer; musicId w body |
| **updateReview(id, data)** | PUT /reviews/:id | rating?, title?, comment? (trim, null dla pustych) | Promise&lt;Review&gt; | Bearer + reviews:update |
| **deleteReview(id)** | DELETE /reviews/:id | — | Promise&lt;void&gt; | Bearer + reviews:delete |
| **fetchReviewsByMusicId(musicId)** | GET /music/:musicId/reviews | musicId w URL | Promise&lt;ReviewsByMusicResponse&gt;: { reviews, averageRating, reviewCount } | Publiczny endpoint (bez Bearer) |

**Mapowanie:** createReview — payload z musicId (jeśli podane), title/comment trim lub null. Review: id, user_id, music_id, rating, title, comment, created_at, updated_at, username? (z backendu dla listy przy utworze).

---

### usersService — `frontend/src/services/usersService.ts`

**Metody:**

| Metoda | Endpoint | Payload / params | Zwraca | Uwagi |
|--------|----------|------------------|--------|--------|
| **fetchUsers()** | GET /users | — | Promise&lt;User[]&gt; | Bearer + requireAdmin |
| **createUser(data)** | POST /users | UserFormData: username, email, password?, first_name, last_name, role | Promise&lt;User&gt; | password opcjonalnie w payload |
| **updateUser(id, data)** | PUT /users/:id | UserFormData (bez password) | Promise&lt;User&gt; | Bearer + requireAdmin |
| **deleteUser(id)** | DELETE /users/:id | — | Promise&lt;void&gt; | Bearer + requireAdmin |

**Mapowanie:** Payload: username/email/first_name/last_name trim; first_name/last_name null jeśli puste; role przekazywane; password tylko przy createUser jeśli podane.

---

## Utilsy

### userUtils — `frontend/src/utils/userUtils.ts`

**Po co:** Odczyt użytkownika z localStorage i pomocnicze funkcje dla ról/UI.

**Funkcje:**

| Funkcja | Opis |
|---------|------|
| **getUserFromStorage()** | Odczyt `localStorage.getItem('user')`, `JSON.parse`; przy błędzie zwraca null. Zwraca typ User (id?, role?). |
| **isAdmin(user)** | Zwraca `user?.role === 'ADMIN' \|\| user?.role === 'EDITOR'`. Używane do pokazywania/ukrywania elementów (np. zarządzanie muzyką). |
| **getCurrentUserId()** | Zwraca user?.id z getUserFromStorage() lub null. |
| **getRoleBadgeClass(role)** | Zwraca klasę Bootstrap badge: ADMIN → 'badge-danger', EDITOR → 'badge-warning', USER → 'badge-secondary'. |

**Użycie:** Widoki (np. MusicListView, UsersView) — warunkowe renderowanie przycisków/trasy; Navbar — linki w zależności od roli.

---

### dateUtils — `frontend/src/utils/dateUtils.ts`

**Po co:** Formatowanie dat do wyświetlania (locale pl-PL).

**Funkcja:** **formatDate(dateString, includeTime?)** — zwraca sformatowaną datę (rok, miesiąc, dzień; opcjonalnie godzina:minuta). Opcje Intl: year, month 2-digit, day 2-digit; przy includeTime: hour, minute. Dla pustego stringa zwraca '-'.

**Użycie:** Wyświetlanie created_at, updated_at w listach (muzyka, opinie, użytkownicy).

---

### debounce — `frontend/src/utils/debounce.ts`

**Po co:** Ograniczenie częstotliwości wywołań (np. wyszukiwanie przy wpisywaniu).

**Funkcja:** **debounce&lt;T&gt;(func, wait)** — zwraca funkcję, która wywołuje `func` z opóźnieniem `wait` ms; przy kolejnym wywołaniu przed upływem czasu resetuje timer. Typ: `T extends (...args: any[]) => any`, zwraca `(...args: Parameters&lt;T&gt;) => void`.

**Użycie:** W widokach z polem wyszukiwania (np. MusicListView) — debounce(fetchMusic, 300) przy zmianie search, żeby nie wysyłać requestu przy każdym znaku.

---

## Walidatory — `frontend/src/validators/`

**Rola:** Walidacja formularzy po stronie frontendu przed wysłaniem żądania. Używane w widokach (LoginView, SignUpView, MusicListView, ProfileView, ReviewsView, UsersView).

| Plik | Zawartość (skrót) |
|------|-------------------|
| **authValidators.ts** | validateLoginForm (email, password), typ LoginFormErrors; walidacja rejestracji (email, username, password, długość). |
| **musicValidators.ts** | Walidacja formularza muzyki (title, artist, year, genre). |
| **reviewValidators.ts** | Walidacja opinii (rating 1–5, title, comment). |
| **userValidators.ts** | Walidacja danych użytkownika (username, email, first_name, last_name, role). |

Walidatory zwracają obiekt błędów (pole → komunikat); jeśli brak błędów, formularz jest wysyłany do API.
