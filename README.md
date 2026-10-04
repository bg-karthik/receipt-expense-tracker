# ReceiptAI — AI-Powered Receipt & Expense Tracker

A full-stack, enterprise-ready **AI Receipt & Expense Tracker** that leverages **Google Gemini Vision AI** to automatically scan, extract, and categorize receipts into structured expenses with financial analytics, interactive charts, and real-time monthly budget tracking.

---

## 🌟 Key Features

1. **AI Receipt Scanning & Extraction**:
   - Upload receipt images (JPG, JPEG, PNG up to 5MB).
   - Gemini Vision AI extracts Merchant Name, Date, Total Amount, Currency, Category, Payment Method, Tax, Confidence Score, and individual line items (item name, quantity, price).
   - Structured JSON validation on the backend before returning data to the client.

2. **Interactive Review & Edit**:
   - Visual receipt preview side-by-side with an editable form.
   - Add, edit, or remove line items with automatic calculation.
   - Only validated, user-approved data is persisted to the database.

3. **Financial Dashboard & Visual Analytics (Recharts)**:
   - Summary stat cards: Total Spending, Total Expense Count, Average Expense, Highest Single Expense.
   - Monthly Budget tracking with visual progress bar and over-budget warnings.
   - Spending by Category breakdown (Donut / Pie Chart).
   - Monthly Spending trends over the last 6 months (Bar Chart).
   - Quick-access Recent Expenses feed.

4. **Expense Management & History**:
   - Filter by Category, Start Date, and End Date.
   - Real-time search across merchant names.
   - Multi-column sorting (Date, Amount, Merchant, Created At) in Ascending / Descending order.
   - Full expense details modal/page with original receipt preview, confidence score, itemized receipt breakdown, and notes.
   - In-place editing and safe deletion with confirmation.

5. **Monthly Budgeting & Settings**:
   - Set and adjust monthly spending thresholds.
   - Real-time remaining budget calculations.
   - Over-budget visual warnings.

6. **Secure Authentication & Authorization**:
   - JWT-based authentication with bcrypt password hashing.
   - User data isolation (each user can only view, create, edit, or delete their own expenses).
   - Protected client-side routes and secure server-side middleware.

---

## 🛠 Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS, Recharts, Lucide Icons, Axios, React Router v7, React Hot Toast, Date-fns |
| **Backend** | Node.js, Express 4 / 5, TypeScript, Prisma ORM, PostgreSQL / SQLite |
| **AI Engine** | Google Gemini Vision API (`@google/generative-ai`) |
| **Authentication** | JWT (JSON Web Tokens), Bcrypt.js |
| **File Handling** | Multer (disk storage with MIME & size validation) |

---

## 🏗 Architecture & Data Flow

```
   ┌──────────────┐
   │ User Browser │
   └──────┬───────┘
          │ 1. Uploads Receipt Image (JPG/PNG)
          ▼
   ┌────────────────────────────────┐
   │ React Frontend (Vite + TS)     │
   └──────┬─────────────────────────┘
          │ 2. POST /api/receipts/analyze (FormData)
          ▼
   ┌────────────────────────────────┐
   │ Express Backend (Node.js + TS) │
   └──────┬─────────────────────────┘
          │ 3. Base64 encode & send prompt
          ▼
   ┌────────────────────────────────┐
   │ Google Gemini Vision API       │
   └──────┬─────────────────────────┘
          │ 4. Returns Structured JSON
          ▼
   ┌────────────────────────────────┐
   │ Backend Validation Layer       │
   └──────┬─────────────────────────┘
          │ 5. Validated data sent back
          ▼
   ┌────────────────────────────────┐
   │ Frontend Review & Edit Screen  │
   └──────┬─────────────────────────┘
          │ 6. User edits & clicks "Save Expense"
          ▼
   ┌────────────────────────────────┐
   │ PostgreSQL / SQLite via Prisma │
   └──────┬─────────────────────────┘
          │ 7. Expense + Line Items saved
          ▼
   ┌────────────────────────────────┐
   │ Dashboard & Expense History    │
   └────────────────────────────────┘
```

---

## 📁 Project Structure

