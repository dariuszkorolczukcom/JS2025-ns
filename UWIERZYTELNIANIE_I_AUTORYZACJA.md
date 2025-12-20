# Uwierzytelnianie i Autoryzacja w MusicWeb

## Przegląd

Aplikacja MusicWeb używa **JWT (JSON Web Tokens)** do uwierzytelniania użytkowników oraz systemu **uprawnień opartego na rolach (RBAC)** do autoryzacji.

---

## 1. Uwierzytelnianie (Authentication)

Uwierzytelnianie odpowiada na pytanie: **"Kim jesteś?"**

### Proces logowania

#### Krok 1: Użytkownik wysyła dane logowania

**Frontend** (`LoginView.vue`):
```typescript
const response = await apiClient.post('/auth/login', {
  email: 'admin@example.com',
  password: 'password'
})
```

#### Krok 2: Backend weryfikuje dane

**Backend** (`authController.ts` - `loginUser`):

1. **Sprawdza czy użytkownik istnieje:**
   ```typescript
   const user = await pool.query('SELECT * FROM users WHERE email = $1', [email])
   ```

2. **Weryfikuje hasło używając bcrypt:**
   ```typescript
   const isMatch = await bcrypt.compare(password, user.rows[0].password_hash)
   ```
   - Hasła są przechowywane jako hash (nigdy w formie plaintext)
   - bcrypt porównuje wprowadzone hasło z zahashowanym hasłem w bazie

3. **Pobiera uprawnienia użytkownika:**
   ```typescript
   const permissions = await pool.query(
     'SELECT permission_name FROM user_permissions WHERE user_id = $1', 
     [user.id]
   )
   ```

#### Krok 3: Generowanie tokenu JWT

Jeśli weryfikacja się powiodła, backend generuje token JWT:

```typescript
const payload = {
  user: {
    id: user.rows[0].id,
    role: user.rows[0].role,           // ADMIN, EDITOR, USER
    username: user.rows[0].username,
    permissions: permissions.rows.map(p => p.permission_name)
  }
}

jwt.sign(
  payload,
  process.env.JWT_SECRET,  // Tajny klucz do podpisywania tokenu
  { expiresIn: 3600 },     // Token ważny przez 1 godzinę (3600 sekund)
  (err, token) => {
    res.json({ token })   // Zwraca token do frontendu
  }
)
```

**Struktura tokenu JWT:**
```
Header.Payload.Signature

Payload zawiera:
- user.id
- user.role
- user.username
- user.permissions[]
- exp (czas wygaśnięcia)
- iat (czas utworzenia)
```

#### Krok 4: Frontend zapisuje token

**Frontend** (`LoginView.vue`):
```typescript
const { token } = response.data
localStorage.setItem('token', token)  // Zapisuje token w localStorage

// Pobiera profil użytkownika
const profileResponse = await apiClient.get('/auth/profile')
const user = profileResponse.data
localStorage.setItem('user', JSON.stringify(user))  // Zapisuje dane użytkownika
```

---

## 2. Weryfikacja tokenu przy każdym żądaniu

### Frontend - Automatyczne dodawanie tokenu

**Axios Interceptor** (`axios.ts`):

