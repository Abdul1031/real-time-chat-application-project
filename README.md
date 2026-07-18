# Chatty — Real-Time Chat Application

A full-stack, production-ready **MERN** real-time messaging app. Secure JWT-cookie auth, instant Socket.IO messaging, presence, typing indicators, read receipts, emoji reactions, replies, unread badges with desktop notifications, in-chat search, infinite-scroll history, image uploads via Cloudinary, and 32 selectable themes.

**Live demo:** _add your deployed URL here after following the [Deployment](#deployment) section below_
**Source:** https://github.com/Abdul1031/real-time-chat-application-project

---

## Features

- **Auth** — email/password signup & login, JWT stored in an `httpOnly` cookie, session persistence, profile photo upload
- **Real-time messaging** — 1:1 conversations over Socket.IO, multi-tab/multi-device aware
- **Presence** — live online/offline status, "online only" contact filter
- **Typing indicators** — debounced, per-conversation
- **Read receipts** — sent → delivered → seen ticks
- **Reactions** — emoji reactions on any message, synced live
- **Replies** — quote-reply to a specific message with click-to-scroll
- **Unread badges & notifications** — per-contact unread counts, browser notifications and a tab-title badge for messages received while the tab is unfocused
- **Search** — filter contacts and search within an open conversation
- **Infinite scroll** — paginated message history, loads older messages on scroll
- **Optimistic sending** — messages appear instantly with a retry affordance if the send fails
- **Image sharing** — drag-in image messages and profile photos via Cloudinary
- **32 themes** — light/dark and 30 more via DaisyUI, persisted per-browser
- **Hardened backend** — rate limiting, Helmet security headers, input validation, centralized error handling

## Tech stack

| Layer | Stack |
|---|---|
| Frontend | React 18, TypeScript, Vite, Zustand, Tailwind CSS + DaisyUI, React Router, Socket.IO client, Axios, react-hot-toast |
| Backend | Node.js, Express 5, Socket.IO, MongoDB + Mongoose, JWT, bcrypt, Cloudinary, Helmet, express-rate-limit |
| Dev DB | Falls back to an in-memory MongoDB automatically when `MONGODB_URI` isn't set — zero-config local development |

## Project structure

```
.
├── backend/            Express + Socket.IO API server
│   └── src/
│       ├── controllers/    route handlers (auth, messages)
│       ├── middleware/     JWT auth guard, rate limiter
│       ├── models/         Mongoose schemas (User, Message)
│       ├── lib/             db connection, socket server, cloudinary, validation, cookie helpers
│       ├── routes/         Express routers
│       └── seeds/          default dev users seeded into an empty DB
├── frontend/            React + TypeScript SPA (Vite)
│   └── src/
│       ├── components/     chat UI (Sidebar, ChatContainer, MessageBubble, ...)
│       ├── pages/          routed pages (Login, SignUp, Home, Profile, Settings)
│       └── store/          Zustand stores (auth, chat, theme)
├── render.yaml          Render deploy blueprint for the backend
└── frontend/vercel.json Vercel SPA rewrite config
```

## Getting started locally

**Prerequisites:** Node.js 18+, npm.

```bash
git clone https://github.com/Abdul1031/real-time-chat-application-project.git
cd real-time-chat-application-project

cd backend && npm install && cd ..
cd frontend && npm install && cd ..
```

Copy the env templates and fill in what you have (both work with zero configuration for local dev — see notes below):

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Run both dev servers (separate terminals):

```bash
cd backend && npm run dev     # http://localhost:3001
cd frontend && npm run dev    # http://localhost:5173
```

Open `http://localhost:5173`. Two accounts are seeded automatically into an empty database so you can test messaging between two users right away:

| Email | Password |
|---|---|
| `ronaldo@gmail.com` | `admin@1234` |
| `messi@gmail.com` | `admin@1234` |

> **Note on local data:** if `MONGODB_URI` is left blank, the backend automatically starts an **in-memory MongoDB** — perfect for zero-setup development, but all data (including signups) is wiped every time the backend process restarts. Set a real `MONGODB_URI` (see [Deployment](#deployment)) for data that persists across restarts.

### Useful scripts

| Location | Command | Does |
|---|---|---|
| `backend/` | `npm run dev` | Start the API + Socket.IO server with auto-restart (nodemon) |
| `backend/` | `npm start` | Start the server (production mode, no auto-restart) |
| `frontend/` | `npm run dev` | Start the Vite dev server |
| `frontend/` | `npm run build` | Type-check (`tsc -b`) then build the production bundle |
| `frontend/` | `npm run typecheck` | Type-check only |
| `frontend/` | `npm run lint` | Run ESLint |

## Environment variables

**`backend/.env`**

| Var | Required | Notes |
|---|---|---|
| `PORT` | no | Defaults to `3001`. Render sets this automatically in production. |
| `NODE_ENV` | yes in prod | `development` or `production` |
| `MONGODB_URI` | recommended | Real MongoDB connection string. Omit for the in-memory dev fallback. |
| `JWT_SECRET` | yes | Long random string signing the auth cookie. |
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | yes for image uploads | From your Cloudinary dashboard. |
| `FRONTEND_URL` | yes in prod | Your deployed frontend origin, for CORS + cookie config. |

**`frontend/.env`**

| Var | Required | Notes |
|---|---|---|
| `VITE_API_URL` | yes | Backend API base URL, e.g. `https://your-backend.onrender.com/api` |

## Deployment

This app deploys as **two separate services**: the frontend (static Vite build) on **Vercel**, and the backend (Express + persistent Socket.IO connections) on **Render**. Socket.IO needs a long-lived process, which is why the backend isn't deployed as Vercel serverless functions.

### 1. Create a MongoDB Atlas cluster (free tier)

1. Sign up at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas/register) and create a free (M0) cluster.
2. Under **Database Access**, create a database user with a password.
3. Under **Network Access**, add `0.0.0.0/0` (allow access from anywhere) so Render can connect.
4. Under **Database → Connect → Drivers**, copy the connection string — it looks like:
   `mongodb+srv://<username>:<password>@<cluster>.mongodb.net/chatapp?retryWrites=true&w=majority`
   Replace `<username>`/`<password>` with your database user's credentials.

### 2. Create a Cloudinary account (free tier)

1. Sign up at [cloudinary.com](https://cloudinary.com/users/register/free).
2. Your **Cloud Name**, **API Key**, and **API Secret** are on the Cloudinary dashboard home page — copy all three.

### 3. Deploy the backend to Render

1. Push this repo to your GitHub account (already done if you're reading this from the repo).
2. Go to [render.com](https://render.com), sign up/log in, and click **New → Blueprint**.
3. Connect your GitHub account and select this repository — Render will detect `render.yaml` at the repo root and configure the service automatically (root directory `backend`, build `npm install`, start `npm start`).
4. Before the first deploy completes, set these environment variables in the Render dashboard (they're marked `sync: false` in the blueprint, so Render will prompt for them):
   - `MONGODB_URI` — from step 1
   - `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` — from step 2
   - `FRONTEND_URL` — leave as `http://localhost:5173` for now, you'll update it after step 4 deploys the real frontend URL
   - `JWT_SECRET` is auto-generated by the blueprint — no action needed
5. Deploy. Once live, copy your backend's URL, e.g. `https://chatty-backend-xxxx.onrender.com`.

### 4. Deploy the frontend to Vercel

1. Go to [vercel.com](https://vercel.com), sign up/log in, and click **Add New → Project**.
2. Import the same GitHub repository.
3. Set **Root Directory** to `frontend` (important — this is a monorepo).
4. Framework preset should auto-detect as **Vite**; leave build command/output as default (`npm run build` / `dist`).
5. Add an environment variable: `VITE_API_URL` = `https://chatty-backend-xxxx.onrender.com/api` (your Render URL from step 3, with `/api` appended).
6. Deploy. Copy your frontend's URL, e.g. `https://your-app.vercel.app`.

### 5. Wire the two together

Go back to the Render dashboard → your backend service → **Environment**, and update `FRONTEND_URL` to your real Vercel URL from step 4 (e.g. `https://your-app.vercel.app`). Render will redeploy automatically.

That's it — open your Vercel URL and the app is live. Both platforms auto-deploy on every push to `main`.

## Security notes

- Passwords are hashed with bcrypt; JWTs are stored in an `httpOnly`, `sameSite`, `secure` (in production) cookie — never in `localStorage`.
- Auth endpoints are rate-limited (20 requests / 15 min per IP) to slow down credential-stuffing attempts.
- Helmet sets standard security headers; CORS is restricted to the configured frontend origin(s).
- All request bodies (email format, image data URIs, message length) are validated server-side.

## License

ISC