```
receipt-expense-tracker/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ProtectedLayout.tsx     # Layout wrapper with responsive navigation
│   │   │   └── Sidebar.tsx             # Desktop and mobile responsive sidebar
│   │   ├── hooks/
│   │   │   └── useAuth.tsx             # Authentication context and hooks
│   │   ├── pages/
│   │   │   ├── DashboardPage.tsx       # Analytics, charts, summary stats, budget
│   │   │   ├── ExpensesPage.tsx        # Expense list, search, filters, sorting
│   │   │   ├── ExpenseDetailPage.tsx   # Detailed view, receipt preview, item list
│   │   │   ├── ScanPage.tsx            # Receipt upload, AI extraction, edit & save
│   │   │   ├── SettingsPage.tsx        # Budget configuration & profile
│   │   │   ├── LoginPage.tsx           # User login screen
│   │   │   └── RegisterPage.tsx        # User registration screen
│   │   ├── services/
│   │   │   ├── api.ts                  # Axios client with JWT interceptor
│   │   │   ├── auth.service.ts         # Authentication API calls
│   │   │   └── expense.service.ts      # Expense, Receipt & Dashboard API calls
│   │   ├── types/
│   │   │   └── index.ts                # TypeScript domain models and types
│   │   ├── App.tsx                     # Main Router & Toast configuration
│   │   ├── index.css                   # Custom styles & design system tokens
│   │   └── main.tsx
│   ├── .env.example
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
│
├── backend/
│   ├── prisma/
│   │   └── schema.prisma               # Prisma models (User, Expense, ExpenseItem, Budget)
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── auth.controller.ts      # Register, Login, GetMe
│   │   │   ├── budget.controller.ts    # Get Budget, Update Budget
│   │   │   ├── dashboard.controller.ts # Summary, Categories, Monthly Trend
│   │   │   ├── expense.controller.ts   # CRUD operations on Expenses
│   │   │   └── receipt.controller.ts   # Receipt AI analysis endpoint
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts      # JWT authentication middleware
│   │   │   └── error.middleware.ts     # Global centralized error handler
│   │   ├── routes/
│   │   │   ├── auth.routes.ts
│   │   │   ├── budget.routes.ts
│   │   │   ├── dashboard.routes.ts
│   │   │   ├── expense.routes.ts
│   │   │   └── receipt.routes.ts
│   │   ├── services/
│   │   │   └── gemini.service.ts       # Gemini Vision extraction & JSON validation
│   │   ├── utils/
│   │   │   └── prisma.ts               # Prisma Client singleton
│   │   └── server.ts                   # Express server setup & middleware
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
│
├── README.md
└── .gitignore
```

---

## 🗄 Database Schema (Prisma)

### Models:
1. **`User`**:
   - `id`: UUID (Primary Key)
   - `email`: String (Unique)
   - `name`: String
   - `password`: String (Bcrypt hashed)
   - `createdAt`, `updatedAt`: DateTime
   - Relations: `expenses` (1-to-many), `budget` (1-to-1)

2. **`Expense`**:
   - `id`: UUID (Primary Key)
   - `userId`: Foreign key -> User
   - `merchantName`: String
   - `date`: DateTime
   - `totalAmount`: Float
   - `currency`: String (default "INR")
   - `category`: String
   - `paymentMethod`: String (optional)
   - `tax`: Float (optional)
   - `receiptImage`: String (optional path)
   - `confidence`: Float (optional)
   - `notes`: String (optional)
   - `createdAt`, `updatedAt`: DateTime
   - Relations: `items` (1-to-many ExpenseItem, cascade delete)

3. **`ExpenseItem`**:
   - `id`: UUID (Primary Key)
   - `expenseId`: Foreign key -> Expense
   - `name`: String
   - `quantity`: Float (default 1)
   - `price`: Float

4. **`Budget`**:
   - `id`: UUID (Primary Key)
   - `userId`: Foreign key -> User (Unique)
   - `amount`: Float
   - `month`: Int
   - `year`: Int
   - `createdAt`, `updatedAt`: DateTime

---

## 🤖 How AI Receipt Extraction Works

