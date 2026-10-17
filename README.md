# 🍔 QueueBite — Next-Generation College Canteen Pre-Ordering & Queue-Management System

QueueBite is a modern, high-performance full-stack web application rebuilt from scratch to eliminate college canteen rush waiting lines and provide an intuitive dining experience for students, kitchen staff, and canteen administrators.

---

## 🚀 Key Highlights & Architectural Features

1. **Light Theme "Warm Cocoa & Fresh Herb" Design System**
   - Curated aesthetic: Forest Green (`#27864B`), Warm Tangerine (`#FF9B45`), and Cream Canvas (`#FFFDF8`).
   - Clean typography using Google Fonts: *Outfit* (bold geometric display headers) and *Manrope* (readable body text).
   - Glassmorphism navigation bar and high-contrast digital token pass cards.

2. **Genuine 3D Hero Composition**
   - Built with **Three.js**, **React Three Fiber (R3F)**, and **Drei**.
   - Procedural artisan burger, floating golden fries, and chilled beverage with soft shadows, environmental lighting, and pointer tilt interaction.

3. **Strict Atomic Order & Inventory Transactions**
   - Prevents overselling during break rushes using row-level locking (`FOR UPDATE`) in Supabase / PostgreSQL.
   - Guaranteed sequential daily token allocation (e.g. `#001`, `#002`, `#003`).
   - Strict status progression: `Placed` ➔ `Preparing` ➔ `Ready` ➔ `Collected`.
   - Cancellation with automatic inventory return and slot capacity replenishment.

4. **1-Second Counter Dispatch & Live Token Tracking**
   - High-contrast digital token display with SVG QR Code for rapid counter scanning.
   - Polling updates every 5 seconds to track preparation stages.
   - Kitchen Dispatch Kanban board for kitchen staff to cook, mark ready, and dispatch meals with one tap.

5. **Manager Analytics & Capacity Throttling**
   - Interactive Hourly Order flow area chart using Recharts.
   - Master Emergency Canteen Open/Close switch.
   - Time-slot capacity manager (block/unblock windows, adjust max bookings per 10-minute slot).
   - Menu catalog CRUD with live price and stock adjustments.

---

## 📂 Project Structure

```
d:/Queuebite/
├── backend/                       # Node.js + Express REST API
│   ├── src/
│   │   ├── config/supabase.js     # Supabase client & environment configuration
│   │   ├── middleware/            # Auth token verification & error handler
│   │   ├── routes/                # Modular Express routes (auth, menu, slots, orders, admin)
│   │   ├── services/              # Transactional business logic & in-memory/DB store
│   │   ├── jobs/                  # Automated scheduled sweepers (e.g. missed orders)
│   │   ├── app.js                 # Express application & middleware setup
│   │   └── server.js              # Server entry point
│   ├── tests/api.test.js          # Native automated test suite
│   ├── package.json
│   └── .env.example
├── frontend/                      # React 18 + Vite + Tailwind CSS
│   ├── public/images/             # High-resolution food assets (samosa, dosa, sandwich, etc.)
│   ├── src/
│   │   ├── components/            # 3D canvas, food cards, badge, navigation, footer
│   │   ├── context/               # AuthContext & CartContext (state management)
│   │   ├── pages/                 # Home, Menu, Cart, Track, History, Staff, Admin, Login
│   │   ├── services/api.js        # API service layer with fetch client
│   │   ├── App.jsx                # Routing & route guards
│   │   ├── main.jsx
│   │   └── index.css              # Custom Tailwind tokens & animations
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── package.json
└── supabase/
    ├── migrations/
    │   ├── 001_initial_schema.sql # Core relational tables & constraints
    │   └── 002_functions_rls.sql  # Atomic stored procedures & Row Level Security
    └── seed.sql                   # Menu catalog & slot configuration seed data
```

---

## 🛠️ Quick Start Guide

### 1. Prerequisites
- Node.js (v18.0.0 or higher)
- npm (v9.0.0 or higher)

### 2. Backend Setup & Startup
```powershell
# Navigate to backend directory
cd d:/Queuebite/backend

# Install dependencies (already completed)
npm install

# Run automated test suite
npm test

# Start the Express API server (Runs on http://localhost:5000)
npm start
```

### 3. Frontend Setup & Startup
```powershell
# In a new terminal, navigate to frontend directory
cd d:/Queuebite/frontend

# Install dependencies (already completed)
npm install

# Start Vite Development Server (Runs on http://localhost:5173)
npm run dev
```

---

## 🔑 Demo Access Credentials

The application includes 1-click demo login buttons directly on the `/login` screen:

| Role | Username / Identifier | Password | Default Landing Page |
| :--- | :--- | :--- | :--- |
| **Student** | `IT-101` | *None required* | `/menu` (Ordering catalog) |
| **Kitchen Staff** | `staff` | `staff123` | `/staff` (Kitchen dispatch board) |
| **Canteen Admin** | `admin` | `admin123` | `/admin` (Analytics & management) |
