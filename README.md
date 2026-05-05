# Employee Attendance Portal Backend

A **production-grade** Node.js backend for managing employee attendance, leave management, and HR operations. Built with enterprise-grade architecture patterns including JWT + DB session authentication, database-driven RBAC, and comprehensive API documentation.

## 🏗️ Tech Stack

| Technology | Purpose |
|-----------|---------|
| **Node.js + Express** | Runtime + HTTP framework |
| **TypeScript** | Type safety |
| **PostgreSQL** | Primary database |
| **Sequelize ORM** | Database abstraction |
| **Zod** | Request validation |
| **JWT + DB Sessions** | Hybrid authentication (15-min inactivity timeout) |
| **Pino** | Structured logging |
| **Swagger/OpenAPI** | API documentation |
| **Helmet** | Security headers |
| **bcryptjs** | Password hashing |

## 📋 Prerequisites

- **Node.js** >= 18.0.0
- **PostgreSQL** >= 14
- **npm** >= 8

## 🚀 Quick Start

```bash
# 1. Clone and install
cd server
npm install

# 2. Set up environment
cp .env.example .env
# Edit .env with your PostgreSQL credentials

# 3. Create database
createdb attendance_portal

# 4. Seed database (creates tables + seed data)
npm run db:seed

# 5. Start development server
npm run dev
```

## 🔧 Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | development | Environment |
| `PORT` | 3000 | Server port |
| `DB_HOST` | localhost | PostgreSQL host |
| `DB_PORT` | 5432 | PostgreSQL port |
| `DB_NAME` | attendance_portal | Database name |
| `DB_USER` | postgres | Database user |
| `DB_PASSWORD` | postgres | Database password |
| `JWT_SECRET` | (change me) | JWT signing secret |
| `SESSION_TIMEOUT_MINUTES` | 15 | Inactivity timeout |

## 🗄️ Database Setup

### Option A: Automated (recommended)
```bash
npm run db:seed    # Creates tables + seeds data
```

### Option B: Manual SQL
```bash
psql -d attendance_portal -f database.sql
```

### Option C: Migration only
```bash
npm run db:migrate  # Sync models without seeding
```

## 📚 API Documentation

After starting the server, visit: **http://localhost:3000/api-docs**

### Test Credentials

| Role | Email | Password |
|------|-------|----------|
| HR | hr@company.com | password123 |
| Manager | manager@company.com | password123 |
| Employee | emp1@company.com | password123 |
| Employee | emp2@company.com | password123 |
| Employee | emp3@company.com | password123 |

## 🔐 Authentication Flow

This system uses a **hybrid JWT + DB Session** approach for the mandatory 15-minute inactivity timeout:

1. **Login** → Verify credentials → Load permissions → Create JWT + DB session
2. **Every Request** → Verify JWT → Load session → Check expiry → Update `lastActivityAt` → Extend `expiresAt`
3. **Inactivity** → After 15 minutes without any request → Session expires → 401
4. **Logout** → Revoke session in DB → Clear cookie

### Why Hybrid?
- **JWT-only** can't enforce inactivity timeout (token valid for fixed duration)
- **Session-only** loses offline capability
- **Hybrid** = JWT for stateless auth + DB session for activity tracking ✓

## 🛡️ RBAC System (Database-Driven)

Permissions are stored in the database, not hardcoded:

```
permissions → role_permissions → roles → users
```

### Permission Format: `<resource>:<action>`

| Permission | Employee | Manager | HR |
|-----------|----------|---------|-----|
| attendance:checkin | ✓ | ✓ | ✗ |
| attendance:view_own | ✓ | ✓ | ✓ |
| attendance:view_team | ✗ | ✓ | ✓ |
| leave:apply | ✓ | ✓ | ✗ |
| leave:approve | ✗ | ✓ | ✗ |
| user:create | ✗ | ✗ | ✓ |
| user:deactivate | ✗ | ✗ | ✓ |

## 📁 Folder Structure

```
server/
├── src/
│   ├── config/          # Database, env validation, logger
│   ├── controllers/     # Request handlers
│   ├── errors/          # Custom error classes
│   ├── middleware/       # Auth, RBAC, validation, error handler, logging
│   ├── models/          # Sequelize models + associations
│   ├── routes/          # Express routes with Swagger docs
│   ├── scripts/         # DB seed, migrate, reset
│   ├── services/        # Business logic layer
│   ├── swagger/         # OpenAPI configuration
│   ├── types/           # TypeScript type declarations
│   ├── utils/           # JWT, hashing, date helpers, constants
│   ├── validators/      # Zod validation schemas
│   ├── app.ts           # Express app setup
│   └── server.ts        # Entry point
├── tests/               # Jest tests
├── database.sql         # SQL fallback script
├── .env.example         # Environment template
└── package.json
```

## 🧪 Testing

```bash
npm test                # Run all tests
npm run test:unit       # Unit tests only
npm run test:integration # Integration tests only
npm run test:coverage   # With coverage report
```

## 🏗️ Architecture Decisions

1. **Layered Architecture**: Routes → Controllers → Services → Models (clear separation)
2. **Repository Pattern**: Data access abstracted from business logic
3. **Middleware-Heavy RBAC**: Permissions checked before route handlers
4. **Centralized Error Handling**: Custom AppError hierarchy + global handler
5. **Structured Logging**: Pino with request correlation IDs

## 📊 API Endpoints

### Auth (3)
- `POST /api/v1/auth/login` — Login
- `POST /api/v1/auth/logout` — Logout
- `GET /api/v1/auth/verify` — Verify token

### Attendance (4)
- `POST /api/v1/attendance/checkin` — Check in
- `POST /api/v1/attendance/checkout` — Check out
- `GET /api/v1/attendance/own` — Own attendance
- `GET /api/v1/attendance/team` — Team attendance (Manager/HR)

### Leave (6)
- `POST /api/v1/leave/apply` — Apply for leave
- `GET /api/v1/leave/own` — Own leave requests
- `GET /api/v1/leave/pending` — Pending (Manager)
- `GET /api/v1/leave/all` — All (HR)
- `POST /api/v1/leave/:id/approve` — Approve (Manager)
- `POST /api/v1/leave/:id/reject` — Reject (Manager)

### HR (7)
- `GET /api/v1/hr/users` — List users
- `POST /api/v1/hr/users` — Create user
- `PATCH /api/v1/hr/users/:id` — Update user
- `PATCH /api/v1/hr/users/:id/deactivate` — Deactivate
- `GET /api/v1/hr/leave-types` — List leave types
- `POST /api/v1/hr/leave-types` — Create leave type
- `PATCH /api/v1/hr/leave-types/:id` — Update leave type

## ⚠️ Assumptions

1. All timestamps stored in UTC
2. Leave days calculated as working days (Mon-Fri)
3. Manager can only view/approve reportees (not other teams)
4. HR cannot check-in/check-out (administrative role)
5. One check-in per calendar day per user
6. Password minimum length: 6 characters
7. Leave quota is per calendar year

## 🔮 Future Improvements

- Docker + Docker Compose for containerization
- Redis for session caching (reduce DB load)
- Email notifications on leave approval/rejection
- Excel/PDF export for reports
- GitHub Actions CI/CD pipeline
- Request correlation ID propagation
- Database connection health checks
- Audit log table for compliance
