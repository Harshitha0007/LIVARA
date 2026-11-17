# LIVARA – Community Welfare & Animal Rescue Platform

A beginner-friendly full-stack MVP built with React (Vite), Django REST Framework and SQLite.

## What works in this version

- Citizen, volunteer and NGO registration/login (JWT authentication)
- Citizens can create assistance reports with category, description, address, GPS coordinates and optional photo
- Browse and filter reports
- Volunteers/NGOs can accept open reports and update progress
- Citizens can see the status and assigned responder for their reports
- Dashboard counts
- Django admin for managing users, profiles and reports
- Basic map view using Leaflet + OpenStreetMap
- Role-aware frontend navigation

## Important real-world limitations

This is a working software MVP, not an emergency dispatch service. It does not guarantee that an NGO or responder is available. A report is only considered accepted after a registered volunteer/NGO explicitly accepts it. Do not use it as a replacement for emergency services. Before a public launch, add verified NGO onboarding, moderation, privacy review, secure deployment, backups, rate limiting, audit logs and real notification integrations.

The NGO role is unverified by default. An administrator must verify an NGO in Django admin before it can accept reports.

## Requirements

- Python 3.10 or newer
- Node.js 20 LTS or newer
- npm
- VS Code (recommended)

## Project structure

```text
LIVARA/
├── backend/
│   ├── config/
│   ├── core/
│   ├── media/
│   ├── manage.py
│   └── requirements.txt
└── frontend/
    ├── src/
    ├── index.html
    └── package.json
```

## 1. Start the Django backend (Windows)

Open PowerShell or VS Code terminal:

```powershell
cd LIVARA\backend
py -m venv venv
.\venv\Scripts\Activate.ps1
```

If PowerShell blocks activation, run this once in that terminal:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\venv\Scripts\Activate.ps1
```

Install packages:

```powershell
pip install -r requirements.txt
```

Create database tables:

```powershell
py manage.py makemigrations core
py manage.py migrate
```

Create an administrator:

```powershell
py manage.py createsuperuser
```

Start backend:

```powershell
py manage.py runserver
```

Backend API: http://127.0.0.1:8000/api/  
Admin: http://127.0.0.1:8000/admin/

Keep this terminal running.

## 2. Start the React frontend

Open a SECOND terminal:

```powershell
cd LIVARA\frontend
npm install
npm run dev
```

Open the URL printed by Vite, usually http://localhost:5173/

## 3. First-use guide

1. Register a Citizen account to submit reports.
2. Register a Volunteer account in another browser/incognito window to accept reports.
3. Register an NGO account if needed. NGO accounts must be verified by an administrator before accepting reports.
4. Sign in as the Django superuser at `/admin/` to verify an NGO profile.
5. Submit a report with a category and location. You can use the "Use my location" button or click the map to choose coordinates.
6. Sign in as a volunteer/verified NGO and accept an open report.
7. Update its status to `In progress` or `Resolved`.

## 4. API endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/auth/register/` | Register |
| POST | `/api/auth/token/` | Obtain JWT |
| GET | `/api/auth/me/` | Current user |
| GET/POST | `/api/reports/` | List/create reports |
| GET | `/api/reports/{id}/` | Report details |
| POST | `/api/reports/{id}/accept/` | Accept report |
| PATCH | `/api/reports/{id}/status/` | Update status |
| GET | `/api/dashboard/stats/` | Dashboard statistics |

## 5. Notes

- SQLite database is created at `backend/db.sqlite3` after migrations.
- Uploaded images are stored in `backend/media/`.
- Map tiles are provided by OpenStreetMap; internet access is needed for map tiles.
- The frontend uses `VITE_API_URL` if set; otherwise it calls `http://127.0.0.1:8000/api`.
- The default Django secret key is for local development only. Change it and set `DEBUG=False` before deployment.
- This project intentionally does not process or hold money/donations. Add a compliant payment provider only after legal, accounting and safeguarding requirements are addressed.
