# 09 — Checklista zrozumienia

Lista pytań kontrolnych „czy rozumiesz” oraz najważniejsze rzeczy do zapamiętania.

---

## Pytania kontrolne

### Backend

- **Skąd bierze się `req.user`?**  
  Middleware Passport JWT (`isAuthenticated`): po weryfikacji tokenu z nagłówka Authorization callback strategii wykonuje zapytanie `SELECT ... FROM users WHERE id = $1` (id z payload JWT) i wynik ustawia jako `req.user`.

- **Skąd backend wie, jakie użytkownik ma role i uprawnienia?**  
  Role: kolumna `users.role` (ładowana przez Passport do `req.user`). Uprawnienia: przy logowaniu pobierane z `user_permissions` i wstawiane do payloadu JWT; w middleware `checkPermission` — zapytanie do bazy (user_permissions + role_permissions), nie z tokenu. ADMIN omija sprawdzanie uprawnień.

- **Skąd bierze się paginacja (X-Total-Count itd.)?**  
  W kontrolerach `getAllMusic` i `getAllReviews`: najpierw `SELECT COUNT(*)` z tymi samymi warunkami WHERE co lista; na tej podstawie obliczane są totalCount i totalPages. Następnie `res.set('X-Total-Count', ...)`, `res.set('X-Total-Pages', ...)`, `res.set('X-Current-Page', ...)`, `res.set('X-Per-Page', ...)` oraz `Access-Control-Expose-Headers`, żeby przeglądarka mogła je odczytać przy CORS.

- **Które endpointy są publiczne (bez tokenu)?**  
  GET /api/, GET /api/health, POST /api/auth/register, POST /api/auth/login, GET /api/music, GET /api/music/genres, GET /api/music/:id, GET /api/music/:id/reviews. Reszta wymaga Bearer tokena (i ewentualnie permission lub ADMIN).

- **Gdzie jest sprawdzany JWT?**  
  W middleware Passport: `isAuthenticated` = `passport.authenticate('jwt', { session: false })`. Używany na trasach auth (profile, change-password), music (POST/PUT/PATCH/DELETE), reviews (wszystkie oprócz GET przez /music/:id/reviews), users (wszystkie).

### Frontend

- **Gdzie jest przechowywany token i user?**  
  W `localStorage`: klucze `token` i `user` (user jako JSON). Ustawiane po login/register w LoginView/SignUpView; usuwane przy logout (App.vue) i przy odpowiedzi 401 (axios response interceptor).

- **Kiedy axios dodaje Bearer token?**  
  W request interceptorze: dla wszystkich URL **poza** publicznymi (/music, /music/genres, /music/:uuid, /music/:uuid/reviews) — jeśli w localStorage jest token, dodawany jest nagłówek Authorization: Bearer &lt;token&gt;.

- **Kiedy następuje przekierowanie na /login przy 401?**  
  W response interceptorze axios: gdy status === 401 i request **nie** był do publicznego endpointu — czyści localStorage (token, user) i ustawia `window.location.href = '/login'`.

- **Skąd frontend wie o totalCount/totalPages przy liście muzyki?**  
  Serwis musicService.fetchMusic zwraca obiekt z polami totalCount i totalPages; wartości bierze z nagłówków odpowiedzi: `response.headers['x-total-count']`, `response.headers['x-total-pages']`.

- **Kto może wejść na /users?**  
  Tylko użytkownik z rolą ADMIN. Guard w routerze (beforeEach) sprawdza localStorage.user.role === 'ADMIN'; jeśli nie — przekierowanie na / z query error=admin_required.

### Baza danych

- **Co się dzieje przy usunięciu użytkownika?**  
  CASCADE: usuwa wpisy w `user_permissions` i wszystkie wiersze w `reviews` z tym user_id.

- **Co się dzieje przy usunięciu utworu (music)?**  
  CASCADE: usuwa wszystkie opinie (reviews) powiązane z tym music_id.

- **Skąd biorą się uprawnienia dla nowego użytkownika (rejestracja)?**  
  Nowy użytkownik ma rolę USER. Uprawnienia są przypisane do roli w `role_permissions`. Backend przy logowaniu pobiera uprawnienia z `user_permissions` (indywidualne); jeśli brak wpisów, użytkownik i tak ma uprawnienia z roli (sprawdzane w checkPermission przez zapytanie do role_permissions). W 3_admin_user.sql admin dostaje jawne wpisy w user_permissions; zwykły USER — tylko z role_permissions.

### Przepływy

- **Logowanie krok po kroku:**  
  Formularz → authService.login → POST /api/auth/login → backend: SELECT user, bcrypt.compare, SELECT user_permissions, jwt.sign → response { token } → frontend: localStorage.token, getProfile → localStorage.user, redirect.

- **Chronione żądanie (np. POST /api/music):**  
  Serwis wywołuje apiClient.post('/music', ...) → interceptor dodaje Bearer → Nginx /api → backend /music → isAuthenticated (Passport weryfikuje JWT, ładuje user do req.user) → checkPermission('music:create') (ADMIN lub zapytanie do bazy) → kontroler createMusic.

---

## Najważniejsze rzeczy do zapamiętania

1. **Architektura:** Frontend (Vue) + Backend (Express) + PostgreSQL; Nginx jako reverse proxy (jedna domena, /api → backend, / → frontend).
2. **Auth:** JWT w nagłówku Authorization: Bearer; token zawiera user.id, user.role, user.permissions; weryfikacja w Passport; req.user uzupełniany z bazy po id z payloadu.
3. **Autoryzacja:** checkPermission(nazwa) — ADMIN zawsze OK; inni: suma user_permissions + role_permissions w bazie. requireAdmin tylko na /api/users.
4. **Paginacja:** Backend zwraca listę w body i metadane w nagłówkach X-Total-Count, X-Total-Pages, X-Current-Page, X-Per-Page; frontend czyta je w serwisach i przekazuje do widoków.
5. **Publiczne endpointy:** lista i szczegóły muzyki, gatunki, opinie przy utworze — bez tokenu; reszta wymaga logowania i ewentualnie uprawnień.
6. **Frontend:** token i user w localStorage; axios jeden klient z baseURL i interceptorem (token + obsługa 401); router guards: requiresAuth, requiresAdmin, requiresGuest.
7. **Baza:** users, permissions, user_permissions, role_permissions, music (→ genres), reviews (→ users, music); CASCADE przy usuwaniu usera (user_permissions, reviews) i muzyki (reviews).
8. **Uruchomienie:** Docker Compose z compose/dev (.env z JWT_SECRET i POSTGRES_*); backend czyta POSTGRES_NAME (nazwa bazy); przy problemach: 401 → token/JWT_SECRET, 403 → uprawnienia/rola, CORS → cors() w backendzie, initdb → tylko przy pustym volume Postgresa.
