# LIVARA – Community Welfare & Animal Rescue Platform

**Connecting people in need with compassionate communities.**

LIVARA is a community welfare platform designed to connect people in need with volunteers and NGOs. It supports assistance requests related to food, shelter, medical care, animal rescue, and road safety.

## Key Features

- User registration and login with JWT authentication.
- Assistance request submission.
- Support for image uploads and location details.
- Community reports browsing and filtering.
- Volunteer and NGO participation.
- Report acceptance and status tracking.
- Interactive maps using Leaflet and OpenStreetMap.
- Dashboard statistics.
- Django administration panel.

## Technology Stack

| Component | Technology |
|---|---|
| Frontend | React.js, Vite |
| Backend | Python, Django REST Framework |
| Database | SQLite |
| Authentication | JWT |
| Maps | Leaflet, OpenStreetMap |

## Project Structure

```text
LIVARA/
├── backend/
│   ├── config/
│   ├── core/
│   ├── manage.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   ├── package.json
│   └── index.html
└── README.md
```

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/Harshitha0007/LIVARA.git
cd LIVARA/LIVARA
```

### 2. Backend Setup

```bash
cd backend
python -m venv venv
```

Activate the virtual environment:

**Windows:**
```bash
venv\Scripts\activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Run migrations:

```bash
python manage.py migrate
```

Start the backend:

```bash
python manage.py runserver
```

### 3. Frontend Setup

Open another terminal:

```bash
cd LIVARA/LIVARA/frontend
npm install
npm run dev
```

Open the local Vite URL displayed in your terminal.

## Project Objective

LIVARA aims to encourage community participation, simplify assistance requests, and improve coordination between citizens, volunteers, and NGOs.

## Future Enhancements

- AI-based automatic complaint classification.
- Smart department assignment.
- Real-time notifications.
- Advanced analytics and reporting.

## Developer

**Harshitha M**  
Computer Science and Engineering

---

*LIVARA – Every life deserves care.*