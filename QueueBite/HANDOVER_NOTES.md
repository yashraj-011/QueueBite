# QueueBite - Backend Handover Notes

These notes summarize the architecture, architectural decisions, solved issues, and backend specifications for the team members (Yashraj and Ashutosh) developing the Flask backend and database.

---

## 1. Project Overview & Current Status

- **What QueueBite is**: A mobile-responsive web app for a college canteen where students pre-order food, pick an available 10-minute pickup time slot, and receive a digital token (#042) with a QR code to collect meals without queueing. Canteen staff use admin portals to track incoming orders, dispatch preparation, configure pickup slots, and manage food menus.
- **Frontend Status**: **100% Complete**. All 11 HTML pages are finished, styled with the "Cocoa and Cream" palette, and verified.
- **Data Layer**: Centralized inside `storage.js`. **No HTML page touches `localStorage` or `sessionStorage` directly**. When connecting the Flask API, you only need to work in `storage.js` by flipping `USE_BACKEND = true` and pointing `API_BASE = 'http://localhost:5000/api'`.

---

## 2. Key Architectural Decisions & Rationale

1. **Tab-Isolated Session with `sessionStorage`**:
   - *Reason*: During demos and local testing, evaluators need to test an Admin view in Tab 1 and a Student view in Tab 2 within the same browser. Using `localStorage` for sessions caused tabs to overwrite each other. `sessionStorage` provides per-tab isolation. Legacy keys in `localStorage` are automatically purged on login.
2. **Local Image Assets in `images/`**:
   - *Reason*: Avoid external CDN/Unsplash dead links. All items have confirmed offline image files (`images/samosa.jpg`, `sandwich.jfif`, etc.) with fallback CSS emoji placeholders.
3. **Master Canteen Switch (`cubite_canteen_open`)**:
   - *Reason*: Admin can close the canteen on demand (e.g., kitchen overwhelmed or closing early). Saved as `"true"` or `"false"` string. When closed, student menus display a warning badge and the cart disables checkout. Updates notify other open tabs via `storage` events and page focus listeners.
4. **Time Slot Capacity & Preservation**:
   - *Reason*: Default service runs 09:00 to 16:00 in 10-minute slots with a default capacity of 8 orders. Past slots and break periods (e.g. 11:00 to 11:30 lunch) cannot receive orders. When admin clicks "Generate slots", any slot that already has student bookings (`bookedCount > 0`) is **strictly preserved** so active orders are never orphaned.
5. **Cancellation & Refund Rules**:
   - *Reason*: Students can only cancel while status is `Placed` or `Preparing`. Once `Ready` or `Collected`, cancellation is refused. When cancelled, daily item stock is returned to the menu, the slot's `bookedCount` decrements, and if `paymentStatus` was `Paid`, it becomes `Refunded` (if `Pending`, it stays `Pending`).
6. **Removal of Hardcoded Sample Orders**:
   - *Reason*: Legacy dummy orders in `orders.html` caused data desync with student tabs. All sample order constants were removed so `getOrders()` starts with a real empty state (`[]`), allowing fresh end-to-end testing.
7. **Retention of `cubite_` Storage Key Prefix**:
   - *Reason*: Keys like `cubite_menu`, `cubite_orders`, `cubite_slots`, `cubite_slot_settings`, and `cubite_canteen_open` retain the `cubite_` prefix to preserve backwards compatibility across existing test data. Do not rename these keys.

---

## 3. Solved Issues During Frontend Hardening

- **Canteen Switch Not Syncing**: The overview switch state wasn't updating student pages without manual refresh. Fixed by centralizing `isCanteenOpen()` in `storage.js`, standardizing format, and adding `storage`, `visibilitychange`, and `focus` event listeners across all pages.
- **Session Bleed Between Roles**: Admin login in one tab turned student tabs into admin. Fixed by moving active session data to `sessionStorage`.
- **Duplicate Data Code Across Admin Pages**: Admin pages previously had duplicate implementations of `getOrders()`, `getSlots()`, and `saveSettings()`. All 5 admin pages (`overview.html`, `orders.html`, `queue.html`, `slots.html`, `admin.html`) were refactored to consume the async `storage.js` API with `await`.
- **Admin Orders Endpoint Inconsistencies**: `markOrderPaid` and `bulkUpdateOrderStatus` fetch URLs were initially missing the `/admin` path prefix. Both fetch calls were corrected to `${API_BASE}/admin/...` to match backend specifications.

---

## 4. What the Backend (Flask + Database) Must Do

The Flask backend must replace client-side mock logic with real database persistence. **Refer to `README.md` for the complete 62-function table, request/response JSON payloads, and exact REST routes.**

### Core Server Responsibilities:
1. **Authentication & Authorization**:
   - Implement real user models with bcrypt password hashing. Never use plaintext `admin123` in production.
   - Issue JWT or secure session cookies. Guard all `/api/admin/*` routes with role checks.
2. **Server-Side Price Calculation**:
   - Never trust `total` amounts sent from the frontend cart. Query database item prices, multiply by quantities, and store the computed total.
3. **Sequential Daily Token Numbers**:
   - Generate consecutive tokens (`#042`, `#043`, etc.) formatted with 3 digits, resetting daily at midnight.
4. **Atomic Inventory & Booking Management**:
   - On order checkout: decrement item stock and increment slot `bookedCount` within a database transaction.
   - On cancellation: restore item stock and decrement slot `bookedCount`.
5. **State Progression Enforcement**:
   - Enforce strictly valid status moves: `Placed -> Preparing -> Ready -> Collected`.
   - Reject illegal skips or backwards status transitions.
6. **Error Response Format**:
   - For all HTTP 4xx/5xx responses, return JSON: `{ "message": "Detailed error message" }`.
7. **CORS Configuration**:
   - Enable CORS in Flask for `http://localhost:5500`.

---

## 5. Known Limitations & Future Roadmap

- **Current Prototype Limitations**:
  - Data is isolated per browser (`localhost:5500`). A phone ordering food and a laptop running counter dispatch do not share data until Flask is connected.
  - UPI payment is currently a mock simulation modal; no real payment gateway webhook is integrated.
  - Offline usage requires local fonts/scripts; Tailwind CSS and `qrcode.js` currently load from CDNs.
- **Ideas for Future Releases**:
  - Real payment integration (Razorpay / Paytm UPI deep links).
  - Real-time updates via WebSockets or Server-Sent Events (SSE) to replace frontend polling intervals (5-15s).
  - SMS / WhatsApp notifications when order status moves to `Ready`.
  - Daily sales and revenue analytics with CSV/Excel export.