```typescript
// Request interceptor - dodaje token do każdego żądania
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`  // Dodaje nagłówek
  }
  return config
})
```

**Każde żądanie HTTP zawiera teraz:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Backend - Weryfikacja tokenu

**Passport.js JWT Strategy** (`passport.ts`):

```typescript
passport.use(
  new JwtStrategy({
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),  // Wyciąga token z nagłówka
    secretOrKey: process.env.JWT_SECRET                         // Weryfikuje podpis
  }, async (jwt_payload, done) => {
    // jwt_payload zawiera dane z tokenu (id, role, username, permissions)
    
    // Sprawdza czy użytkownik nadal istnieje w bazie
    const user = await pool.query('SELECT * FROM users WHERE id = $1', [jwt_payload.user.id])
    
    if (user.rows.length > 0) {
      return done(null, user.rows[0])  // Użytkownik zweryfikowany
    }
    return done(null, false)  // Użytkownik nie istnieje
  })
)
```

**Middleware `isAuthenticated`** (`passport.ts`):
```typescript
export const isAuthenticated = passport.authenticate('jwt', { session: false })
```

**Użycie w routingu:**
```typescript
router.get('/profile', isAuthenticated, profileController)
//                      ^^^^^^^^^^^^^^^^
//                      Sprawdza czy użytkownik jest zalogowany
```

Po weryfikacji tokenu, dane użytkownika są dostępne w `req.user`:
```typescript
req.user = {
  id: 'uuid',
  role: 'ADMIN',
  email: 'admin@example.com',
  username: 'admin',
  // ...
}
```

---

## 3. Autoryzacja (Authorization)

Autoryzacja odpowiada na pytanie: **"Czy możesz to zrobić?"**

### System uprawnień (RBAC - Role-Based Access Control)

Aplikacja używa trzech poziomów uprawnień:

1. **Role** (ADMIN, EDITOR, USER)
2. **Uprawnienia** (permissions) - np. `users:read`, `music:create`
3. **Przypisania** - role mają domyślne uprawnienia, użytkownicy mogą mieć dodatkowe

### Struktura w bazie danych

**Tabele:**
- `users` - użytkownicy z rolą
- `permissions` - lista wszystkich uprawnień
- `role_permissions` - przypisanie uprawnień do ról
- `user_permissions` - dodatkowe uprawnienia dla konkretnych użytkowników

**Przykładowe uprawnienia:**
```
users:read      - przeglądanie użytkowników
users:create    - tworzenie użytkowników
users:update    - aktualizacja użytkowników
users:delete    - usuwanie użytkowników
music:create    - dodawanie muzyki
music:update    - edycja muzyki
music:delete    - usuwanie muzyki
reviews:read    - przeglądanie opinii
reviews:create  - dodawanie opinii
reviews:update  - edycja opinii
reviews:delete  - usuwanie opinii
```

### Middleware `checkPermission`

**Backend** (`authMiddleware.ts`):

```typescript
export const checkPermission = (requiredPermission: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // 1. Sprawdza czy użytkownik jest zalogowany
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const userId = req.user.id
    const userRole = req.user.role

    // 2. ADMIN ma dostęp do wszystkiego
    if (userRole === 'ADMIN') {
      return next()  // Pozwala na dostęp
    }

    // 3. Sprawdza uprawnienia użytkownika
    const query = `
      SELECT 1 
      FROM (
        -- Uprawnienia przypisane bezpośrednio do użytkownika
        SELECT permission_name FROM user_permissions WHERE user_id = $1
        UNION
        -- Uprawnienia z roli użytkownika
        SELECT permission_name FROM role_permissions WHERE role = $2::user_role
      ) as combined_permissions
      WHERE permission_name = $3
    `

    const result = await pool.query(query, [userId, userRole, requiredPermission])

    // 4. Jeśli użytkownik ma wymagane uprawnienie, pozwala na dostęp
    if (result.rows.length > 0) {
      return next()
    }

    // 5. Brak uprawnień - zwraca 403 Forbidden
    return res.status(403).json({ error: 'Forbidden: Insufficient permissions' })
  }
}
```

### Użycie w routingu

**Przykład** (`reviews.ts`):
```typescript
// Wymaga zalogowania + uprawnienia reviews:read
router.get('/', 
  isAuthenticated,                    // 1. Sprawdza czy zalogowany
  checkPermission('reviews:read'),    // 2. Sprawdza uprawnienia
  reviewController.getAllReviews
)

// Wymaga zalogowania + uprawnienia reviews:create
router.post('/', 
  isAuthenticated,
  checkPermission('reviews:create'),
  reviewController.createReview
)
```

---

## 4. Przepływ żądania chronionego

### Przykład: Pobranie listy opinii

```
1. Frontend: GET /api/reviews
   ↓
2. Axios Interceptor dodaje: Authorization: Bearer <token>
   ↓
3. Backend: router.get('/reviews', ...)
   ↓
4. Middleware: isAuthenticated
   - Wyciąga token z nagłówka
   - Weryfikuje podpis JWT
   - Sprawdza czy użytkownik istnieje
   - Ustawia req.user
   ↓
5. Middleware: checkPermission('reviews:read')
   - Sprawdza czy req.user istnieje
   - Jeśli ADMIN → pozwala
   - Jeśli nie ADMIN → sprawdza uprawnienia w bazie
   ↓
