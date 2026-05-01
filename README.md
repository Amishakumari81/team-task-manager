# ⚡ TaskFlow — Team Task Manager

A full-stack web application for managing team projects and tasks with role-based access control.

---

## 🚀 Features

- **Authentication** — Signup / Login with JWT tokens
- **Role-Based Access** — Admin & Member roles with different permissions
- **Project Management** — Create, view, update, delete projects (Admin)
- **Team Management** — Add/remove members to projects (Admin)
- **Task Management** — Create, assign, update, and delete tasks
- **Task Tracking** — Status tracking (To Do → In Progress → Review → Done)
- **Priority Levels** — Low, Medium, High, Urgent
- **Due Dates & Overdue Detection** — Visual overdue warnings
- **Dashboard** — Stats overview, status breakdown, overdue tasks
- **User Management** — View all users, change roles (Admin)

---

## 🛠 Tech Stack

| Layer     | Technology                         |
|-----------|-------------------------------------|
| Frontend  | React 18, React Router v6, Axios   |
| Backend   | Node.js, Express.js                 |
| Database  | SQLite (via better-sqlite3)         |
| Auth      | JWT (jsonwebtoken), bcryptjs        |

---

## ⚙️ Setup Instructions

### Prerequisites
- **Node.js** v16 or higher → https://nodejs.org
- **npm** (comes with Node.js)

---

### Step 1 — Install Dependencies

Open **two terminals** in VS Code.

**Terminal 1 (Backend):**
```bash
cd backend
npm install
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm install
```

---

### Step 2 — Start the Backend

In Terminal 1:
```bash
cd backend
npm run dev
```

You should see:
```
✅ Database initialized successfully
🚀 Server running on http://localhost:5000
```

---

### Step 3 — Start the Frontend

In Terminal 2:
```bash
cd frontend
npm start
```

The app will open at **http://localhost:3000**

---

## 👤 Getting Started

1. Go to **http://localhost:3000**
2. Click **"Create one"** to sign up
3. Choose **Admin** role to have full access
4. Create projects, add members, and assign tasks!

---

## 📁 Project Structure

```
team-task-manager/
├── backend/
│   ├── server.js              # Express app entry point
│   ├── models/
│   │   └── database.js        # SQLite DB setup & schema
│   ├── middleware/
│   │   └── auth.js            # JWT authentication middleware
│   ├── routes/
│   │   ├── auth.js            # POST /signup, /login, GET /me
│   │   ├── projects.js        # CRUD for projects & members
│   │   ├── tasks.js           # CRUD for tasks + dashboard
│   │   └── users.js           # User management
│   ├── data/                  # SQLite DB file (auto-created)
│   └── package.json
│
└── frontend/
    ├── public/
    │   └── index.html
    └── src/
        ├── App.js             # Routes
        ├── index.js           # Entry point
        ├── index.css          # Global styles
        ├── context/
        │   └── AuthContext.js # Global auth state
        ├── components/
        │   └── Layout.js      # Sidebar + navigation
        ├── pages/
        │   ├── Login.js
        │   ├── Signup.js
        │   ├── Dashboard.js
        │   ├── Projects.js
        │   ├── ProjectDetail.js
        │   ├── Tasks.js
        │   └── Users.js
        └── utils/
            └── api.js         # Axios API calls + helpers
```

---

## 🔐 API Endpoints

### Auth
| Method | Endpoint          | Description       | Auth |
|--------|-------------------|-------------------|------|
| POST   | /api/auth/signup  | Register new user | No   |
| POST   | /api/auth/login   | Login             | No   |
| GET    | /api/auth/me      | Get current user  | Yes  |

### Projects
| Method | Endpoint                          | Description        | Role   |
|--------|-----------------------------------|--------------------|--------|
| GET    | /api/projects                     | List projects      | All    |
| POST   | /api/projects                     | Create project     | Admin  |
| GET    | /api/projects/:id                 | Project detail     | All    |
| PUT    | /api/projects/:id                 | Update project     | Admin  |
| DELETE | /api/projects/:id                 | Delete project     | Admin  |
| POST   | /api/projects/:id/members         | Add member         | Admin  |
| DELETE | /api/projects/:id/members/:userId | Remove member      | Admin  |

### Tasks
| Method | Endpoint              | Description       | Role      |
|--------|-----------------------|-------------------|-----------|
| GET    | /api/tasks            | List tasks        | All       |
| GET    | /api/tasks/dashboard  | Dashboard stats   | All       |
| POST   | /api/tasks            | Create task       | All       |
| PUT    | /api/tasks/:id        | Update task       | Owner/Admin|
| DELETE | /api/tasks/:id        | Delete task       | Owner/Admin|

### Users
| Method | Endpoint              | Description       | Role  |
|--------|-----------------------|-------------------|-------|
| GET    | /api/users            | List users        | All   |
| PUT    | /api/users/:id/role   | Change user role  | Admin |

---

## 🎭 Roles & Permissions

| Action                  | Admin | Member |
|-------------------------|-------|--------|
| Create project          | ✅    | ❌     |
| Delete project          | ✅    | ❌     |
| Add/remove members      | ✅    | ❌     |
| Create tasks            | ✅    | ✅     |
| Edit own tasks          | ✅    | ✅     |
| Delete own tasks        | ✅    | ✅     |
| Edit any task           | ✅    | ❌     |
| Delete any task         | ✅    | ❌     |
| Manage user roles       | ✅    | ❌     |
| View all users          | ✅    | ❌*    |

*Members can see users in their shared projects only.

---

## 🐛 Troubleshooting

**Port already in use:**
```bash
# Kill process on port 5000
npx kill-port 5000
```

**Database issues:**
```bash
# Delete and recreate
rm backend/data/taskmanager.db
# Restart the backend
```

**npm install fails:**
```bash
# Clear cache and retry
npm cache clean --force
npm install
```
