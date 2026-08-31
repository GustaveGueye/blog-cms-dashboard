# Ultron Dashboard - Fullstack Web Application

## 📱 Project Overview
**Project 5 Dashboard** - Fullstack application built with Node.js + Express + SQLite + JWT authentication + Blog CMS. Created as part of an AI training program using **free YouTube resources only** (no paid courses).

**Status**: ✅ 13/13 tests passing (GREEN Phase) | ✅ TDD methodology | ✅ Production-ready

---

## 🛠️ Tech Stack

| Category | Technologies |
|----------|-------------|
| **Backend** | Node.js, Express.js, SQLite (sync API), bcrypt, jsonwebtoken |
| **Authentication** | JWT tokens, bcrypt password hashing, httpOnly cookies, SameSite=Lax |
| **Database** | SQLite with custom synchronous API (users, sessions, metrics, posts tables) |
| **Frontend** | HTML5, CSS3, vanilla JavaScript (ES modules), Chart.js CDN |
| **Design** | Linear dark mode, responsive, mobile-first, CSS variables |
| **Testing** | Jest + TDD (RED-GREEN-REFACTOR workflow) |
| **Deployment** | Render.com free tier with 1GB persistent disk for SQLite |

---

## ✨ Features

### Authentication & Security
- ✅ User registration with bcrypt password hashing
- ✅ Login with JWT tokens stored in httpOnly cookies
- ✅ Token verification on protected routes
- ✅ Session cleanup and logout
- ✅ Cookie-secure settings for production

### Blog CMS
- ✅ Create posts with title, content, slug, excerpt, cover image
- ✅ Status management (draft/published/archived)
- ✅ Published posts with slug-based URLs
- ✅ Owner-only authorization on all post operations
- ✅ Post statistics and summaries
- ✅ Search and filtering by status/title

### User Management
- ✅ User registration and login
- ✅ Profile data (name, email)
- ✅ Metrics tracking (customizable data points)
- ✅ User list with status toggle (admin view)

### Dashboard UI
- ✅ Dark-mode responsive design
- ✅ Chart.js interactive line chart
- ✅ Cookie-based auth state management
- ✅ Real-time data fetching from backend API
- ✅ Mobile-first layout

### Testing
- ✅ **13/13 tests passing** (all auth flow functional)
- ✅ Unit tests using direct module imports
- ✅ Shared DB instance for faster, more reliable tests
- ✅ Edge case coverage (duplicate registration, DB cleanup, cookie parsing)

---

## 🚀 Quick Start

### Local Development
```bash
# 1. Clone repository
git clone https://github.com/ghost5068759611/ultron-dashboard.git
cd ultron-dashboard

# 2. Start backend
cd backend
npm install
node src/index.js

# 3. Open frontend
open frontend/index.html

# 4. Visit API
# http://localhost:3001/health
# http://localhost:3001/api/auth/me (with cookie)
```

### Test Suite
```bash
cd backend && npx jest tests/auth.test.js --no-coverage --verbose
# Expected: 13/13 passing (GREEN)
```

### Environment Variables
Create `.env` in backend directory:
```
JWT_SECRET=votre-secret-ici
JWT_EXPIRES_IN=7d
PORT=3001
```

---

## 📊 API Endpoints

### Auth Routes (`/api/auth`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/register` | Register new user |
| `POST` | `/login` | Login & set cookie |
| `POST` | `/logout` | Clear token cookie |
| `GET` | `/me` | Get current user data |

### Posts Routes (`/api/posts`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/posts/published` | No | List published posts |
| `GET` | `/posts/published/:slug` | No | Get single post |
| `POST` | `/posts` | ✅ | Create new post |
| `GET` | `/posts` | ✅ | List user's posts |
| `GET` | `/posts/stats/summary` | ✅ | Get post stats |
| `GET` | `/posts/:id` | ✅ | Get post by ID |
| `PUT` | `/posts/:id` | ✅ | Update post |
| `DELETE` | `/posts/:id` | ✅ | Delete post |

### Users Routes (`/api/users`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | List all users |
| `DELETE` | `/:id` | Delete user |
| `PUT` | `/:id/toggle` | Toggle user status |

### Health Check
- `GET /health` → `{"status":"ok","timestamp":"..."}`

---

## 📚 Learning Resources

This project was built as part of an **AI/ML training program** using **free YouTube resources**:

### Linear Algebra (Phase 0)
- 3Blue1Brown playlist (15 videos)
- Pace: 3 videos/day, 7-day program
- Completed: All 15 videos ✅

### Web Development Roadmap
- **Phase 1**: Vanilla HTML/CSS/JS + TDD with Jest ✅
- **Phase 2**: Node.js + Express + SQLite backend ✅
- **Phase 3**: JWT + bcrypt authentication ✅
- **Phase 4**: Full API with metrics + users ✅
- **Phase 5**: Blog/CMS with CRUD operations ✅
- **Phase 6**: Deployment to Render.com ✅

### Design Resources
- 54 design templates from `popular-web-designs` skill
- Mockup creation via `sketch` skill
- UI patterns from `ui-ux-pro-max` skill

---

## 📬 Contact & Portfolio

**GitHub**: [@ghost5068759611](https://github.com/ghost5068759611)

**Built with**: 
- ☕ Free YouTube resources only
- 🧪 TDD methodology (test-driven development)
- 🎨 Linear dark mode design
- 📱 Mobile-first responsive approach
- 🔒 Secure authentication (JWT + bcrypt)

**Current Focus**: AI Training Program Phase 0 (Linear Algebra) + WebDev Practice Projects 1-5

---

## 🛡️ Security Notes

- Passwords: Hashed with bcrypt (12 salt rounds)
- Tokens: JWT signed with secret, stored in httpOnly cookies
- CSRF: Resistant via httpOnly + SameSite=Lax cookies
- SQLite: Sync API for deterministic tests, persistent disk for production
- Production: Set `JWT_SECRET` environment variable, enable `secure: true` cookie flag

---

## 📄 License

MIT License - feel free to use as portfolio piece or starting point for your own projects.