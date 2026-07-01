# 🏛️ Civic Connect

### *AI-Powered Neural Infrastructure & Grievance Routing for Modern Smart Cities*

[![Next.js Version](https://img.shields.io/badge/Next.js-16.2.6-black?style=flat-for-the-badge&logo=next.js)](https://nextjs.org/)
[![React Version](https://img.shields.io/badge/React-19.2.4-blue?style=flat-for-the-badge&logo=react)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4.0-cyan?style=flat-for-the-badge&logo=tailwindcss)](https://tailwindcss.com/)
[![Three.js](https://img.shields.io/badge/Three.js-r184-black?style=flat-for-the-badge&logo=three.js)](https://threejs.org/)
[![Animation](https://img.shields.io/badge/GSAP_/_Framer_Motion-premium-purple?style=flat-for-the-badge)](https://gsap.com/)

---

**Civic Connect** is an ultra-high-fidelity, state-of-the-art smart city governance and complaint routing dashboard. It integrates real-time 3D WebGL visualizations, advanced computer vision, multilingual natural language processing (NLP), and automatic LLM priority assignment to revolutionize how citizens report municipal failures and how city agencies respond.

The system transitions from an ambient, cinematic login flow directly into a dynamic dashboard wrapped in a custom scroll-driven 3D neural grid, rendering high-density city metadata at 60fps.

---

## 🗺️ Architectural Pipeline

```mermaid
graph TD
    %% Citizen Node Input
    subgraph Input ["1. Input Channel"]
        Image[📷 Visual Evidence]
        Audio[🎤 Dictated Speech]
        Text[✍️ Vernacular Text]
    end

    %% AI Pipeline
    subgraph AI ["2. AI Neural Pipeline"]
        Vision["📷 VisionEye Anomaly Detector<br/>(EfficientNetB0)"]
        BLIP["🖼️ ContextAI Analyzer<br/>(BLIP Visual QA)"]
        NLP["🗣️ PolyglotNLP Dialect Core<br/>(MuRIL Transformer)"]
        Whisper["🎙️ CivicVoice Transcriber<br/>(OpenAI Whisper)"]
        
        Gemini["🧠 LLM Action Synthesizer<br/>(Gemini Engine)"]
    end

    %% Routing and Visuals
    subgraph Action ["3. Predictive Dispatch & Vis"]
        Router["⚡ Predictive Smart Router<br/>(ML Forecasting Classifier)"]
        Heatmap["🌐 WebGL Particle Heatmap<br/>(Three.js Cluster Matrix)"]
        Command["🖥️ Smart City Command Center<br/>(Department Work Orders)"]
    end

    %% Mapping inputs to AI layers
    Image --> Vision
    Image --> BLIP
    Audio --> Whisper --> NLP
    Text --> NLP

    %% Intermediate processing
    Vision --> Gemini
    BLIP --> Gemini
    NLP --> Gemini
    
    %% Action Routing
    Gemini --> Router
    Router --> Heatmap
    Router --> Command
    
    classDef default fill:#090d16,stroke:#1e293b,color:#fff;
    classDef input fill:#003c4f,stroke:#06b6d4,color:#fff;
    classDef ai fill:#2a004f,stroke:#8b5cf6,color:#fff;
    classDef action fill:#0f3817,stroke:#10b981,color:#fff;
    
    class Image,Audio,Text input;
    class Vision,BLIP,NLP,Whisper,Gemini ai;
    class Router,Heatmap,Command action;
```

---

## ✨ Premium Features

### 1. 🧬 Multi-Modal AI Core Showcase
*   **VisionEye Anomaly Detection:** Spatial grid damage parsing powered by EfficientNetB0, classifying visual anomalies across 8 categories (roads, drainage, garbage, water, streetlight, electricity, safety, traffic) instantly.
*   **ContextAI Multimodal Analyzer:** Image context extraction using **BLIP (Salesforce)** to generate automatic, descriptive summaries and tagging parameters for submitted imagery.
*   **PolyglotNLP Dialect Core:** Multilingual feedback processing leveraging **Google MuRIL (Multilingual Representations for Indian Languages)** transformer, supporting Telugu-English code-mixed text, Hindi, and regional dialects to democratize accessibility.
*   **Vision-Text Fusion Layer:** A true multimodal architecture that concatenates EfficientNetB0 visual features with MuRIL text embeddings through a learned fusion layer, then predicts both **department (8 classes)** and **priority (low/medium/high)** simultaneously.
*   **CivicVoice Transcriber:** Fast, seamless dictation interface leveraging **OpenAI Whisper (tiny)** for voice-based grievance registrations in Telugu, Hindi, and English.
*   **LLM Action Synthesizer:** Advanced municipal briefing generator that writes detailed maintenance instructions and outputs department priorities via OpenRouter/GPT-4o-mini.
*   **Predictive Smart Router & Auto-Assignment:** Automated ML-powered priority routing to dispatch tickets directly to corresponding administrative wings. A smart load-balancing algorithm automatically assigns complaints to active officers with the lowest current workload (`IN_PROGRESS` or `ASSIGNED`).
*   **Media Optimization & Rate Limiting:** All AI inferences and file uploads are protected by **SlowAPI** rate limiters to prevent API abuse. Images undergo dynamic resizing and JPEG compression via **Pillow** before processing, significantly reducing storage footprint.

### 2. 🌌 High-Fidelity 3D Visual Experience
*   **Interactive 3D WebGL Canvas:** A dynamic Three.js + React Three Fiber backdrop containing dynamic particle systems representing a neural city net that floats and warps dynamically.
*   **WebGL Smart City Heatmap:** A visual WebGL plane with 30+ pulsating hotspots, undulating terrain grid, connection lines between nearby clusters, and orbital camera sweep — showcasing municipal complaints for Potholes, Water Leaks, and Waste Clusters.
*   **Orbital Resolution Engine:** Autonomous 8-stage pipeline visualized as a 3D central core with orbiting indicator spheres, data packet animations, and mouse-driven parallax.
*   **GSAP Scroll-Driven Transitions:** A comprehensive scrolling experience leveraging GreenSock ScrollTrigger with pinned horizontal and vertical scroll sections, scroll-linked timeline dot animations, and progress bars.
*   **3D Holographic Command Center:** Animated bar charts with scroll-triggered growth, auto-rotating live alert feed, and staggered card entrance animations.

### 3. 👤 Dynamic RBAC Authentication & Profiles
*   **Role-Based Dashboards:** Segregated portals for **Citizen**, **Officer**, and **Admin** roles with tailored interfaces — complaint registration, task management, and city-wide analytics respectively.
*   **Smart Routing & Guards:** Auth-protected routes with `withRoleGuard` and `withAuthGuard` HOCs ensuring proper access control across all dashboards.
*   **Citizen Profile Panel:** Interactive configuration dashboard with notification preferences, security logs, and activity history tracking.
*   **User Feedback System:** Dedicated `/feedback` page with 5-star rating, category selector (Bug, Feature, General, Compliment, Security), and submission toast notifications — accessible from the navbar, footer, and user dropdown.

### 4. 🔔 Real-Time Notification Engine
*   **WebSocket Real-Time Architecture:** Replaced legacy polling with true real-time WebSockets, establishing persistent connections via a central FastAPI `ConnectionManager`.
*   **Instant Toasts & Alerts:** Notifications auto-created and delivered instantly on complaint submission, status changes, officer assignments, and resolution using `sonner` toasts.
*   **Notification API:** Full REST endpoints (`GET /notifications`, `PATCH /notifications/{id}/read`, `PATCH /notifications/read-all`) with unread count endpoint.
*   **Backend Notification Model:** SQLAlchemy model with `NotificationType` enum (`status_update`, `assignment`, `complaint_submitted`, `complaint_resolved`).

### 5. 🧑‍💼 Admin User & Dynamic Analytics
*   **Live Recharts Dashboard:** Real-time analytics view for Smart City Command Centers. Visualizes KPIs, Priority distributions (`PieChart`), Department Efficiency (`BarChart`), and Weekly creation vs. resolution trends (`AreaChart`) dynamically hooked to a `/analytics` API endpoint.
*   **User Administration:** Role-based user management UI with inline role changes (Citizen/Officer/Admin), account enable/disable, and full user listing with search.
*   **Department CRUD:** Full backend API for department management (`GET`, `POST`, `PATCH`, `DELETE /departments`) with a dedicated `Department` SQLAlchemy model.
*   **Complaint Lifecycle Management:** Complete update (`PUT /complaints/{id}`) and delete (`DELETE /complaints/{id}`) endpoints with strict authorization rules.

### 6. 🎨 Immersive UI/UX & PWA
*   **Progressive Web App (PWA):** Configured with web app manifests and metadata, allowing Civic Connect to be seamlessly installed on citizen mobile devices for native-like reporting functionality.
*   **Animated Preloader:** Full-screen cyberpunk-style loading sequence with word animations, progress bar, and ambient grid — replaced the basic spinner for a premium first impression.
*   **Live AI Demo Sandbox:** Interactive multimodal playground supporting image upload, voice recording, and AI classification with real-time animated results, scan overlays, and shimmer effects.
*   **Technology Showcase Cards:** 6 glassmorphism feature cards with staggered scroll-reveal animations, unique icons, colored hover glows, and background image blending.
*   **Team Section:** 3D tilt-perspective member cards with per-accent gradients, social links, animated counters, and hover parallax.
*   **Animated Impact Counters:** Smooth `requestAnimationFrame`-driven number counters with easing for KPIs like accuracy, complaints processed, and resolution speed.

---

## 🛠️ Technology Stack

| Domain | Technology | Description |
| :--- | :--- | :--- |
| **Core Architecture** | Next.js 16.2.6 (App Router), React 19.2.4, TypeScript | Server and Client rendering pipeline |
| **3D Graphics** | `@react-three/fiber`, `@react-three/drei`, Three.js | High-performance WebGL particulate canvas |
| **Styling** | Tailwind CSS v4, Shadcn UI Tokens | Modern utility-first styling system |
| **Motion Physics** | GSAP 3.15.0, ScrollTrigger, Framer Motion 12 | Fluid transitions & scroll-bound timelines |
| **Data Viz** | Recharts | Dynamic SVG-based charting for dashboards |
| **Scrolling Physics**| Lenis 1.3 | Smooth, high-precision inertial scroll |
| **Icons** | Lucide React | Harmonized icon library |
| **Vision Model** | EfficientNetB0 (PyTorch) | Image feature extraction for 8-class civic issue classification |
| **Text Model** | Google MuRIL (Transformers) | Multilingual Telugu/English/Hindi text understanding |
| **Fusion Architecture** | Custom multimodal fusion layer | Concatenated vision + text features → department + priority heads |
| **Image Processing** | Pillow (PIL) | Dynamic resizing and JPEG compression |
| **Backend Framework** | FastAPI (Python) | REST API server + WebSockets |
| **API Protection** | SlowAPI | Request rate-limiting to prevent AI abuse |
| **Database ORM** | SQLAlchemy + PostgreSQL | Complaint, User, Notification, Department models |
| **Authentication** | JWT (python-jose) + bcrypt | Token-based auth with role guards |
| **AI Orchestration** | OpenRouter / GPT-4o-mini | Complaint image analysis & priority classification |

---

## 📂 Repository Blueprint

```bash
src/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root layout (Navbar, Auth, Theme providers)
│   ├── page.tsx                  # Login entrance (SignInPage)
│   ├── home/                     # Landing page with all sections
│   ├── feedback/                 # User feedback form (5-star rating, categories)
│   ├── citizen/
│   │   ├── dashboard/            # Citizen landing dashboard
│   │   ├── complaint/            # Complaint registration with map picker
│   │   └── profile/              # Profile settings, security logs
│   ├── officer/
│   │   └── dashboard/            # Officer task management + map view
│   ├── admin/
│   │   └── dashboard/            # Admin analytics, department management
│   ├── profile/                  # Generic profile page
│   ├── forgot-password/
│   ├── reset-password/
│   ├── loading.tsx               # Animated preloader with brand glow
│   └── error.tsx                 # Error boundary with retry/home actions
├── components/
│   ├── sections/                 # Feature sections (Hero, Technology, Solution, etc.)
│   ├── map/                      # Map-based components (ComplaintForm, MapPicker)
│   ├── canvas/                   # R3F canvas components (NeuralNetwork)
│   ├── ui/                       # Reusable UI (buttons, toasts, notifications)
│   ├── auth/                     # Auth screen, forms, dashboard preview
│   ├── Navbar.tsx                # Responsive navbar with user dropdown
│   ├── GlobalBackground.tsx      # Ambient background effects
│   ├── SmoothScroll.tsx          # Lenis scroll wrapper
│   └── ThemeProvider.tsx         # Dark/light theme provider
├── auth/                         # Auth context, service, API client
├── middleware/                    # Role & auth guard HOCs
└── hooks/                        # Custom React hooks (useAuth)
```

### Backend Structure (`backend/`)
```bash
backend/
├── app/
│   ├── main.py                   # FastAPI app — all REST endpoints
│   ├── database/
│   │   ├── models.py             # SQLAlchemy models (User, Complaint, Notification, Department)
│   │   └── database.py           # Engine & session config
│   ├── auth/
│   │   ├── routes.py             # Auth endpoints (register, login, refresh, password reset)
│   │   ├── schemas.py            # Pydantic request/response schemas
│   │   └── dependencies.py       # get_current_user, require_role guards
│   ├── core/
│   │   ├── config.py             # Settings via pydantic-settings
│   │   └── security.py           # JWT create/verify, password hashing
│   └── ai/                       # ML models (EfficientNet, MuRIL, Whisper, BLIP)
├── requirements.txt
└── .env
```

---

## 🚀 Installation & Local Launch

### Prerequisites
- Node.js 18+ and npm
- Python 3.10+ and pip
- PostgreSQL database

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
```

Start the backend server:
```bash
uvicorn app.main:app --reload --port 8000
```
API runs at [http://localhost:8000](http://localhost:8000) — interactive docs at [http://localhost:8000/docs](http://localhost:8000/docs).

### 4. Build Production Bundle (Frontend)
```bash
npm run build
npm run start
```

---

## 🔐 Credentials & Profiles Reference

The login panel contains a segmented role switch (Citizen / Officer / Admin). You can sign in using:

| Role | Email | Name |
| :--- | :--- | :--- |
| **Citizen** | any email not containing `admin` or `yash` | Any name |
| **Admin / Smart City Lead** | `yash@civicai.org` | Amjuri Yaswanth |

> [!TIP]
> Submit feedback at `/feedback` — rate your experience, select a category, and tell us how to improve!

---

## 📬 Feedback & Contributions

Found a bug or have a feature request? Open an issue or submit feedback directly via the in-app form at `/feedback`. Pull requests are welcome.
