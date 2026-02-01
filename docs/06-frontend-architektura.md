# 06 — Frontend: architektura

## main.ts — punkt wejścia

**Po co:** Inicjalizacja aplikacji Vue i montowanie do DOM.

**Kluczowe elementy:**

- Import stylów: `bootstrap/dist/css/bootstrap.min.css`, `bootstrap/dist/js/bootstrap.bundle.min.js`, `./assets/themes.css`, `./assets/main.css`.
- `createApp(App)` — główny komponent `App.vue`.
- `app.use(router)` — Vue Router (createWebHistory, trasy z `router/index.ts`).
- `app.mount('#app')` — montowanie do `index.html` (#app).

Bez tego pliku aplikacja się nie uruchomi.

---

## App.vue — główny layout

**Po co:** Wspólny layout (Navbar, router-view, Footer) i stan logowania w całej aplikacji.

**Kluczowe elementy:**

- **Template:** `<Navbar :isLoggedIn="isLoggedIn" @logout="logout" />`, `<main><router-view /></main>`, `<Footer />`.
- **data:** `isLoggedIn: false`, `user: null`.
- **checkLoginStatus():** Odczyt `localStorage.getItem('token')` i `localStorage.getItem('user')`. Jeśli oba istnieją → `isLoggedIn = true`, `user = JSON.parse(user)`. W przeciwnym razie → false / null.
- **logout():** `localStorage.removeItem('token')`, `localStorage.removeItem('user')`, `isLoggedIn = false`, `user = null`, `this.$router.push('/')`.
- **mounted:** wywołanie `checkLoginStatus()`.
- **watch:** na `$route` — przy każdej zmianie trasy wywołanie `checkLoginStatus()` (żeby Navbar odświeżył stan po logowaniu/wylogowaniu).

**Połączenie:** Navbar dostaje `isLoggedIn` i reaguje na `logout`. Widoki renderują się w `<router-view />`.

---

## Konfiguracja Axios — `frontend/src/config/axios.ts`

**Po co:** Jedna instancja HTTP do API z automatycznym dodawaniem tokenu i obsługą 401.

**Kluczowe elementy:**

- **Instancja:** `axios.create({ baseURL: 'http://localhost/api', headers: { 'Content-Type': 'application/json' } })`. Eksport: `apiClient`.
- **Request interceptor:** Przed wysłaniem żądania sprawdza, czy URL to publiczny endpoint. Publiczne: `/music` (dokładnie), `/music/genres`, `/music/<uuid>`, `/music/<uuid>/reviews` (UUID: 36 znaków, wzorzec 8-4-4-4-12). Dla **nie**-publicznych: odczyt `localStorage.getItem('token')` i ustawienie `config.headers.Authorization = 'Bearer ' + token` (jeśli token istnieje).
- **Response interceptor:** Przy błędzie (error.response?.status === 401) sprawdza, czy request był do publicznego endpointu. Jeśli **nie** — `localStorage.removeItem('token')`, `localStorage.removeItem('user')`, `window.location.href = '/login'` (przekierowanie na login). Dla publicznych — tylko `Promise.reject(error)` (bez przekierowania).

**Połączenie:** Wszystkie serwisy (authService, musicService, reviewsService, usersService) używają `apiClient` z tego pliku.

---

## Router — `frontend/src/router/index.ts`

**Po co:** Definicja tras i kontrola dostępu (guards).

**Trasy:**

| path | name | component | meta |
|------|------|-----------|------|
| / | home | HomeView | — |
| /about | about | AboutView | — |
| /login | Login | LoginView | requiresGuest: true |
| /signup | SignUp | SignUpView | requiresGuest: true |
| /forgot-password | ForgotPassword | ForgotPasswordView | requiresGuest: true |
| /music | music | MusicListView | requiresAuth: true |
| /music/:id | music-details | MusicDetailsView | — |
| /profile | profile | ProfileView | requiresAuth: true |
| /users | users | UsersView | requiresAuth: true, requiresAdmin: true |

**beforeEach:**

1. **requiresAuth && !isLoggedIn:** `next({ path: '/login', query: { redirect: to.fullPath } })`, return. Stan logowania: `!!localStorage.getItem('token')`.
2. **(to.path === '/users' || to.meta.requiresAdmin) && isLoggedIn:** Odczyt `localStorage.getItem('user')`, parsowanie JSON. Jeśli `user?.role !== 'ADMIN'` → `next({ path: '/', query: { error: 'admin_required' } })`, return. Jeśli brak usera w storage lub błąd parsowania → `next({ path: '/login' })`, return. Jeśli ADMIN — nie wywołuje się `next()` w tym bloku; wykonanie przechodzi dalej.
3. **requiresGuest && !isLoggedIn:** `next()` — zezwól (np. login, signup).
4. **isLoggedIn && guestRoutes.includes(to.path):** `next({ path: '/' })` — zalogowani nie wchodzą na /login, /signup, /forgot-password.
5. W pozostałych przypadkach: `next()`.

**Uwaga:** Warunek w punkcie 2 ma gałąź `else { next({ path: '/login' }); return }`. Gdy trasa **nie** jest /users i **nie** ma requiresAdmin (np. /music), warunek `(to.path === '/users' || to.meta.requiresAdmin) && isLoggedIn` jest false, więc wykonywana jest gałąź else i następuje przekierowanie do /login. To powoduje, że zalogowany użytkownik na /music może być przekierowany do logowania — w razie problemów warto sprawdzić logikę guarda (np. admin check tylko gdy `to.path === '/users'`).

---

## Widoki — co renderują i jak łączą się z API

| Widok | Opis | API / serwisy |
|-------|------|----------------|
| **HomeView** | Strona główna: ostatnio dodane utwory, sekcja funkcji. | Prawdopodobnie musicService (fetchMusic) lub dane statyczne. |
| **AboutView** | O aplikacji, zespół, technologie. | Bez API. |
| **LoginView** | Formularz: email, hasło. Walidacja (authValidators.validateLoginForm). Submit → authService.login → zapis token + getProfile → zapis user w localStorage → redirect (query.redirect lub '/'). Błąd → serverError, usunięcie token/user. Link do SignUp, Forgot password. | authService.login, authService.getProfile. |
| **SignUpView** | Rejestracja: username, email, password, first_name, last_name. authService.register → token + user → localStorage, redirect. | authService.register. |
| **ForgotPasswordView** | Reset hasła (np. prompt email, authService.requestPasswordReset). | authService.requestPasswordReset (endpoint może nie być zaimplementowany w backendzie). |
| **MusicListView** | Lista utworów: wyszukiwanie, filtry (genre, year), sortowanie, paginacja. Dla ADMIN/EDITOR: formularz dodawania/edycji, usuwanie. | musicService.fetchMusic (params: page, limit, sortBy, sortOrder, search, genre, year), musicService.fetchGenres, musicService.createMusic, updateMusic, deleteMusic. Nagłówki X-Total-Count, X-Total-Pages z response. |
| **MusicDetailsView** | Szczegóły utworu (tytuł, artysta, album, rok, gatunek, link YouTube). Lista opinii dla utworu + średnia ocena. Formularz dodawania opinii (rating, title, comment). | musicService.fetchMusicById(id), reviewsService.fetchReviewsByMusicId(musicId), reviewsService.createReview. |
| **ProfileView** | Profil użytkownika: edycja username, email, first_name, last_name; zmiana hasła. | authService.getProfile, updateProfile, changePassword. |
| **UsersView** | Lista użytkowników (tylko ADMIN): tabela, dodawanie/edycja/usuwanie. | usersService.fetchUsers, createUser, updateUser, deleteUser. |
| **ReviewsView** | Widok istnieje w projekcie (ReviewsView.vue), ale w routerze nie ma trasy /reviews — może być używany wewnętrznie lub trasa może być dodana. | reviewsService (fetchReviews z params, create/update/delete). |

**Przechowywanie tokena i usera:** Token w `localStorage.getItem('token')`, user w `localStorage.getItem('user')` (JSON). Ustawiane po login/register w LoginView/SignUpView; usuwane przy logout (App.vue) i przy 401 (axios response interceptor).

---

## Komponenty

| Komponent | Rola |
|-----------|------|
| **Navbar.vue** | Nawigacja: linki w zależności od isLoggedIn (np. Login/SignUp vs Profile/Music/Users). Przycisk wylogowania (emit logout). |
| **Footer.vue** | Stopka aplikacji. |
| **StarRating.vue** | Ocena gwiazdkowa (1–5); używany w formularzach opinii. |
| **WalkmanLogo.vue** | Logo aplikacji. |

---

## Przepływ danych (skrót)

- Użytkownik wchodzi na trasę → router beforeEach (auth/admin/guest) → komponent ładuje dane przez serwis (apiClient) → request interceptor dodaje Bearer (jeśli nie publiczny) → backend zwraca JSON (+ nagłówki) → serwis zwraca dane do widoku → template renderuje.
- Logowanie: LoginView → authService.login → token w localStorage → getProfile → user w localStorage → redirect → App.checkLoginStatus() → isLoggedIn = true, Navbar się odświeża.
