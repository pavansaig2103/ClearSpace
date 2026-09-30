# ClearSpace

ClearSpace is a personal brain inbox for thoughts, tasks, reminders, ideas, follow-ups, and tiny things you do not want to keep holding in your head.

The product philosophy is simple:

> Capture first. Organize second. Think less. Live more.

Unlike a traditional todo app, ClearSpace starts with one low-friction capture box: "What's on your mind?" The user can dump a raw thought, and the app preserves the original text while a deterministic service gently classifies it into useful structure.

## Core Features

- Fast brain-dump capture with Ctrl or Command + Enter.
- Deterministic smart organization for type, category, priority, tags, due dates, due times, and follow-up people.
- Inbox with edit, move, schedule, complete, archive, restore, and delete actions.
- Focused Today page with Must handle, Today, Quick wins, and Done sections.
- Ideas page that treats ideas as possibilities, not overdue tasks.
- Follow Ups page with people, reminders, and completion flow.
- Global debounced search across items, people, tags, archived content, statuses, categories, types, and due-date filters.
- Daily reflection memories with a simple timeline.
- Subtle clear-space moment after meaningful completion or organization.
- JWT authentication, protected routes, user-scoped backend queries, and centralized friendly API errors.

## Architecture

```mermaid
flowchart LR
  User[User] --> Next[Next.js App Router]
  Next --> API[Typed API Client]
  API --> DRF[Django REST Framework]
  DRF --> Services[Service Layer]
  Services --> Parser[Deterministic Thought Parser]
  Services --> DB[(PostgreSQL or SQLite dev)]
  DRF --> Auth[JWT Auth]
  DRF --> Errors[Central Error Handler]
```

## Tech Stack

Frontend:

- Next.js App Router
- TypeScript
- Tailwind CSS
- Framer Motion
- Lucide icons
- React Testing Library and Vitest

Backend:

- Django
- Django REST Framework
- Simple JWT
- PostgreSQL via `DATABASE_URL`
- SQLite fallback for quick local development
- Pytest and pytest-django

## Repository Structure

```text
frontend/
  app/
  components/
  features/
  hooks/
  lib/
  services/
  types/

backend/
  apps/
    core/
    users/
    inbox/
    memories/
    analytics/
    tasks/
    reminders/
  config/
  manage.py
```

## Database Model

Main entities:

- `User`: name, email, timezone, auth fields, timestamps.
- `InboxItem`: raw capture, structured title/description/type/category/priority/status/due fields, completion/archive timestamps, owner, optional person.
- `Tag` and `InboxItemTag`: user-owned tagging with many-to-many item links.
- `Person`: follow-up contacts with relationship, notes, and last-contacted date.
- `Reminder`: scheduled reminders for inbox items.
- `ActivityLog`: meaningful item events such as created, edited, completed, archived, restored, categorized, scheduled, and deleted.
- `Memory`: daily reflection entries.

All primary content queries are scoped by `request.user` on the backend.

## API Overview

Authentication:

- `POST /api/auth/register/`
- `POST /api/auth/login/`
- `POST /api/auth/logout/`
- `POST /api/auth/refresh/`
- `GET /api/auth/me/`

Inbox:

- `GET /api/inbox/`
- `POST /api/inbox/`
- `GET /api/inbox/:id/`
- `PATCH /api/inbox/:id/`
- `DELETE /api/inbox/:id/`
- `POST /api/inbox/:id/complete/`
- `POST /api/inbox/:id/archive/`
- `POST /api/inbox/:id/restore/`
- `POST /api/inbox/:id/schedule/`
- `POST /api/inbox/:id/move/`

Product views:

- `GET /api/summary/`
- `GET /api/today/`
- `GET /api/ideas/`
- `GET /api/follow-ups/`
- `GET /api/search/`
- `GET /api/clear-space-moment/`

People, tags, and memories:

- `GET|POST /api/people/`
- `GET|POST /api/tags/`
- `GET|POST /api/memories/`

Successful responses use:

```json
{ "ok": true, "data": {} }
```

Errors use:

```json
{
  "ok": false,
  "error": {
    "message": "Something went wrong. Please try again.",
    "code": "api_error",
    "details": {}
  }
}
```

## Local Setup

### Backend

```bash
cd backend
python -m venv .venv
.venv/Scripts/activate
pip install -r requirements.txt
copy .env.example .env
python manage.py migrate
python manage.py seed_clearspace
python manage.py runserver
```

For quick local development, leave `DATABASE_URL` commented in `backend/.env` to use SQLite. For PostgreSQL, create a database and set:

```bash
DATABASE_URL=postgres://clearspace:clearspace@localhost:5432/clearspace
```

Seed login:

```text
pavan@clearspace.dev / Clearspace123!
```

### Frontend

```bash
cd frontend
npm install
copy .env.example .env
npm run dev
```

Open `http://localhost:3000`.

## Environment Variables

Backend:

- `DJANGO_SECRET_KEY`
- `DJANGO_DEBUG`
- `DJANGO_ALLOWED_HOSTS`
- `CORS_ALLOWED_ORIGINS`
- `CSRF_TRUSTED_ORIGINS`
- `DATABASE_URL` optional for PostgreSQL

Frontend:

- `NEXT_PUBLIC_API_URL`, defaulting to `http://127.0.0.1:8000/api`

## Testing

Backend:

```bash
cd backend
pytest
```

Frontend:

```bash
cd frontend
npm run test
npm run test:e2e
npm run build
```

`npm run test:e2e` expects the backend and frontend dev servers to be running and saves screenshots under `artifacts/`.

## Future AI Architecture

The current classifier is deterministic and lives in `backend/apps/inbox/services/parser.py`. It preserves `raw_content` and stores structured fields separately, so it can be replaced or augmented later by an AI service.

Good AI extension points:

- Smart classification: raw thought to type, category, priority, tags, dates, and people.
- Daily planning: realistic suggestions based on deadlines and energy.
- Thought summarization: messy notes into concise structured content.
- Natural language search: semantic recall across ideas, notes, people, and memories.
- Daily reflection: gentle summaries generated from the day's activity.

AI should remain an enhancement. ClearSpace is useful without a paid AI API.
