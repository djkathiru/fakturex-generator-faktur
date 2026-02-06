# Fakturex Backend

Minimalny backend REST z SQLite do uruchomienia lokalnie lub na serwerze.

## Start
1. Skopiuj `.env.example` do `.env` i ustaw wartości.
2. Zainstaluj zależności:
   - `npm install`
3. Uruchom:
   - `npm run dev`

## Deploy (Render)
1. Wypchnij repo na GitHuba.
2. W Render wybierz "New" → "Blueprint" i wskaż repo.
3. Ustaw zmienne środowiskowe:
   - `JWT_SECRET`
   - `CORS_ORIGIN` (np. adres frontendu)
4. Render zbuduje i uruchomi backend automatycznie po każdym pushu.

## Endpointy
- `POST /auth/login`
- `GET /auth/me`
- `GET /users`, `POST /users`, `PUT /users/:id`, `DELETE /users/:id`
- `GET /settings`, `PUT /settings`
- CRUD: `/documents`, `/contacts`, `/inventory`, `/warehouses`, `/price-lists`, `/sales-orders`, `/purchase-orders`, `/returns`, `/reservations`, `/picking`, `/payments`
- Bulk sync (GET/PUT): `/documents/bulk`, `/contacts/bulk`, `/inventory/bulk`, `/warehouses/bulk`, `/price-lists/bulk`, `/sales-orders/bulk`, `/purchase-orders/bulk`, `/returns/bulk`, `/reservations/bulk`, `/picking/bulk`

## Dane startowe
Tworzone są konta demo: admin, księgowy, magazynier, sprzedaż.

## Uwaga
To baza pod dalszy rozwój. Można bezpiecznie rozszerzać o role/ACL, webhooki i integracje.
