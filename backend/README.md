# My First Home Interiors API

NestJS + Prisma + PostgreSQL backend for the existing Vite frontend.

## Structure

- `src/main.ts` — security middleware, CORS, validation and server bootstrap.
- `src/auth.ts` — JWT session authentication and role guard primitives.
- `src/auth.controller.ts` — customer registration/login/logout/session inspection.
- `src/projects.controller.ts` — published project listing and detail APIs.
- `src/enquiries.controller.ts` — validated enquiry persistence.
- `src/uploads.*` — authenticated private R2-compatible room uploads.
- `prisma/schema.prisma` — relational data model and indexes.

## Setup

1. Create a PostgreSQL database.
2. Copy `.env.example` to `.env` and provide real secrets and R2 credentials.
3. Install dependencies: `npm install`.
4. Generate Prisma client: `npm run prisma:generate`.
5. Create a development migration: `npm run prisma:migrate -- --name init`.
6. Create/apply the migration against the configured development database: `npm run prisma:migrate -- --name init`.
7. Seed the catalogue: `npm run prisma:seed`.
8. Start the API: `npm run start:dev`.

The API is served under `/api` and defaults to port `4000`.

## API surface

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh` (refresh token)
- `POST /api/auth/logout` (Bearer token)
- `POST /api/auth/me` (Bearer token)
- `GET /api/projects`
- `GET /api/projects/:id`
- `POST /api/enquiries`
- `GET|PATCH /api/admin/workflows/enquiries` and `/api/admin/workflows/enquiries/:id`
- `PATCH /api/admin/workflows/enquiries/:id/assign/:adminId`
- `POST /api/bookings`, `GET /api/bookings/mine`
- `GET /api/bookings` and `PATCH /api/bookings/:id/status` (ADMIN)
- `PATCH /api/bookings/:id/reschedule` (ADMIN)
- `POST /api/uploads/room` (Bearer token, multipart field `file`, required `consentAt`)
- `GET /api/catalogue/categories`
- `GET /api/catalogue/products`
- `GET /api/admin/overview` (ADMIN)
- `GET|POST /api/admin/projects` and `PATCH /api/admin/projects/:id` (ADMIN)
- `GET|POST /api/admin/catalogue` and `PATCH /api/admin/catalogue/:id` (ADMIN)
- `GET|POST /api/admin/knowledge` and `GET /api/admin/audit-logs` (ADMIN)
- `POST /api/uploads/admin` (ADMIN, multipart `file`, `entity`, `entityId`)

Project, catalogue, booking, and customer APIs should be expanded from the same Prisma models as the corresponding frontend flows are connected. No endpoint returns a fabricated persistence success: writes go through Prisma and surface database/storage failures.

Run `npm run prisma:seed` after migration to create the requested catalogue taxonomy and one clearly labelled `SAMPLE — Owner verification required` draft. It has no invented price or company claim and must be replaced before publication.

## Security notes

- Passwords are hashed with bcrypt.
- Tokens include a server-side session ID; logout revokes that session in PostgreSQL.
- Role and ownership are resolved from the authenticated database user, not request body identifiers.
- Global DTO validation rejects unknown fields.
- Helmet, CORS allowlisting, and throttling are enabled.
- Room media is written to a private R2 bucket under a user-scoped key. Public URLs are intentionally not returned.
- Access tokens are bound to hashed database sessions; refresh tokens are rotated and revoked on use.
- Booking confirmation/rescheduling runs at serializable transaction isolation and rechecks confirmed slots.
- Configure a real content-signature scanner before accepting untrusted production uploads; the current boundary validates declared MIME, size and authenticated ownership but does not yet inspect magic bytes.
