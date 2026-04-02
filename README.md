# Finance Data Processing & Access Control Backend

A production-quality REST API for managing financial records with role-based access control (RBAC), JWT authentication, dashboard analytics, and interactive Swagger documentation.

## Architecture

```
┌──────────────┐     ┌─────────────┐     ┌────────────┐     ┌──────────┐
│   Client     │────▶│  Middleware  │────▶│ Controller │────▶│ Service  │
│ (REST/Swagger)│    │ Auth+RBAC+  │     │  (thin)    │     │ (logic)  │
└──────────────┘     │  Validate   │     └────────────┘     └────┬─────┘
                     └─────────────┘                             │
                                                           ┌────▼─────┐
                                                           │ Sequelize│
                                                           │  (SQLite)│
                                                           └──────────┘
```

<img width="1408" height="768" alt="Architecture" src="https://github.com/user-attachments/assets/fdbde4de-4d23-4cbc-bc56-76521d6168cf" />



### Tech Stack
| Layer      | Choice             | Why                                   |
| ---------- | ------------------ | ------------------------------------- |
| Runtime    | Node.js            | Async-native, large ecosystem         |
| Framework  | Express.js         | Minimal, flexible, well-understood    |
| Database   | SQLite + Sequelize | Zero-config, portable, single-file DB |
| Auth       | JWT + bcryptjs     | Stateless, industry-standard          |
| Validation | Joi                | Declarative schema validation         |
| Docs       | Swagger            | Interactive API explorer              |
| Tests      | Jest + Supertest   | Fast, reliable integration testing    |


### Design Decisions
- **Clean architecture**: Controller → Service → Model separation keeps logic testable and controllers thin.
- **SQLite**: Chosen for portability (no external DB server needed). Swap to PostgreSQL by changing `src/config/database.js`.
- **Idempotent seeder**: Safe to run multiple times; auto-runs on server start.
- **RBAC scoping**: Viewers see only their own data. Analysts see all data but can only update their own. Admins have full access.

## Setup & Run

### Prerequisites
- Node.js 18+ and npm

### Installation
```bash
# Install dependencies
npm install

# Seed the database (optional — auto-runs on server start)
npm run seed
```

### Start the Server
```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

The server starts at **http://localhost:3000**.
Swagger docs at **http://localhost:3000/api-docs**.

### Run Tests
```bash
npm test
```

### Environment Variables (`.env`)
```
PORT=3000
NODE_ENV=development
DB_PATH=./database.sqlite
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h
```

## 👤 Default Admin Account
| Field    | Value               |
|----------|---------------------|
| Email    | admin@finance.com  |
| Password | Admin@123          |
| Role     | Admin              |

## Roles & Permissions

| Action               | Viewer | Analyst | Admin |
|----------------------|:------:|:-------:|:-----:|
| View own records     |   ✅   |   ✅    |  ✅   |
| View all records     |   ❌   |   ✅    |  ✅   |
| Create records       |   ❌   |   ✅    |  ✅   |
| Update own records   |   ❌   |   ✅    |  ✅   |
| Delete records       |   ❌   |   ❌    |  ✅   |
| Dashboard (own)      |   ✅   |   ✅    |  ✅   |
| Dashboard (all)      |   ❌   |   ✅    |  ✅   |
| Manage users         |   ❌   |   ❌    |  ✅   |

## API Endpoints

### Auth
| Method | Endpoint | Description |
|---   |--------------------- |-------------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login`    | Login, get JWT    |

### Users (Admin only)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/users` | List all users |
| GET | `/api/users/:id` | Get user details |
| PATCH | `/api/users/:id/role` | Assign role |
| PATCH | `/api/users/:id/status` | Activate/deactivate |
| DELETE | `/api/users/:id` | Delete user |

### Financial Records
| Method | Endpoint | Description | Role |
|---|---|---|---|
| POST | `/api/records`       | Create record | Analyst, Admin |
| GET | `/api/records`        | List (filter, paginate) | All (scoped) |
| GET | `/api/records/:id`    | Get single record | All (scoped) |
| PUT | `/api/records/:id`    | Update record | Analyst (own), Admin |
| DELETE | `/api/records/:id` | Delete record | Admin |

**Query params**: `type`, `category`, `startDate`, `endDate`, `search`, `page`, `limit`, `sortBy`, `order`

### Dashboard
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/dashboard/summary` | Income, expenses, net balance |
| GET | `/api/dashboard/categories` | Category-wise totals |
| GET | `/api/dashboard/trends?period=monthly` | Monthly/weekly trends |

## Example cURL Requests

### Register
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"johndoe","email":"john@example.com","password":"Password1"}'
```

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@finance.com","password":"Admin@123"}'
```

### Create Financial Record
```bash
curl -X POST http://localhost:3000/api/records \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"amount":5000,"type":"income","category":"salary","date":"2025-01-15","notes":"Monthly salary"}'
```

### Get Records with Filters
```bash
curl "http://localhost:3000/api/records?type=income&category=salary&page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Dashboard Summary
```bash
curl http://localhost:3000/api/dashboard/summary \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Assign Role (Admin)
```bash
curl -X PATCH http://localhost:3000/api/users/USER_ID/role \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{"roleId":2}'
```

## 📂 Folder Structure
```
├── server.js                  # Entry point
├── .env                       # Environment config
├── package.json
├── src/
│   ├── config/database.js     # Sequelize + SQLite
│   ├── models/                # User, Role, FinancialRecord
│   ├── middleware/            # Auth, RBAC, Validate, ErrorHandler, RateLimiter
│   ├── validators/            # Joi schemas
│   ├── services/              # Business logic
│   ├── controllers/           # Request handlers
│   ├── routes/                # Express routers + Swagger JSDoc
│   └── utils/                 # ApiResponse, Swagger config
├── seeders/seed.js            # Seed roles + admin
└── tests/                     # Jest + Supertest
```

## Assumptions
1. Single-tenant deployment
2. Default admin seeded on first run
3. New users default to `viewer` role; only admins can promote
4. Viewers see only their own records; analysts/admins see all
5. No file uploads — records are text-based

## Trade-offs
- **SQLite vs PostgreSQL**: SQLite for portability; lacks concurrent write scaling. Swap via config for production.
- **Express vs NestJS**: Express is lighter, faster to build; NestJS adds structure but heavier boilerplate.
- **In-process seeding**: Seeder runs at boot for simplicity; in production, use a migration tool.
