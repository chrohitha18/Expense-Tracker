# BudgetStack — AI-Powered Expense Tracker 💰

> A production-ready, full-stack fintech dashboard with AI-driven financial insights, beautiful analytics, and a premium dark UI.

![BudgetStack Dashboard](https://via.placeholder.com/1200x600/0F172A/6366F1?text=BudgetStack+Dashboard+Screenshot)

---

## ✨ Features

### 🔐 Authentication
- JWT-based auth with 7-day session persistence
- bcrypt password hashing (12 rounds)
- Protected routes with automatic redirect
- Password strength indicator on signup
- Rate-limited login endpoint (20 req/15 min)

### 📊 Dashboard
- Animated stat cards: Balance, Income, Expense, Savings
- Real-time financial health score with letter grade (A–D)
- Recent transactions feed with category badges
- AI Smart Insights panel (pattern detection)
- Budget progress bars with warning thresholds

### 💸 Transactions
- Full CRUD — add, edit, delete, search
- Filter by type, category, date range
- Paginated table (15 per page)
- One-click CSV export
- 8 categories: Food, Travel, Shopping, Bills, Entertainment, Health, Salary, Investment

### 📈 Analytics (Chart.js)
- Income vs Expense line chart (6-month trend)
- Monthly comparison bar chart
- Expense by category doughnut chart
- Weekly spending pattern bar chart
- Savings growth trend chart
- Category breakdown with animated progress bars

### 🤖 AI Smart Insights
- Detects spending spikes (>20% increase vs last month)
- Budget breach warnings (80% and 100% thresholds)
- Savings rate analysis vs 20% benchmark
- Positive reinforcement for good financial habits
- Severity levels: info / warning / critical / positive

### 🎯 Budget Management
- Set per-category monthly limits
- Visual progress with color-coded alerts
- Auto-calculation of spent vs remaining
- Upsert logic — update existing or create new

### ⚙️ Additional
- Responsive sidebar (collapsible on desktop, drawer on mobile)
- Framer Motion page transitions + staggered card animations
- CSV export with date/category filters
- Glassmorphism dark UI (navy + indigo + violet)
- Toast notifications for all user actions

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Tailwind CSS, Framer Motion, Chart.js |
| Routing | React Router v6 |
| HTTP | Axios with JWT interceptors |
| Backend | Node.js, Express.js |
| Auth | JWT + bcryptjs |
| Database | MySQL 8 (mysql2/promise) |
| Validation | express-validator |
| Security | helmet, cors, express-rate-limit |
| Deploy FE | Vercel |
| Deploy BE | Render / Railway |

---

## 📁 Project Structure

```
fintrack/
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/           # StatCard, CategoryBadge, HealthScoreRing, etc.
│   │   │   └── modals/       # TransactionModal
│   │   ├── context/
│   │   │   └── AuthContext.js
│   │   ├── layouts/
│   │   │   └── AppLayout.js  # Sidebar + outlet
│   │   ├── pages/
│   │   │   ├── Login.js
│   │   │   ├── Register.js
│   │   │   ├── Dashboard.js
│   │   │   ├── Transactions.js
│   │   │   ├── Analytics.js
│   │   │   ├── Budgets.js
│   │   │   └── Settings.js
│   │   ├── services/
│   │   │   └── api.js        # Axios instance + interceptors
│   │   ├── App.js
│   │   └── index.css         # Glassmorphism + custom utility classes
│   ├── tailwind.config.js
│   └── vercel.json
│
└── backend/
    ├── config/
    │   └── database.js       # MySQL pool
    ├── controllers/
    │   ├── authController.js
    │   ├── transactionController.js
    │   ├── analyticsController.js
    │   ├── insightController.js
    │   ├── budgetController.js
    │   └── exportController.js
    ├── middleware/
    │   ├── auth.js           # JWT verify middleware
    │   └── errorHandler.js
    ├── routes/
    │   ├── auth.js
    │   ├── transactions.js
    │   ├── analytics.js
    │   ├── insights.js
    │   ├── budgets.js
    │   └── export.js
    ├── database/
    │   └── schema.sql
    ├── server.js
    └── render.yaml
```

---

## 🚀 Local Setup

### Prerequisites
- Node.js ≥ 18
- MySQL 8.x running locally
- npm or yarn

### 1. Clone & Install

```bash
git clone https://github.com/YOUR_USERNAME/fintrack.git
cd fintrack
npm run install:all
```

### 2. Database Setup

```bash
mysql -u root -p
```
```sql
CREATE DATABASE expense_tracker;
USE expense_tracker;
SOURCE backend/database/schema.sql;
```

### 3. Backend Environment

```bash
cp backend/.env.example backend/.env
# Edit backend/.env with your MySQL credentials and a strong JWT_SECRET
```

### 4. Frontend Environment

```bash
cp frontend/.env.example frontend/.env
# For local dev, leave REACT_APP_API_URL empty (uses CRA proxy to localhost:5000)
```

### 5. Run Dev Servers

```bash
# Terminal 1 — Backend
npm run dev:backend

# Terminal 2 — Frontend
npm run dev:frontend
```

Open **http://localhost:3000** 🎉

---

## 🌐 Deployment

### Frontend → Vercel

1. Push code to GitHub
2. Import repo at [vercel.com](https://vercel.com)
3. Set **Root Directory** → `frontend`
4. Add env var: `REACT_APP_API_URL` = your backend URL
5. Deploy ✅

### Backend → Render

1. Create new **Web Service** at [render.com](https://render.com)
2. Set **Root Directory** → `backend`
3. Build command: `npm install`
4. Start command: `node server.js`
5. Add all env vars from `.env.example`
6. Add a **MySQL** addon or connect to PlanetScale / Railway DB
7. Deploy ✅

---

## 📡 API Reference

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Login, returns JWT |
| GET | `/api/auth/me` | Get current user |
| PUT | `/api/auth/profile` | Update profile |

### Transactions
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/transactions` | List (paginated, filterable) |
| POST | `/api/transactions` | Create |
| PUT | `/api/transactions/:id` | Update |
| DELETE | `/api/transactions/:id` | Delete |

### Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/analytics/summary` | Month totals |
| GET | `/api/analytics/trend` | 6-month income/expense |
| GET | `/api/analytics/categories` | Category breakdown |
| GET | `/api/analytics/weekly` | 7-day spending |
| GET | `/api/analytics/savings` | Savings growth |
| GET | `/api/analytics/health-score` | Financial health score |

### Budgets
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/budgets` | Get budgets with spent % |
| POST | `/api/budgets` | Create or update budget |
| DELETE | `/api/budgets/:id` | Remove budget |

### Insights & Export
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/insights` | AI-generated insights |
| PATCH | `/api/insights/:id/read` | Mark insight as read |
| GET | `/api/export/csv` | Download CSV |

---

## 🎯 Resume Impact Points

- **Full-stack architecture**: Designed and implemented a production-ready REST API with JWT auth, bcrypt hashing, MySQL connection pooling, and modular Express routing
- **AI-powered features**: Built a rule-based financial insight engine that detects spending anomalies, budget breaches, and savings opportunities from SQL aggregates
- **Interactive data visualization**: Integrated 5 Chart.js chart types with gradient fills, smooth animations, and responsive layouts using React Chart.js 2
- **Performance-conscious UI**: Used React Context for auth state, Axios interceptors for token injection and 401 handling, and Framer Motion for 60fps animations
- **Security best practices**: Applied Helmet.js headers, CORS whitelisting, express-rate-limit on auth routes, parameterized SQL queries, and input validation via express-validator
- **Deployment-ready**: Configured Vercel (frontend) and Render (backend) deployments with environment variable separation and production build optimization

---

## 📸 Screenshots

> Replace these placeholders with actual screenshots after running the app.

| Login | Dashboard | Analytics |
|-------|-----------|-----------|
| ![Login](https://via.placeholder.com/400x250/0F172A/6366F1?text=Login) | ![Dashboard](https://via.placeholder.com/400x250/0F172A/8B5CF6?text=Dashboard) | ![Analytics](https://via.placeholder.com/400x250/0F172A/22C55E?text=Analytics) |

---

## 📄 License

MIT © 2024 — Built with ❤️ as a full-stack portfolio project.