6. Controller: getAllReviews
   - Ma dostęp do req.user
   - Zwraca dane
   ↓
7. Frontend: Otrzymuje odpowiedź
```

---

## 5. Obsługa błędów

### Frontend (`axios.ts`)

```typescript
// Response interceptor - obsługuje błędy 401
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token wygasł lub jest nieprawidłowy
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'  // Przekierowanie do logowania
    }
    return Promise.reject(error)
  }
)
```

### Backend - Kody odpowiedzi

- **200 OK** - Sukces
- **401 Unauthorized** - Brak tokenu lub nieprawidłowy token
- **403 Forbidden** - Token prawidłowy, ale brak uprawnień
- **500 Internal Server Error** - Błąd serwera

---

## 6. Bezpieczeństwo

### Hashowanie haseł

**Przy rejestracji** (`authController.ts`):
```typescript
const salt = await bcrypt.genSalt(10)  // Generuje sól
const passwordHash = await bcrypt.hash(password, salt)
// Zapisuje passwordHash w bazie (nigdy plaintext!)
```

**Przy logowaniu**:
```typescript
const isMatch = await bcrypt.compare(password, user.password_hash)
// Porównuje wprowadzone hasło z hashem w bazie
```

### JWT Security

1. **Tajny klucz** (`JWT_SECRET`) - przechowywany w zmiennych środowiskowych
2. **Czas wygaśnięcia** - token ważny przez 1 godzinę (3600 sekund)
3. **Podpis cyfrowy** - token jest podpisany, nie można go sfałszować
4. **HTTPS w produkcji** - tokeny przesyłane tylko przez szyfrowane połączenie

### Best Practices

✅ **DO:**
- Przechowywać token w `localStorage` (dla SPA)
- Weryfikować token przy każdym żądaniu
- Sprawdzać uprawnienia w bazie danych (nie tylko w tokenie)
- Używać HTTPS w produkcji
- Hashować hasła z solą

❌ **DON'T:**
- Przechowywać hasła w plaintext
- Ufać tylko danym z tokenu (zawsze weryfikuj w bazie)
- Długie czasy wygaśnięcia tokenów
- Przesyłać tokenów w URL (tylko w nagłówkach)

---

## 7. Role i domyślne uprawnienia

### ADMIN
- Ma **wszystkie** uprawnienia
- Może zarządzać użytkownikami, muzyką, opiniami
- Pomija sprawdzanie uprawnień w `checkPermission`

### EDITOR
- `music:create`, `music:update`, `music:delete`
- `reviews:read`, `reviews:create`, `reviews:update`, `reviews:delete`

### USER
- `reviews:read`, `reviews:create` (tylko własne opinie)

---

## 8. Przykłady użycia

### Logowanie

```typescript
// Frontend
const response = await apiClient.post('/auth/login', {
  email: 'user@example.com',
  password: 'password123'
})
const { token } = response.data
localStorage.setItem('token', token)
```

### Chronione żądanie

```typescript
// Frontend - automatycznie dodaje token
const reviews = await apiClient.get('/reviews')
```

### Aktualizacja profilu (wymaga autoryzacji)

```typescript
// Backend route
router.put('/auth/profile', 
  isAuthenticated,  // Wymaga zalogowania
  updateProfile     // Używa req.user.id (nie wymaga dodatkowych uprawnień)
)
```

### Zarządzanie użytkownikami (wymaga uprawnień)

```typescript
// Backend route
router.get('/users',
  isAuthenticated,
  checkPermission('users:read'),  // Tylko użytkownicy z tym uprawnieniem
  getAllUsers
)
```

---

## Podsumowanie

1. **Uwierzytelnianie** = "Kim jesteś?" → JWT Token
2. **Autoryzacja** = "Czy możesz to zrobić?" → System uprawnień (RBAC)
3. **Token JWT** zawiera: id, role, username, permissions
4. **Każde żądanie** zawiera token w nagłówku `Authorization: Bearer <token>`
5. **Backend weryfikuje** token i sprawdza uprawnienia przed wykonaniem akcji
6. **ADMIN** ma dostęp do wszystkiego, inne role mają ograniczone uprawnienia
