# blog-cms-dashboard (formerly Dashboard)

Project 5 Dashboard - Fullstack web application with SQLite, JWT authentication, and Blog CMS.

## Objective

Fullstack application built as part of an AI training program. Demonstrates:

- Node.js + Express REST API
- SQLite database with better-sqlite3
- JWT authentication (register, login, logout)
- Blog CMS with create/read/update/delete posts
- User management (list, delete, toggle status)
- Metrics collection and summaries
- 13/13 test passing (TDD)

## Stack

- **Backend**: Node.js, Express, SQLite, better-sqlite3, JWT, bcrypt
- **Frontend**: Vanilla JS, Chart.js (metrics display)
- **Testing**: Jest, 13 test cases covering auth + blog + users

## Quick Start

```bash
# Install dependencies
npm install

# Start server
npm run dev  # or: node backend/server.js

# Access API at http://localhost:8081
# API docs: GET /api/health, POST /api/auth/register, etc.

# Run tests
npm test
```

## API Endpoints (Main)

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |
| POST | `/api/auth/logout` | Logout user |
| GET | `/api/auth/me` | Get current user |

### Blog Posts

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/posts` | List all posts |
| POST | `/api/posts` | Create new post |
| GET | `/api/posts/:id` | Get single post |
| PUT | `/api/posts/:id` | Update post |
| DELETE | `/api/posts/:id` | Delete post |

### Users

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users` | List all users |
| PATCH | `/api/users/:id` | Toggle user status |

## License

MIT — Practice project (AI Training Program Phase 0)