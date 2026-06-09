# Spendwise — Full Stack Expense Tracker

React + Vite + Tailwind CSS frontend · Express + MongoDB backend

---

## ⚡ Quick Start (3 steps)

### Step 1 — Install dependencies

```bash
# Install backend
cd backend && npm install && cd ..

# Install frontend
cd frontend && npm install && cd ..
```

### Step 2 — Configure environment

The `backend/.env` file is already included with local MongoDB defaults.
Edit it if you want to use MongoDB Atlas:

```
MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/spendwise
JWT_SECRET=change_this_to_something_long_and_random
PORT=5000
```

### Step 3 — Run both servers

Open **two terminals**:

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev
# → Server running on http://localhost:5000
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
# → App running on http://localhost:3000
```

Open **http://localhost:3000** in your browser.

---

## Prerequisites

- Node.js v18+
- MongoDB running locally (`mongod`) OR a free [MongoDB Atlas](https://cloud.mongodb.com) cluster

---

## Project Structure

```
spendwise/
├── backend/
│   ├── config/
│   │   └── db.js                  # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js      # register, login, profile
│   │   └── expenseController.js   # CRUD for expenses
│   ├── middleware/
│   │   └── authMiddleware.js      # JWT protect middleware
│   ├── models/
│   │   ├── User.js                # Mongoose User schema + bcrypt
│   │   └── Expense.js             # Mongoose Expense schema
│   ├── routes/
│   │   ├── authRoutes.js
│   │   └── expenseRoutes.js
│   ├── server.js
│   ├── .env                       # ← edit MongoDB URI here
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── api/
    │   │   └── client.js          # Axios + JWT interceptors
    │   ├── components/
    │   │   ├── ExpenseCard.jsx    # Row with inline edit/delete
    │   │   ├── ExpenseForm.jsx    # Shared add/edit form
    │   │   ├── Navbar.jsx
    │   │   ├── ProtectedRoute.jsx
    │   │   └── StatsBar.jsx       # Totals + category bar
    │   ├── context/
    │   │   └── AuthContext.jsx    # Auth state
    │   ├── hooks/
    │   │   └── useExpenses.js     # CRUD hook
    │   ├── pages/
    │   │   ├── Dashboard.jsx
    │   │   ├── Login.jsx
    │   │   └── Register.jsx
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css
    ├── index.html
    ├── vite.config.js             # proxies /api → localhost:5000
    ├── tailwind.config.js
    └── package.json
```

## API Reference

| Method | Endpoint              | Auth   | Body / Query                         |
|--------|-----------------------|--------|--------------------------------------|
| POST   | /api/auth/register    | —      | `{ name, email, password }`          |
| POST   | /api/auth/login       | —      | `{ email, password }`                |
| GET    | /api/auth/me          | Bearer | —                                    |
| GET    | /api/expenses         | Bearer | `?month=YYYY-MM&category=...`        |
| POST   | /api/expenses         | Bearer | `{ amount, category, date, description }` |
| PUT    | /api/expenses/:id     | Bearer | any of the above fields              |
| DELETE | /api/expenses/:id     | Bearer | —                                    |