1. The client sends a multipart `FormData` request with the receipt file (`.jpg`, `.jpeg`, or `.png`).
2. The backend validates file format and size (max 5MB) and stores it in the uploads folder.
3. The image is passed to **Gemini Vision** with a strict extraction prompt instructing it to return clean JSON without markdown code blocks.
4. Gemini extracts:
   ```json
   {
     "merchantName": "SuperMart Groceries",
     "date": "2026-10-04",
     "totalAmount": 450,
     "currency": "INR",
     "category": "Groceries",
     "paymentMethod": "UPI",
     "tax": 20,
     "confidence": 0.92,
     "items": [
       { "name": "Milk", "quantity": 2, "price": 60 }
     ]
   }
   ```
5. The backend validates every field type, validates date formats, normalizes categories and currencies, sanitizes line items, and returns the structured payload along with the image URL.
6. The user reviews and edits any field on the frontend before saving.

---

## 📡 REST API Endpoints

### Authentication
- `POST /api/auth/register` — Register a new account (`name`, `email`, `password`)
- `POST /api/auth/login` — Log in and receive JWT token
- `GET /api/auth/me` — Get current logged-in user details

### Receipt AI
- `POST /api/receipts/analyze` — Upload receipt image for Gemini Vision analysis (Auth required)

### Expenses
- `GET /api/expenses` — List user expenses (supports `search`, `category`, `startDate`, `endDate`, `sortBy`, `sortOrder`, `page`, `limit`)
- `GET /api/expenses/:id` — Get single expense with line items
- `POST /api/expenses` — Create a new expense with line items
- `PUT /api/expenses/:id` — Update an existing expense and line items
- `DELETE /api/expenses/:id` — Delete an expense

### Dashboard & Analytics
- `GET /api/dashboard/summary` — Total spending, total count, average, highest expense, budget metrics
- `GET /api/dashboard/categories` — Spending grouped by category
- `GET /api/dashboard/monthly` — 6-month monthly spending trend
- `GET /api/dashboard/recent` — 5 most recent expenses

### Budget
- `GET /api/budget` — Current month budget, spending, remaining balance, and percentage used
- `PUT /api/budget` — Set/update monthly budget amount

---

## ⚙️ Environment Variables

### Backend (`backend/.env`)
```env
# Database connection URL (PostgreSQL or SQLite)
DATABASE_URL="postgresql://postgres:password@localhost:5432/receipt_tracker?schema=public"
# Or for zero-config local SQLite:
# DATABASE_URL="file:./dev.db"

# JWT Secret
JWT_SECRET="your-super-secret-jwt-key"

# Google Gemini API Key (Get from https://aistudio.google.com)
GEMINI_API_KEY="your-gemini-api-key"

# Server configuration
PORT=5000
NODE_ENV=development
CORS_ORIGIN="http://localhost:5173"
MAX_FILE_SIZE=5242880
UPLOAD_DIR="uploads"
```

### Frontend (`frontend/.env.example`)
```env
VITE_APP_NAME="ReceiptAI"
```

---

## 🚀 Quickstart & Local Development

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Google Gemini API Key ([AI Studio](https://aistudio.google.com))
- PostgreSQL (or local SQLite for zero-config)

### 1. Clone & Install Dependencies

```bash
cd receipt-expense-tracker

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Database Setup

In the `backend` directory:
```bash
# Copy environment variables
cp .env.example .env
# Set your GEMINI_API_KEY and DATABASE_URL in .env

# Generate Prisma Client and push schema to DB
npx prisma generate
npx prisma db push
```

### 3. Run Backend Server

```bash
cd backend
npm run dev
# Backend starts on http://localhost:5000
```

### 4. Run Frontend App

```bash
cd frontend
npm run dev
# Frontend starts on http://localhost:5173
```

---

## 🔒 Security Best Practices

- **API Key Protection**: The Gemini API key is strictly stored server-side and never exposed to the client.
- **Data Isolation**: All database queries filter by `userId: req.userId` extracted from the verified JWT token.
- **Password Security**: Passwords are salted and hashed with `bcryptjs` (12 rounds).
- **File Upload Validation**: Multer enforces whitelist MIME type checking (`image/jpeg`, `image/jpg`, `image/png`) and a 5MB size limit.
- **Input Sanitization & Validation**: Express-validator and custom sanitizers protect against malformed payloads and injection attacks.
- **CORS & Helmet**: Helmet configures secure HTTP response headers and CORS restricts unauthorized origins.

---

## 📄 License
This project is licensed under the ISC License.
