# Aktualizacja uprawnień użytkowników

## Opis

Ten dokument opisuje jak zaktualizować uprawnienia użytkowników w bazie danych.

## Użytkownicy do skonfigurowania

1. **admin@example.com** - ADMIN z pełnymi uprawnieniami
2. **dkorolczuk86@gmail.com** - EDITOR z uprawnieniami do zarządzania muzyką i opiniami

## Metoda 1: Automatyczna (przy pierwszym uruchomieniu)

Skrypt `db/initdb/5_update_user_permissions.sql` jest automatycznie wykonywany przy pierwszym uruchomieniu bazy danych przez Docker.

## Metoda 2: Ręczna aktualizacja (dla istniejącej bazy)

### Opcja A: Przez psql (w kontenerze Docker)

```bash
# Połącz się z kontenerem PostgreSQL
docker compose exec postgres psql -U postgres -d musicweb

# Wykonaj skrypt
\i /docker-entrypoint-initdb.d/5_update_user_permissions.sql
```

### Opcja B: Bezpośrednie wykonanie SQL

```bash
# Skopiuj zawartość pliku 5_update_user_permissions.sql i wykonaj w psql
docker compose exec postgres psql -U postgres -d musicweb -f /docker-entrypoint-initdb.d/5_update_user_permissions.sql
```

### Opcja C: Przez docker exec z plikiem lokalnym

```bash
# Z katalogu compose/dev
cat ../../db/initdb/5_update_user_permissions.sql | docker compose exec -T postgres psql -U postgres -d musicweb
```

## Metoda 3: Przez API (jeśli masz dostęp admin)

Możesz użyć endpointu PUT `/api/users/:id` do aktualizacji roli użytkownika (wymaga uprawnień admin).

## Weryfikacja

Po wykonaniu skryptu możesz sprawdzić uprawnienia:

```sql
-- Sprawdź role użytkowników
SELECT email, username, role FROM users WHERE email IN ('admin@example.com', 'dkorolczuk86@gmail.com');

-- Sprawdź uprawnienia admin@example.com
SELECT up.permission_name 
FROM user_permissions up
JOIN users u ON up.user_id = u.id
WHERE u.email = 'admin@example.com';

-- Sprawdź uprawnienia EDITOR (przez rolę)
SELECT permission_name 
FROM role_permissions 
WHERE role = 'EDITOR';
```

## Dane logowania

### admin@example.com
- **Email:** admin@example.com
- **Hasło:** password
- **Rola:** ADMIN
- **Uprawnienia:** Wszystkie

### dkorolczuk86@gmail.com
- **Email:** dkorolczuk86@gmail.com
- **Hasło:** password (domyślne, jeśli użytkownik został utworzony przez skrypt)
- **Rola:** EDITOR
- **Uprawnienia:** 
  - music:create, music:read, music:update, music:delete
  - reviews:create, reviews:read, reviews:update, reviews:delete
  - users:read
  - artists i genres (pełne zarządzanie)

## Uwagi

- Skrypt jest idempotentny - można go wykonać wielokrotnie bez błędów
- Jeśli użytkownik dkorolczuk86@gmail.com już istnieje, jego rola zostanie zaktualizowana na EDITOR
- Hasło dla dkorolczuk86@gmail.com będzie ustawione na "password" tylko jeśli użytkownik nie istnieje
- Jeśli użytkownik już istnieje, jego hasło pozostanie bez zmian
