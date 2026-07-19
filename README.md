# 🏛️ Civic Connect

### *AI-Powered Neural Infrastructure & Grievance Routing for Modern Smart Cities*

[![Next.js Version](https://img.shields.io/badge/Next.js-15.5.6-black?style=flat-for-the-badge&logo=next.js)](https://nextjs.org/)
[![React Version](https://img.shields.io/badge/React-19.2.4-blue?style=flat-for-the-badge&logo=react)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4.0-cyan?style=flat-for-the-badge&logo=tailwindcss)](https://tailwindcss.com/)
[![Three.js](https://img.shields.io/badge/Three.js-r184-black?style=flat-for-the-badge&logo=three.js)](https://threejs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-Python-009688?style=flat-for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![PyTorch](https://img.shields.io/badge/PyTorch-ML-EE4C2C?style=flat-for-the-badge&logo=pytorch)](https://pytorch.org/)

---

**Civic Connect** is an ultra-high-fidelity, state-of-the-art smart city governance and complaint routing platform. It integrates real-time 3D WebGL visualizations, advanced computer vision (EfficientNetB0), multilingual NLP (Google MuRIL), LLM orchestration (Groq + OpenRouter), and automatic priority assignment to revolutionize how citizens report municipal issues and how city agencies respond.

---

## 📋 Table of Contents
- [Architectural Pipeline](#-architectural-pipeline)
- [Pages & Routes](#-pages--routes)
- [User Roles & Permissions](#-user-roles--permissions)
- [Complaint System](#-complaint-system)
- [AI Features](#-ai-features)
- [SLA System](#-sla-system)
- [Gamification](#-gamification)
- [Notification System](#-notification-system)
- [Map Features](#-map-features)
- [Premium Features](#-premium-features)
- [Technology Stack](#-technology-stack)
- [Repository Blueprint](#-repository-blueprint)
- [API Endpoints](#-api-endpoints)
- [Installation & Setup](#-installation--local-launch)
- [Troubleshooting](#-troubleshooting)
- [Credentials](#-credentials--profiles-reference)

---

## 🗺️ Architectural Pipeline

```mermaid
graph TD
    subgraph Input ["1. Input Channel"]
        Image[📷 Visual Evidence]
        Audio[🎤 Dictated Speech]
        Text[✍️ Vernacular Text]
    end

    subgraph AI ["2. AI Neural Pipeline"]
        Vision["📷 VisionEye Anomaly Detector<br/>(EfficientNetB0)"]
        BLIP["🖼️ ContextAI Analyzer<br/>(BLIP Visual QA)"]
        NLP["🗣️ PolyglotNLP Dialect Core<br/>(MuRIL Transformer)"]
        Whisper["🎙️ CivicVoice Transcriber<br/>(OpenAI Whisper)"]
        LLM["🧠 LLM Action Synthesizer<br/>(Groq Llama / GPT-4o-mini)"]
    end

    subgraph Action ["3. Predictive Dispatch & Vis"]
        Router["⚡ Predictive Smart Router<br/>(ML Forecasting Classifier)"]
        Heatmap["🌐 WebGL Particle Heatmap<br/>(Three.js Cluster Matrix)"]
        Command["🖥️ Smart City Command Center<br/>(Department Work Orders)"]
    end

    Image --> Vision
    Image --> BLIP
    Audio --> Whisper --> NLP
    Text --> NLP

    Vision --> LLM
    BLIP --> LLM
    NLP --> LLM

    LLM --> Router
    Router --> Heatmap
    Router --> Command

    classDef default fill:#090d16,stroke:#1e293b,color:#fff;
    classDef input fill:#003c4f,stroke:#06b6d4,color:#fff;
    classDef ai fill:#2a004f,stroke:#8b5cf6,color:#fff;
    classDef action fill:#0f3817,stroke:#10b981,color:#fff;

    class Image,Audio,Text input;
    class Vision,BLIP,NLP,Whisper,LLM ai;
    class Router,Heatmap,Command action;
```

---

## 📄 Pages & Routes

| Route | Page | Access |
|-------|------|--------|
| `/` | Sign-In page with role selector | Public |
| `/home` | Landing page (Hero, Problem, Solution, Technology, Live Demo, Heatmap, Command Center, Roadmap, Impact Metrics, Team, CTA, Footer) | Public |
| `/transparency` | Public Transparency Portal (stats, trends, dept performance, ward data) | Public |
| `/feedback` | User feedback form (5-star rating, 5 categories) | Authenticated |
| `/forgot-password` | Password recovery request | Public |
| `/reset-password` | Password reset form | Public |
| `/citizen/dashboard` | Citizen landing + Live Demo integration | CITIZEN, ADMIN |
| `/citizen/complaint` | Register a new complaint with AI analysis + map picker | CITIZEN, ADMIN |
| `/citizen/complaints` | View/edit/delete complaints with status tracker | CITIZEN, ADMIN |
| `/citizen/profile` | Profile settings, security logs, activity history | Authenticated |
| `/profile` | Generic profile page | Authenticated |
| `/officer/dashboard` | Officer Console — Tasks, Field Map, Performance, Comms Hub, Resources, Schedule | OFFICER, ADMIN |
| `/admin/dashboard` | Admin Console — Overview, Complaints, Departments, Users, GIS Map, Analytics, Audit, Broadcast, Budget, Settings | ADMIN |

**Global Layout Components:**
- `ThemeProvider` — Dark/light/system theme support via `next-themes`
- `AuthProvider` — JWT-based authentication context
- `SmoothScroll` — Lenis-powered smooth scrolling
- `GlobalBackground` — Three.js neural network particle canvas + cinematic video
- `Navbar` — Responsive navigation with user dropdown
- `CivicAI` — Floating AI chatbot assistant (bottom-right)
- `CommandPalette` — Quick navigation command palette
- `ServiceWorkerRegister` — PWA service worker registration
- `Toaster` — Sonner toast notifications

---

## 👤 User Roles & Permissions

### CITIZEN
- File complaints via text, image, or voice
- View and track own complaints with status history
- Edit/delete own complaints
- Manage profile and notification preferences
- Submit feedback
- Earn gamification points and badges

### OFFICER
- View complaints filtered by department
- Update complaint status (In Progress, Resolved)
- View field map with geospatial complaint data
- Add resolution notes and evidence
- View hotspot predictions
- **Cannot** assign officers or delete complaints

### ADMIN
- Full user management (change roles, enable/disable accounts)
- Department CRUD (create, edit, delete)
- Assign officers to complaints
- Update/delete any complaint
- View analytics and dashboards
- Verify resolutions
- Send broadcast notifications
- Award gamification points

---

## 📝 Complaint System

### Lifecycle
```
Pending → Assigned → In Progress → Resolved
```

### How to File a Complaint
1. Navigate to the Live Demo section or `/citizen/complaint`
2. Upload an image **OR** type a description **OR** record voice
3. AI auto-classifies: issue type, department, priority
4. Pin location on the interactive Leaflet map (click or GPS)
5. Optionally generate an AI request letter
6. System checks for duplicates
7. Submit — get a confirmation with complaint ID
8. Track status at `/citizen/complaints`

### Supported Issue Types
| Category | Issues |
|----------|--------|
| **Road Infrastructure** | Potholes, broken roads, road cracks, erosion, damaged pavements, missing signs |
| **Drainage** | Blocked/overflowing drainage, water logging, sewage overflow |
| **Street Lights** | Broken lights, damaged poles, missing/non-functional lights |
| **Sanitation** | Garbage accumulation, overflowing dustbins, illegal dumping |
| **Water Supply** | Water leakage, broken pipes, overflowing water |
| **Electricity** | Exposed wires, damaged poles, transformer problems |
| **Public Safety** | Fallen trees, open manholes, broken railings, dangerous structures |
| **Traffic** | Broken signals, missing signs, road obstructions |

---

## 🤖 AI Features

### CivicAI Chatbot
- Floating chat widget on every page (bottom-right corner)
- Answers questions about platform features, civic issues, and governance
- Quick actions: File complaint, Check status, How AI helps, Platform features
- Powered by Groq (Llama 3.1 8B) with automatic fallback to OpenRouter (GPT-4o-mini)

### Image Analysis (`POST /api/upload`)
- Upload an image of a civic issue
- AI detects issue type, category, department, severity, priority, confidence
- Returns structured JSON with summary and recommended resolution time
- Rate limit: 5/minute

### Multimodal Analysis (`POST /api/ai/analyze`)
- Accepts image + optional text description
- Translates description to English (if in Telugu/Hindi)
- Runs EfficientNetB0-based classifier
- Generates image caption via vision LLM
- Predicts priority
- Rate limit: 10/minute

### Text Analysis (`POST /api/ai/analyze_text`)
- Analyzes text descriptions of civic issues
- Returns: title, cleaned description, department, priority, confidence
- Rate limit: 15/minute

### Voice Transcription (`POST /api/ai/transcribe`)
- Transcribes audio recordings via Groq Whisper-large-v3
- Supports Telugu, Hindi, English, and code-mixed speech

### Request Letter Generation (`POST /api/ai/request-note`)
- Generates formal request letters to government departments
- Includes issue details, location, and priority

### Duplicate Detection (`POST /api/check-duplicate`)
- Checks new complaints against existing ones (45% similarity threshold)
- Returns top 5 matches with similarity scores
- Prevents duplicate complaint submissions

### Hotspot Prediction (`GET /api/predictions/hotspots`)
- Predicts complaint hotspots for the next 7 days
- Uses historical density analysis
- Displayed as colored circles on the officer map

### LLM Orchestration
- **Primary:** Groq API (`llama-3.1-8b-instant` for text, `llama-3.2-11b-vision-preview` for vision)
- **Fallback:** OpenRouter (`openai/gpt-4o-mini`)
- Automatic failover if primary service is unavailable

---

## ⏱️ SLA System

### Department Deadlines
| Department | Base SLA | Escalation To |
|------------|----------|---------------|
| Safety | 12 hours | POLICE |
| Electricity | 24 hours | POWER_COMPANY |
| Garbage | 24 hours | SANITATION |
| Traffic | 24 hours | TRAFFIC_POLICE |
| Drainage | 48 hours | WATER_BOARD |
| Water | 48 hours | WATER_BOARD |
| Streetlight | 72 hours | ELECTRICAL |
| Roads | 168 hours (7 days) | PUBLIC_WORKS |
| General | 120 hours (5 days) | ADMIN |

### Priority Multipliers
- **Critical:** 0.25x (e.g., Safety critical = 3 hours)
- **High:** 0.5x
- **Medium:** 1.0x
- **Low:** 1.5x

### SLA Status Levels
- `ON_TRACK` — Less than 60% of deadline used
- `WARNING` — 60-80% used
- `CRITICAL` — 80-100% used
- `OVERDUE` — Past deadline

### Escalation Chain
```
Officer → Admin → Municipal Commissioner
```

A background task runs every 5 minutes checking all active complaints. Sends WebSocket notifications and auto-escalates overdue complaints.

---

## 🎮 Gamification

### Points System
| Action | Points |
|--------|--------|
| Complaint submitted | 10 |
| Complaint verified resolved | 25 |
| Upvote received | 5 |
| Daily active | 2 |

### Badges
| Badge | Requirement | Points |
|-------|-------------|--------|
| First Step | Submit first complaint | 10 |
| Complaint Warrior | Submit 5 complaints | 50 |
| Civic Champion | Submit 10 complaints | 100 |
| City Guardian | Submit 25 complaints | 250 |
| Verified Reporter | 3 complaints verified resolved | 75 |
| Streak Master | 7-day active streak | 100 |
| Priority Hunter | 3 high-priority complaints | 60 |
| Department Expert | Complaints in 3 different departments | 80 |

### Level System
11 levels with thresholds: 0, 50, 150, 300, 500, 750, 1000, 1500, 2000, 3000, 5000 points.

### Leaderboard
Tracks top 10 citizens by total points.

---

## 🔔 Notification System

### Notification Types
- `status_update` — Complaint status changed
- `assignment` — Officer assigned/unassigned
- `complaint_submitted` — Complaint successfully created
- `complaint_resolved` — Complaint marked as resolved
- `sla_warning` — SLA approaching deadline
- `sla_breach` — SLA exceeded, auto-escalated

### Delivery
- **WebSocket:** Persistent connection at `ws://host/ws/notifications/{user_id}`
- **REST API:** Full CRUD endpoints with unread count
- **UI:** Notification bell in navbar, sonner toasts for real-time alerts
- Automatic polling every 30 seconds for unread count

---

## 🗺️ Map Features

### Citizen Map Picker
- Leaflet + OpenStreetMap tiles
- Default center: Hyderabad (17.385, 78.4867)
- Click-to-pin, GPS detection, address search via Nominatim
- Reverse geocoding for location names

### Officer Field Map
- Color-coded markers by priority (red=high, amber=medium, green=low)
- Marker clustering for dense areas
- Hotspot prediction overlay (intensity-colored circles)
- Search, priority filter, status filter
- Auto-refresh every 30 seconds with live counter

---

## ✨ Premium Features

### 1. 🧬 Multi-Modal AI Core
- **VisionEye Anomaly Detection:** EfficientNetB0 classifying visual anomalies across 8 categories
- **ContextAI Multimodal Analyzer:** BLIP-powered image context extraction
- **PolyglotNLP Dialect Core:** Google MuRIL transformer supporting Telugu-English code-mixed text, Hindi, and regional dialects
- **Vision-Text Fusion Layer:** Concatenates EfficientNetB0 visual features with MuRIL text embeddings through a learned fusion layer, predicting department (8 classes) and priority (low/medium/high)
- **CivicVoice Transcriber:** OpenAI Whisper for voice-based grievance registration in Telugu, Hindi, and English
- **LLM Action Synthesizer:** Municipal briefing generator via Groq Llama / GPT-4o-mini
- **Predictive Smart Router:** Auto-assigns complaints to officers with lowest workload
- **Rate Limiting & Media Optimization:** SlowAPI protection + Pillow dynamic image compression

### 2. 🌌 High-Fidelity 3D Visual Experience
- **Interactive 3D WebGL Canvas:** Dynamic Three.js + React Three Fiber neural network particle system
- **WebGL Smart City Heatmap:** 30+ pulsating hotspots, undulating terrain, orbital camera sweep
- **Orbital Resolution Engine:** 8-stage pipeline visualized as 3D core with orbiting spheres
- **GSAP Scroll-Driven Transitions:** GreenSock ScrollTrigger with pinned horizontal/vertical scroll sections
- **3D Holographic Command Center:** Animated charts, live alert feed, staggered entrance animations

### 3. 👤 Dynamic RBAC Authentication
- **Role-Based Dashboards:** Segregated portals for Citizen, Officer, and Admin
- **Smart Routing:** Auth-protected routes with `withRoleGuard` and `withAuthGuard` HOCs
- **Citizen Profile Panel:** Notification preferences, security logs, activity history
- **Feedback System:** `/feedback` page with 5-star rating and category selector

### 4. ⚡ Real-Time Notifications
- **WebSocket Architecture:** Persistent connections via FastAPI `ConnectionManager`
- **Instant Toasts:** Real-time sonner alerts on status changes, assignments, resolution
- **Full REST API:** CRUD endpoints with unread count

### 5. 📊 Admin Analytics
- **Live Recharts Dashboard:** KPIs, priority PieChart, department efficiency BarChart, weekly trends AreaChart
- **User Administration:** Inline role changes, account enable/disable, search
- **Department CRUD:** Full management interface
- **Complaint Lifecycle:** Complete update/delete with authorization rules

### 6. 🎨 Immersive UI/UX & PWA
- **PWA:** Installable on mobile devices with manifest and service worker
- **Animated Preloader:** Cyberpunk-style loading sequence with word animations
- **Live AI Demo Sandbox:** Interactive playground with image upload, voice recording, real-time classification
- **Technology Showcase:** 6 glassmorphism feature cards with scroll-reveal animations
- **Team Section:** 3D tilt-perspective member cards with per-accent gradients
- **Offline Support:** IndexedDB-based offline storage with background sync

---

## 🛠️ Technology Stack

| Domain | Technology | Description |
| :--- | :--- | :--- |
| **Frontend** | Next.js 15.5.6 (App Router), React 19.2.4, TypeScript | Server and Client rendering |
| **3D Graphics** | `@react-three/fiber`, `@react-three/drei`, Three.js r184 | WebGL particulate canvas |
| **Styling** | Tailwind CSS v4, Shadcn UI Tokens | Utility-first styling |
| **Motion** | GSAP 3.15.0 + ScrollTrigger, Framer Motion 12 | Fluid transitions |
| **Data Viz** | Recharts | Dynamic SVG charting |
| **Scrolling** | Lenis 1.3 | Smooth inertial scroll |
| **Icons** | Lucide React | Harmonized icon library |
| **Maps** | Leaflet + OpenStreetMap + Nominatim | Interactive mapping |
| **Forms** | React Hook Form + Zod | Form validation |
| **Testing (Frontend)** | Jest, ts-jest, @testing-library/jest-dom | Unit and integration tests |
| **Testing (Backend)** | pytest | Python unit tests |
| **Backend** | FastAPI (Python) + Uvicorn | REST API + WebSockets |
| **Database** | PostgreSQL + SQLAlchemy ORM | Data persistence |
| **Auth** | JWT (python-jose) + bcrypt | Token-based auth with HttpOnly cookies |
| **Vision ML** | EfficientNetB0 (PyTorch/TorchVision) | Image classification |
| **Text ML** | Google MuRIL (Transformers) | Multilingual NLP |
| **Multimodal** | Custom PyTorch fusion layer | Vision + Text fusion |
| **Speech** | Groq Whisper-large-v3 | Audio transcription |
| **LLM** | Groq API (Llama 3) + OpenRouter (GPT-4o-mini) | AI orchestration |
| **Rate Limiting** | SlowAPI | API abuse protection |
| **Image Processing** | Pillow | Resizing & compression |
| **HTTP Client** | Axios | API requests |

---

## 🗄️ Database Schema

### Core Tables

**Users**
- `id` (UUID) - Primary key
- `full_name`, `email`, `phone_number` - User identification
- `password_hash` - Bcrypt hashed password
- `role` - CITIZEN, OFFICER, or ADMIN
- `points`, `level` - Gamification fields
- `streak_days`, `last_active_date` - Activity tracking
- `department` - For officers

**Complaints**
- `id` (UUID) - Primary key
- `title`, `description` - Complaint details
- `location`, `latitude`, `longitude` - Geospatial data
- `department`, `priority`, `status` - Routing fields
- `image_url` - Evidence attachment
- `user_id`, `assigned_to` - Relationships to users
- `sla_deadline`, `sla_status` - SLA tracking
- `verification_status`, `verification_score` - Resolution verification

**Badges** (Normalized)
- `id`, `name`, `description`, `icon`, `points` - Badge metadata

**UserBadges** (Junction table)
- `user_id`, `badge_id`, `earned_at` - Many-to-many relationship

**Notifications**
- `id` (UUID) - Primary key
- `user_id` - Recipient
- `title`, `message`, `type` - Notification content
- `is_read` - Read status

---

## 📂 Repository Blueprint

```
civic-connect/
├── frontend/                          # Next.js frontend application
│   ├── src/
│   │   ├── app/                       # App Router pages
│   │   │   ├── layout.tsx             # Root layout with providers
│   │   │   ├── page.tsx               # Sign-In page
│   │   │   ├── home/                  # Landing page
│   │   │   ├── feedback/              # User feedback form
│   │   │   ├── transparency/          # Public analytics portal
│   │   │   ├── citizen/               # Citizen dashboard, complaints, profile
│   │   │   ├── officer/               # Officer dashboard
│   │   │   ├── admin/                 # Admin dashboard
│   │   │   ├── forgot-password/
│   │   │   ├── reset-password/
│   │   │   └── profile/
│   │   ├── components/
│   │   │   ├── chatbot/               # CivicAI chatbot widget
│   │   │   ├── canvas/                # Three.js/R3F 3D components
│   │   │   ├── sections/              # Landing page sections
│   │   │   ├── map/                   # Leaflet map components
│   │   │   ├── dashboard/             # Dashboard components
│   │   │   ├── auth/                  # Auth-related components
│   │   │   ├── ui/                    # Reusable UI components
│   │   │   ├── Navbar.tsx
│   │   │   ├── GlobalBackground.tsx
│   │   │   ├── SmoothScroll.tsx
│   │   │   ├── ThemeProvider.tsx
│   │   │   └── ServiceWorkerRegister.tsx
│   │   ├── auth/                      # Auth context, provider, API client
│   │   ├── hooks/                     # Custom React hooks
│   │   ├── lib/                       # Utility functions
│   │   ├── middleware/                # Role & auth guard HOCs
│   │   └── services/                  # API service layer
│   ├── public/                        # Static assets
│   ├── next.config.ts                 # Rewrites, headers, config
│   ├── jest.config.js                 # Jest test configuration
│   └── package.json
│
├── backend/                           # Python FastAPI backend
│   ├── app/
│   │   ├── main.py                    # FastAPI entry point
│   │   ├── ai/
│   │   │   ├── llm_client.py          # LLM orchestration (Groq → OpenRouter)
│   │   │   ├── predict.py             # EfficientNetB0 vision classifier
│   │   │   ├── priority_predictor.py  # LLM priority assignment
│   │   │   ├── translator.py          # Multilingual translation
│   │   │   ├── transcriber.py         # Audio transcription
│   │   │   ├── captioning.py          # Image captioning
│   │   │   ├── complaint_generator.py # Template-based complaint text
│   │   │   ├── request_note.py        # Formal request letter generator
│   │   │   ├── multimodal_model.py    # Custom PyTorch fusion model
│   │   │   ├── train_multimodal.py    # Multimodal training script
│   │   │   └── dataset_generator.py   # Dataset class
│   │   ├── auth/                      # JWT auth, registration, login
│   │   ├── core/                      # Config, security, rate limiting, SLA, gamification
│   │   ├── database/                  # SQLAlchemy models + DB connection
│   │   └── routers/                   # API route handlers
│   ├── tests/                         # Backend tests
│   │   ├── conftest.py                # Pytest configuration
│   │   ├── test_gamification.py       # Gamification unit tests
│   │   └── test_routes.py             # API route tests
│   ├── train_model.py                 # EfficientNetB0 training
│   ├── evaluate.py                    # Model evaluation
│   ├── balance_dataset.py             # Dataset balancing
│   ├── seeder.py                      # Database seeder
│   ├── seed_gamification.py           # Gamification data seeder
│   ├── update_db.py                   # Database migration script
│   ├── requirements.txt
│   └── .env
│
├── TRAIN_ON_COLAB.ipynb               # Google Colab training notebook
├── AGENTS.md                          # Agent instructions
├── CLAUDE.md                          # Claude configuration
└── README.md
```

---

## 📡 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login (sets HttpOnly refresh cookie) |
| POST | `/api/auth/logout` | Logout (clears refresh cookie) |
| POST | `/api/auth/refresh` | Refresh access token |
| GET | `/api/auth/me` | Current user info |
| POST | `/api/auth/forgot-password` | Request password reset |
| POST | `/api/auth/reset-password` | Reset password |

### Complaints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/complaints` | List all complaints |
| GET | `/api/complaints/my` | Current user's complaints |
| POST | `/api/complaints` | Create complaint (awards gamification points) |
| PUT | `/api/complaints/{id}` | Update complaint |
| DELETE | `/api/complaints/{id}` | Delete complaint |
| PATCH | `/api/complaints/{id}/status` | Update status |
| PATCH | `/api/complaints/{id}/assign` | Assign/unassign officer |
| GET | `/api/complaints/{id}/sla` | SLA status |
| GET | `/api/complaints/sla/overview` | SLA overview |
| POST | `/api/complaints/{id}/resolution` | Submit resolution |
| PATCH | `/api/complaints/{id}/verify` | Verify resolution |

### AI
| Method | Endpoint | Description | Rate Limit |
|--------|----------|-------------|------------|
| POST | `/api/ai/chat` | Chat with CivicAI | — |
| POST | `/api/upload` | Upload & analyze image | 5/min |
| POST | `/api/ai/analyze` | Full multimodal analysis | 10/min |
| POST | `/api/ai/analyze_text` | Text analysis | 15/min |
| POST | `/api/ai/transcribe` | Voice transcription | — |
| POST | `/api/ai/caption` | Image captioning | — |
| POST | `/api/ai/request-note` | Generate request letter | — |
| POST | `/api/ai/check-duplicate` | Duplicate check | — |

### Predictions
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/predictions/hotspots` | Hotspot predictions |
| GET | `/api/predictions/analytics` | Prediction analytics |

### Users & Departments
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/officers` | List active officers |
| GET | `/api/users` | List all users |
| PATCH | `/api/users/{id}/role` | Change user role |
| PATCH | `/api/users/{id}/toggle-active` | Enable/disable user |
| PATCH | `/api/users/{id}/department` | Update department |
| GET | `/api/departments` | List departments |
| POST | `/api/departments` | Create department |
| PATCH | `/api/departments/{id}` | Update department |
| DELETE | `/api/departments/{id}` | Delete department |

### Notifications
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/notifications` | List notifications |
| GET | `/api/notifications/unread-count` | Unread count |
| PATCH | `/api/notifications/{id}/read` | Mark as read |
| PATCH | `/api/notifications/read-all` | Mark all read |
| WS | `/ws/notifications/{user_id}` | Real-time WebSocket |

### Analytics & Gamification
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/analytics` | Dashboard analytics |
| GET | `/api/gamification/profile` | User gamification profile |
| GET | `/api/gamification/leaderboard` | Public leaderboard |
| GET | `/api/gamification/badges` | All badges |
| POST | `/api/gamification/award` | Award points (admin) |
| POST | `/api/gamification/check-badges/{user_id}` | Check badge eligibility (admin) |

### Transparency (Public)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/transparency/public/stats` | Public stats |
| GET | `/api/transparency/public/trending` | Trending issues |
| GET | `/api/transparency/public/performance` | Department performance |
| GET | `/api/transparency/public/wards` | Ward/area stats |

---

## 🧪 Testing

### Backend Tests
```bash
cd backend
pip install pytest
pytest tests/ -v
```

Tests cover:
- Gamification level calculation
- Points awarding logic
- Badge eligibility
- API route validation

### Frontend Tests
```bash
cd frontend
npm install
npm test
```

---

## 🚀 Installation & Local Launch

### Prerequisites
- Node.js 18+ and npm
- Python 3.10+ and pip
- PostgreSQL database (or SQLite for local dev)

### 1. Clone the Repository
```bash
git clone https://github.com/Yash913212/CivicConnect.git
cd CivicConnect
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Frontend runs at [http://localhost:3000](http://localhost:3000).

### 3. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows
pip install -r requirements.txt
```

Configure your database and API keys in `backend/.env`:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/civic_connect"
OPENROUTER_API_KEY="sk-or-v1-..."
GROQ_API_KEY="gsk-..."
SECRET_KEY="your-secret-key-here"
```

Start the backend server:
```bash
uvicorn app.main:app --reload --port 8000
```
API runs at [http://localhost:8000](http://localhost:8000) — interactive docs at [http://localhost:8000/docs](http://localhost:8000/docs).

### 4. Seed Database (Optional)
```bash
cd backend
python seeder.py              # Create admin/officer users
python seed_gamification.py   # Create sample citizen users with badges
```

### 5. Build for Production (Frontend)
```bash
cd frontend
npm run build
npm run start
```

### 6. Train ML Models (Optional)
```bash
cd backend
python train_model.py              # Train EfficientNetB0 (4 classes)
python app/ai/train_multimodal.py  # Train multimodal fusion model
```

---

## 🔧 Troubleshooting

### Chatbot Not Responding
- Ensure both frontend (`:3000`) and backend (`:8000`) servers are running
- Check that `GROQ_API_KEY` and `OPENROUTER_API_KEY` are set in `backend/.env`
- If your `/etc/hosts` maps `localhost` to a non-standard IP, use `127.0.0.1` instead of `localhost` in API URLs

### Database Connection Issues
- Ensure PostgreSQL is running and accessible
- For local development without PostgreSQL, the app may fall back to SQLite

### API Rate Limiting
- Image upload: 5 requests per minute
- AI analysis: 10 requests per minute
- Text analysis: 15 requests per minute

---

## 🔐 Credentials & Profiles Reference

The login panel contains a segmented role switch (Citizen / Officer / Admin):

| Role | Email | Name |
| :--- | :--- | :--- |
| **Citizen** | Any email not containing `admin` or `yash` | Any name |
| **Admin / Smart City Lead** | `yash@civicai.org` | Amjuri Yaswanth |

> [!TIP]
> Submit feedback at `/feedback` — rate your experience, select a category, and tell us how to improve!

---

## 📖 Quick Reference

### Common Commands
```bash
# Frontend
npm run dev          # Development server
npm run build        # Production build
npm run lint         # ESLint check
npm test             # Run tests

# Backend
uvicorn app.main:app --reload  # Development server
pytest tests/                   # Run tests
python seeder.py                # Seed database
```

### Environment Variables
```env
# Backend (.env)
DATABASE_URL="postgresql://..."
SECRET_KEY="your-secret-key"
OPENROUTER_API_KEY="..."
GROQ_API_KEY="..."
GALLERY_BUCKET="civic-connect-galleries"  # Optional: S3 bucket for images
```

```env
# Frontend (.env.local)
NEXT_PUBLIC_API_URL="http://localhost:8000/api"
NEXT_PUBLIC_WS_URL="ws://localhost:8000"
```

---

## 📬 Feedback & Contributions

Found a bug or have a feature request? Open an issue or submit feedback directly via the in-app form at `/feedback`. Pull requests are welcome.

---

## 🔒 Security Notes

- **API keys** are stored in `backend/.env` and never exposed to the frontend
- **JWT tokens**: Access tokens expire after 30 minutes, refresh tokens after 7 days
- **Refresh tokens** are stored in HttpOnly, Secure, SameSite=Strict cookies
- **Passwords** are hashed with bcrypt (12 rounds)
- **Rate limiting** prevents AI service abuse via SlowAPI
- **CORS** is restricted to known origins
- **The CivicAI chatbot** is configured to never reveal sensitive information (API keys, database URLs, credentials, internal configuration)

### Security Best Practices Implemented
1. HttpOnly cookies for refresh tokens (XSS protection)
2. Secure cookie flags (Secure, SameSite)
3. Restricted CORS methods and headers
4. Request size limits (10MB max upload)
5. Input validation on frontend and backend
6. SQL injection protection via SQLAlchemy ORM
7. JWT token validation with proper expiration
