# Autotech - Mechanical Workshop Management System

Management software for a mechanical workshop. Handles employees, clients, vehicles, repair orders, inspections, estimates, invoices, and payments.

## Project Structure

- `frontend/` — React + TypeScript + Material UI (Vite)
- `backend/` — Java 21 + Spring Boot 3 (Maven)

## Getting Started

### Backend
```bash
cd backend
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Email notifications

The backend sends HTML emails (appointments, estimates, repair order milestones, reminders, password recovery).

### Development / demo with Mailpit

```bash
docker compose up -d postgres mailpit
cd backend
./mvnw clean spring-boot:run -Dspring-boot.run.profiles=dev
```

The `dev` profile enables sending (`AUTOTECH_MAIL_ENABLED=true`) to `localhost:1025`. Every email is captured by Mailpit and can be read at http://localhost:8025 — nothing reaches real inboxes.

### Real SMTP

Configure it **only through environment variables** (never commit credentials). See `backend/.env.example` for the full list. Example with Gmail (requires an [app password](https://support.google.com/accounts/answer/185833)):

| Variable | Example |
|---|---|
| `AUTOTECH_MAIL_ENABLED` | `true` |
| `MAIL_HOST` / `MAIL_PORT` | `smtp.gmail.com` / `587` |
| `MAIL_USERNAME` / `MAIL_PASSWORD` | account / app password |
| `MAIL_SMTP_AUTH` / `MAIL_SMTP_STARTTLS` | `true` / `true` |
| `AUTOTECH_MAIL_FROM` | sender address |
| `AUTOTECH_PUBLIC_URL` | URL of the frontend used in email links (default `http://localhost:3000`) |
| `AUTOTECH_WORKSHOP_NAME`, `AUTOTECH_WORKSHOP_ADDRESS`, `AUTOTECH_WORKSHOP_PHONE` | shown in the email footer |
| `AUTOTECH_REMINDERS_CRON` | daily reminders schedule (default `0 0 9 * * *`) |

Reminders, thresholds and a test email are available in **Configuración → Notificaciones**.

