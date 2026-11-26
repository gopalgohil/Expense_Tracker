# Spendwise — Full-Stack Expense Tracker
## Project Documentation (For Users & Managers)

> **Version:** 1.0.0 | **Status:** Live in Production | **Last Updated:** November 2026

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Who Is This For?](#2-who-is-this-for)
3. [How the Application Works (Simple Flow)](#3-how-the-application-works)
4. [Core Features & Modules](#4-core-features--modules)
5. [Technology Stack](#5-technology-stack)
6. [Project Folder Structure](#6-project-folder-structure)
7. [Database Design](#7-database-design)
8. [API Endpoints Reference](#8-api-endpoints-reference)
9. [Security Architecture](#9-security-architecture)
10. [Deployment Infrastructure](#10-deployment-infrastructure)
11. [Environment Configuration](#11-environment-configuration)
12. [How to Run Locally](#12-how-to-run-locally)

---

## 1. Project Overview

**Spendwise** is a full-stack personal finance management web application. It allows users to:

- Track daily expenses with categories, dates, and currency
- Set monthly budgets per category and get alerts when limits are exceeded
- View spending patterns through interactive charts and reports
- Export financial data as PDF or CSV for accounting purposes
- Use the app in any currency (INR, USD, EUR, GBP, CAD, AUD)
- Get bills auto-added every month for recurring expenses (Rent, Netflix, etc.)

The application is built with a modern MERN-based architecture and is fully deployed on the cloud — accessible from anywhere via a web browser.

**Live Application:** [https://expense-tracker-omega-one-84.vercel.app](https://expense-tracker-omega-one-84.vercel.app)  
**Backend API:** [https://expense-tracker-wzrx.onrender.com](https://expense-tracker-wzrx.onrender.com)  
**Source Code:** [https://github.com/gopalgohil/Expense_Tracker](https://github.com/gopalgohil/Expense_Tracker)

---

## 2. Who Is This For?

| Audience | Use Case |
| :--- | :--- |
| **End Users** | Individuals who want to manage their personal finances, set budgets, and track spending habits |
| **Project Managers** | Understand the system architecture, feature set, technologies, and deployment setup |
| **Engineering Leads** | Review code structure, API contracts, database schemas, and security implementation |

---

## 3. How the Application Works

### For a Non-Technical User (Simple View)

```
User opens website → Signs up / Logs in → Sees Dashboard
      ↓
Adds expenses (amount, category, date, currency)
      ↓
Sets monthly budgets for each category (Food, Travel, etc.)
      ↓
App shows charts, compares months, shows how much is left
      ↓
Downloads PDF/CSV report at end of month
```

### For a Technical Reader (System Flow)

```
Browser (React App)
     │  Sends HTTP requests (via Axios)
     ↓
Backend API (Express.js on Node.js)
     │  Verifies JWT token from HTTP-only cookie
     │  Validates request data
     ↓
MongoDB Atlas (Cloud Database)
     │  Stores Users, Expenses, Budgets, Exchange Rates
     ↓
Response sent back to browser → UI updates in real-time
```

---

## 4. Core Features & Modules

---

### 4.1 Authentication & User Management

**What it does:** Handles all login, registration, and account security.

#### Features:
- **Email + Password Registration:** User fills name, email, password → receives 6-digit OTP via email → verifies OTP → account created
- **Google Sign-In (OAuth 2.0):** One-click login using Google account via Firebase Authentication
- **Secure Login:** Password verified against bcrypt hash → HTTP-only JWT cookie set → user session active
- **Forgot Password:** User enters email → OTP sent → user enters OTP + new password → password updated
- **Session Persistence:** On page refresh, session is restored from HTTP-only cookie (no localStorage exposure)
- **Logout:** Cookie cleared on server → user redirected to login

#### How passwords are protected:
1. Frontend: Password hashed with **SHA-256** before sending over network
2. Backend: Hashed again with **bcrypt (10 salt rounds)** before saving to database
3. Original password never stored anywhere

---

### 4.2 Expense Management

**What it does:** Add, view, edit, delete, and filter all financial transactions.

#### Features:
- **Add Expense:** Title, amount, category, date, currency (INR/USD/EUR/GBP/CAD/AUD), optional description
- **Edit Expense:** Update any field inline or via modal
- **Delete Expense:** Remove record permanently
- **Search & Filter:** Filter by month, category, keyword search, or date range
- **Pagination:** 10 records per page with navigation
- **Recurring Expenses:** Mark any expense as recurring (monthly/weekly/yearly) — system auto-adds it every cycle

#### Expense Categories:
Food & Dining · Transport · Shopping · Entertainment · Health · Utilities · Housing · Education · Travel · Other

#### Multi-Currency:
- User selects their base currency in Settings
- When an expense in a foreign currency is added, the system fetches the live exchange rate and stores the converted amount in the user's base currency
- Exchange rates cached daily in database to avoid repeated API calls

---

### 4.3 Budget Management

**What it does:** Set monthly spending limits per category and track compliance in real-time.

#### Features:
- **Set Budget:** Define a maximum spending cap for each category for a given month (e.g., Food = ₹5,000 for November 2026)
- **Real-Time Status:** Dashboard shows how much of each budget has been used
- **Tiered Alerts:**
  - **Green (Safe):** Spent less than 80% of budget
  - **Amber (Warning):** Spent between 80% and 100%
  - **Red (Exceeded):** Spent over 100% of budget limit
- **Monthly Budgets:** Each budget is per-month, so November settings don't affect December

---

### 4.4 Analytics & Visualization

**What it does:** Show spending patterns through interactive charts.

#### Charts Available:
| Chart | What It Shows |
| :--- | :--- |
| **Category Pie Chart** | Which categories you spend most on this month |
| **Monthly Bar Chart** | Month-by-month spending comparison (last 6 months) |
| **Daily Breakdown Chart** | Day-by-day spending for the selected month |
| **Budget Progress Bars** | Per-category budget usage with color-coded status |

#### Summary Cards on Dashboard:
- Total Spent This Month
- Budget Remaining
- Highest Spending Category
- Number of Transactions

---

### 4.5 Data Export & Reports

**What it does:** Download financial data for record-keeping or accounting.

#### Export Options:
| Format | Contents |
| :--- | :--- |
| **CSV Export** | All expenses in spreadsheet format (opens in Excel or Google Sheets) |
| **PDF Export** | Styled financial statement with charts and category summaries |

Both exports respect the currently applied filters (month, category, date range).

---

### 4.6 Automated Recurring Expenses (Cron Job)

**What it does:** Automatically creates expense entries for recurring bills without manual input.

#### How it works:
- When a user marks an expense as "Monthly Recurring" (e.g., ₹10,000 House Rent)
- Every 1st of the month at 00:05 AM, the backend cron job runs automatically
- It finds all recurring expenses that are due and creates new entries for the current month
- It checks for duplicates to avoid creating the same entry twice
- It then updates the `nextDueDate` field for the next cycle

**Supported Intervals:** Monthly · Weekly · Yearly

---

### 4.7 User Profile & Settings

**What it does:** Manage account information, currency preferences, and security settings.

#### Settings Available:
- **Change Full Name**
- **Change Email Address**
- **Select Base Currency** (INR, USD, EUR, GBP, CAD, AUD)
- **Change Password** (with current password verification)
- **Dark / Light Mode Toggle**
- **Delete Account** (permanently deletes all expenses, budgets, and user data)

---

## 5. Technology Stack

### Frontend Technologies

| Technology | Version | Purpose |
| :--- | :--- | :--- |
| React.js | 18.2 | UI component library — builds the entire user interface |
| Vite | 5.4 | Build tool — fast development server and production bundler |
| Tailwind CSS | 3.3 | CSS utility framework — responsive design and custom theming |
| React Router DOM | 6.20 | Client-side page routing and protected route guards |
| Axios | 1.6 | Makes HTTP requests to the backend API |
| Recharts | 2.10 | Renders interactive SVG charts (Pie, Bar, Line) |
| Framer Motion | 11.18 | Smooth animations and page transitions |
| React Hot Toast | 2.6 | Notification popups (success, error messages) |
| React Icons | 5.6 | Icon library used throughout the UI |
| Firebase (Client SDK) | 12.15 | Google OAuth / Sign-In with Google integration |
| jsPDF | 2.5 | Client-side PDF generation for export reports |
| html2canvas | 1.4 | Captures chart canvas for PDF inclusion |
| CountUp.js | 2.8 | Animated number counters on dashboard cards |

### Backend Technologies

| Technology | Version | Purpose |
| :--- | :--- | :--- |
| Node.js | 20.x | JavaScript runtime that runs the server |
| Express.js | 4.18 | Web framework — handles HTTP routes and middleware |
| Mongoose | 8.0 | MongoDB object modeling with schema validation |
| MongoDB Atlas | Cloud | NoSQL cloud database for all data storage |
| JSON Web Token (JWT) | 9.0 | Generates and verifies secure session tokens |
| bcryptjs | 2.4 | Hashes passwords before storing in the database |
| cookie-parser | 1.4 | Reads HTTP-only cookies from incoming requests |
| node-cron | 3.0 | Schedules automated recurring expense jobs |
| Nodemailer | 9.0 | Sends OTP and notification emails via SMTP/Gmail |
| PDFKit | 0.19 | Server-side PDF document generation |
| json2csv | 6.0 | Converts expense data to CSV format for download |
| firebase-admin | 12.15 | Server-side verification of Google Auth tokens |
| dotenv | 16.3 | Loads environment variables from `.env` file |
| cors | 2.8 | Manages Cross-Origin Resource Sharing security |
| nodemon | 3.0 | Auto-restarts server during development on file changes |

### External APIs & Services

| Service | Purpose |
| :--- | :--- |
| **Frankfurter API** | Free currency exchange rate API — fetches daily rates (EUR, USD, GBP, etc.) |
| **Firebase Authentication** | Google Sign-In / OAuth 2.0 provider |
| **Gmail SMTP / Brevo** | Sends OTP verification and password reset emails |

---

## 6. Project Folder Structure

```
Expense_Tracker/
├── backend/                        # Express.js REST API Server
│   ├── config/
│   │   └── db.js                   # MongoDB Atlas connection setup
│   ├── controllers/
│   │   ├── authController.js       # Login, register, OTP, Google login logic
│   │   ├── expenseController.js    # CRUD operations for expenses
│   │   ├── budgetController.js     # Budget creation and status calculation
│   │   ├── analyticsController.js  # Aggregation queries for charts
│   │   ├── userController.js       # Profile update, password change, delete account
│   │   └── exportController.js     # CSV and PDF file generation
│   ├── jobs/
│   │   └── recurringJob.js         # Cron job — runs 1st of every month at 00:05
│   ├── middleware/
│   │   └── authMiddleware.js       # JWT token verification for protected routes
│   ├── models/
│   │   ├── User.js                 # User schema (name, email, password hash, currency)
│   │   ├── Expense.js              # Expense schema (amount, category, date, recurring)
│   │   ├── Budget.js               # Budget schema (userId, month, category, limit)
│   │   ├── ExchangeRate.js         # Cached daily exchange rates from API
│   │   └── PendingRegistration.js  # Temporary OTP storage during signup (auto-expires)
│   ├── routes/
│   │   ├── authRoutes.js           # /api/auth/* endpoints
│   │   ├── expenseRoutes.js        # /api/expenses/* endpoints
│   │   ├── budgetRoutes.js         # /api/budgets/* endpoints
│   │   ├── analyticsRoutes.js      # /api/analytics/* endpoints
│   │   └── userRoutes.js           # /api/user/* endpoints
│   ├── utils/
│   │   ├── sendEmail.js            # Email sending utility (Nodemailer/SMTP)
│   │   ├── currencyService.js      # Frankfurter API + rate caching logic
│   │   ├── verifyFirebaseToken.js  # Google Firebase ID token verification
│   │   └── dateHelper.js           # Date utility functions
│   ├── server.js                   # App entry point, CORS config, route mounting
│   ├── .env                        # Environment variables (not in git)
│   └── package.json
│
├── frontend/                       # React.js Single Page Application
│   ├── public/
│   │   ├── favicon.png             # App icon
│   │   └── leaves.png              # Background/logo asset
│   ├── src/
│   │   ├── api/
│   │   │   └── client.js           # Axios instance + all API call functions
│   │   ├── components/
│   │   │   ├── Layout.jsx          # App shell with sidebar and header
│   │   │   ├── Sidebar.jsx         # Navigation sidebar
│   │   │   ├── ExpenseForm.jsx     # Reusable add/edit expense form modal
│   │   │   ├── ExpenseCard.jsx     # Single expense row with edit/delete
│   │   │   ├── BudgetProgress.jsx  # Budget progress bar component
│   │   │   ├── SummaryCards.jsx    # Dashboard metric cards
│   │   │   ├── DailyBarChart.jsx   # Daily spending bar chart
│   │   │   ├── MonthlyBarChart.jsx # Monthly comparison bar chart
│   │   │   ├── CategoryPieChart.jsx# Category distribution pie chart
│   │   │   ├── MonthCompareChart.jsx # Month-over-month comparison
│   │   │   ├── SearchFilterBar.jsx # Search and filter toolbar
│   │   │   ├── ExportButtons.jsx   # PDF and CSV export buttons
│   │   │   ├── Pagination.jsx      # Page navigation component
│   │   │   ├── ProtectedRoute.jsx  # Route guard — redirects if not logged in
│   │   │   ├── DarkModeToggle.jsx  # Light/Dark mode switch
│   │   │   ├── SignOutModal.jsx    # Logout confirmation dialog
│   │   │   ├── Navbar.jsx          # Top navigation bar
│   │   │   ├── StatsBar.jsx        # Statistics bar
│   │   │   └── animations/         # Framer Motion animation wrappers
│   │   │       ├── FadeInSection.jsx
│   │   │       ├── ScaleModal.jsx
│   │   │       ├── AnimatedList.jsx
│   │   │       ├── SkeletonLoader.jsx
│   │   │       ├── CountUpNumber.jsx
│   │   │       ├── HoverButton.jsx
│   │   │       └── PageTransition.jsx
│   │   ├── context/
│   │   │   ├── AuthContext.jsx     # Global auth state (user, login, logout)
│   │   │   └── ThemeContext.jsx    # Dark/Light mode global state
│   │   ├── hooks/
│   │   │   ├── useExpenses.js      # Expense CRUD operations hook
│   │   │   ├── useBudgets.js       # Budget fetch/create/delete hook
│   │   │   └── useAnalytics.js     # Analytics data fetching hook
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx       # Main dashboard with charts and summary
│   │   │   ├── ExpensesPage.jsx    # Full expense list with filters
│   │   │   ├── BudgetsPage.jsx     # Budget management page
│   │   │   ├── BudgetPanel.jsx     # Budget detail component
│   │   │   ├── BudgetSettings.jsx  # Budget configuration
│   │   │   ├── ReportsPage.jsx     # Analytics and export page
│   │   │   ├── Settings.jsx        # User profile and account settings
│   │   │   ├── Login.jsx           # Login page
│   │   │   ├── Register.jsx        # Registration page
│   │   │   └── AuthPage.jsx        # Auth wrapper page
│   │   ├── utils/
│   │   │   └── hashPassword.js     # SHA-256 client-side password hashing
│   │   ├── config/
│   │   │   └── firebase.js         # Firebase app initialization
│   │   ├── App.jsx                 # Route definitions
│   │   ├── main.jsx                # React app entry point
│   │   └── index.css               # Global styles and Tailwind base
│   ├── .env                        # Local env (VITE_API_URL, Firebase keys)
│   ├── .env.production             # Production env (Render backend URL)
│   ├── vite.config.js              # Dev proxy: /api → localhost:5000
│   ├── tailwind.config.js          # Custom colors, fonts, animations
│   └── package.json
│
├── vercel.json                     # Vercel SPA routing config
└── README.md                       # Project quick-start guide
```

---

## 7. Database Design

The application uses **MongoDB Atlas** with 5 collections:

### 7.1 Users Collection

Stores registered user accounts.

| Field | Type | Description |
| :--- | :--- | :--- |
| `_id` | ObjectId | Unique user identifier (auto-generated) |
| `name` | String | User's full name |
| `email` | String | Unique email (lowercase, used for login) |
| `password` | String | bcrypt-hashed password (never stored plain) |
| `avatar` | String | Profile picture URL (from Google OAuth or null) |
| `currency` | String | Base currency: INR / USD / EUR / GBP / CAD / AUD |
| `authProvider` | String | `local` (email/pass) or `google` (OAuth) |
| `resetPasswordOTP` | String | Temporary OTP for password reset (cleared after use) |
| `resetPasswordOTPExpires` | Date | OTP expiry timestamp |
| `createdAt` | Date | Account creation timestamp |

### 7.2 Expenses Collection

Stores all expense transactions.

| Field | Type | Description |
| :--- | :--- | :--- |
| `_id` | ObjectId | Unique expense identifier |
| `userId` | ObjectId | Reference to the User who owns this expense |
| `amount` | Number | Expense amount in original currency |
| `category` | String | One of 10 predefined categories |
| `date` | Date | Date of the transaction |
| `description` | String | Optional notes (max 200 characters) |
| `currency` | String | Currency of this expense (INR, USD, etc.) |
| `amountInBaseCurrency` | Number | Converted amount in user's base currency |
| `isRecurring` | Boolean | Whether this is a recurring expense |
| `recurrenceInterval` | String | `monthly`, `weekly`, or `yearly` |
| `nextDueDate` | Date | When this expense should next be auto-created |

**Database Indexes:**
- `{ userId: 1, date: -1 }` — Fast lookup of a user's expenses sorted by date
- `{ isRecurring: 1, nextDueDate: 1 }` — Fast cron job query for due recurring expenses

### 7.3 Budgets Collection

Stores monthly spending limits per category.

| Field | Type | Description |
| :--- | :--- | :--- |
| `_id` | ObjectId | Unique budget identifier |
| `userId` | ObjectId | Reference to the User |
| `month` | String | Format: `YYYY-MM` (e.g., `2026-11`) |
| `category` | String | The expense category this budget covers |
| `limit` | Number | Maximum spending allowed for this category/month |

**Unique Index:** `{ userId, month, category }` — Prevents duplicate budgets for same category/month.

### 7.4 PendingRegistrations Collection

Temporary storage for unverified sign-up attempts.

| Field | Type | Description |
| :--- | :--- | :--- |
| `email` | String | Email being registered |
| `name` | String | Name provided during signup |
| `password` | String | Pre-hashed password |
| `otp` | String | 6-digit OTP sent to email |
| `expiresAt` | Date | TTL — record auto-deleted after 10 minutes |

### 7.5 ExchangeRates Collection

Cache for daily currency conversion rates.

| Field | Type | Description |
| :--- | :--- | :--- |
| `baseCurrency` | String | The source currency (e.g., `USD`) |
| `date` | String | Date of the rates (`YYYY-MM-DD`) |
| `rates` | Map | Key-value pairs: `{ EUR: 0.92, INR: 83.5, ... }` |

---

## 8. API Endpoints Reference

**Base URL (Production):** `https://expense-tracker-wzrx.onrender.com`  
**Base URL (Development):** `http://localhost:5000`

> All endpoints marked **[Protected]** require a valid JWT cookie from login.

### 8.1 Authentication — `/api/auth`

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| POST | `/api/auth/send-register-otp` | Public | Send OTP to email to begin registration |
| POST | `/api/auth/verify-register-otp` | Public | Verify OTP and create account |
| POST | `/api/auth/login` | Public | Login with email/password, sets JWT cookie |
| POST | `/api/auth/google-login` | Public | Login with Google Firebase ID token |
| GET | `/api/auth/me` | Protected | Get current logged-in user's profile |
| POST | `/api/auth/logout` | Public | Clear session cookie |
| POST | `/api/auth/forgot-password` | Public | Send OTP for password reset |
| POST | `/api/auth/verify-otp` | Public | Verify password reset OTP |
| POST | `/api/auth/reset-password` | Public | Set new password after OTP verified |

### 8.2 Expenses — `/api/expenses`

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| GET | `/api/expenses` | Protected | Get paginated list with filters |
| POST | `/api/expenses` | Protected | Create a new expense |
| PUT | `/api/expenses/:id` | Protected | Update an existing expense |
| DELETE | `/api/expenses/:id` | Protected | Delete an expense |
| GET | `/api/expenses/export/csv` | Protected | Download expenses as CSV file |
| GET | `/api/expenses/export/pdf` | Protected | Download expenses as PDF file |

**GET /api/expenses Query Parameters:**
- `month=2026-11` — Filter by month
- `category=Food & Dining` — Filter by category
- `page=1` — Page number
- `limit=10` — Records per page
- `search=groceries` — Search in description

### 8.3 Budgets — `/api/budgets`

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| GET | `/api/budgets` | Protected | Get all budgets for a month |
| POST | `/api/budgets` | Protected | Create or update a category budget |
| GET | `/api/budgets/status` | Protected | Get real-time budget vs actual spending |
| DELETE | `/api/budgets/:id` | Protected | Delete a budget |

### 8.4 Analytics — `/api/analytics`

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| GET | `/api/analytics/top-categories` | Protected | Top spending categories with totals |
| GET | `/api/analytics/monthly-compare` | Protected | Month-over-month spending comparison |
| GET | `/api/analytics/daily-breakdown` | Protected | Day-by-day spending for selected month |

### 8.5 User Profile — `/api/user`

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| GET | `/api/user/profile` | Protected | Get user profile and settings |
| PUT | `/api/user/profile` | Protected | Update name, email, or currency |
| PUT | `/api/user/change-password` | Protected | Update password (requires current password) |
| DELETE | `/api/user/delete-account` | Protected | Permanently delete account and all data |

---

## 9. Security Architecture

### Authentication Security
- **JWT tokens** stored exclusively in **HTTP-only cookies** — JavaScript on the page cannot access them (prevents XSS attacks)
- Cookies use `SameSite=Lax` attribute — prevents CSRF attacks
- Cookies use `Secure` flag in production — only sent over HTTPS
- Token expiry enforced — expired sessions automatically rejected

### Password Security
- Passwords never stored in plain text — ever
- **Layer 1:** SHA-256 hash applied on the client before the password is sent over the network
- **Layer 2:** bcrypt hash with 10 salt rounds applied on the server before saving to database
- Even if the database were leaked, passwords would be computationally infeasible to reverse

### Data Isolation
- Every database query filters by `userId` from the JWT token
- Users can only ever read or modify their own data
- No shared data between accounts

### CORS (Cross-Origin Resource Sharing)
- Backend only accepts requests from approved origins:
  - `http://localhost:3000` (local development)
  - `https://expense-tracker-omega-one-84.vercel.app` (production)
  - Any `*.vercel.app` subdomain (Vercel preview deployments)
- All other origins are blocked with a CORS error

---

## 10. Deployment Infrastructure

### Architecture Overview

```
User's Browser
     │
     ↓ HTTPS
Vercel (Frontend CDN)                    — React app, global edge network
     │
     ↓ HTTPS API calls
Render (Backend Server)                  — Express.js, Node.js runtime
     │
     ↓ MongoDB Atlas connection
MongoDB Atlas (Cloud Database)           — Data persistence, cloud cluster
     │
     ↓ Calls external APIs
Frankfurter API                          — Currency exchange rates (free, cached daily)
Firebase Auth                            — Google OAuth token verification
Gmail SMTP / Brevo                       — OTP and transactional emails
```

### Platform Details

| Platform | Service | Auto-Deploy | Region |
| :--- | :--- | :--- | :--- |
| **Vercel** | Frontend hosting | Yes — on git push to `main` | Global CDN |
| **Render** | Backend API hosting | Configurable | US-based |
| **MongoDB Atlas** | Cloud database | N/A | Cloud cluster |

### Vercel Configuration (`vercel.json`)

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

This ensures all URL paths (like `/dashboard`, `/expenses`) are handled by the React SPA router instead of returning 404 errors.

---

## 11. Environment Configuration

### Backend `.env` Variables

```env
# Server
PORT=5000
NODE_ENV=development                    # or production

# Database
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/spendwise

# Authentication
JWT_SECRET=your_long_random_secret_here

# Frontend URL (for CORS)
CLIENT_URL=https://expense-tracker-omega-one-84.vercel.app

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your@gmail.com
SMTP_PASS=your_gmail_app_password
SMTP_FROM=Spendwise Support <your@gmail.com>

# Firebase (for Google login)
FIREBASE_PROJECT_ID=your-firebase-project-id
```

### Frontend `.env` Variables

```env
# Local development
VITE_API_URL=http://localhost:5000/api

# Firebase configuration
VITE_FIREBASE_API_KEY=your_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
```

### Frontend `.env.production` Variables

```env
# Production (Render backend)
VITE_API_URL=https://expense-tracker-wzrx.onrender.com/api
```

---

## 12. How to Run Locally

### Prerequisites
- Node.js v18 or higher
- MongoDB (local) OR MongoDB Atlas account
- Git

### Step 1: Clone the repository

```bash
git clone https://github.com/gopalgohil/Expense_Tracker.git
cd Expense_Tracker
```

### Step 2: Setup Backend

```bash
cd backend
npm install
```

Create `.env` file in the `backend/` folder with the variables from Section 11.

```bash
npm run dev
# Server starts at http://localhost:5000
```

### Step 3: Setup Frontend

```bash
cd ../frontend
npm install
npm run dev
# App starts at http://localhost:3000
```

### Step 4: Open in Browser

Navigate to [http://localhost:3000](http://localhost:3000)

### Available Scripts

| Location | Command | Action |
| :--- | :--- | :--- |
| `backend/` | `npm run dev` | Start backend with hot-reload (nodemon) |
| `backend/` | `npm start` | Start backend without hot-reload |
| `frontend/` | `npm run dev` | Start frontend dev server |
| `frontend/` | `npm run build` | Build for production (outputs to `dist/`) |
| `frontend/` | `npm run preview` | Preview the production build locally |

---

## Summary

| Item | Detail |
| :--- | :--- |
| **Project Name** | Spendwise |
| **Type** | Full-Stack MERN Web Application |
| **Frontend** | React 18 + Vite + Tailwind CSS |
| **Backend** | Node.js + Express.js |
| **Database** | MongoDB Atlas |
| **Authentication** | JWT (HttpOnly Cookie) + Google OAuth 2.0 |
| **Deployment** | Vercel (Frontend) + Render (Backend) |
| **Live URL** | https://expense-tracker-omega-one-84.vercel.app |
| **Source Code** | https://github.com/gopalgohil/Expense_Tracker |

---

*Documentation prepared by Gopal Gohel — November 2026*
