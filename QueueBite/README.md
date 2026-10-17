# QueueBite - College Canteen Pre-Order System

QueueBite is a college canteen pre-order website where students pre-order food online, receive a digital pickup token with a QR code and an assigned time slot, and collect their food without standing in long queues.
Canteen staff (admin) manage incoming orders, real-time preparation queues, the food menu, and time slot capacities from dedicated administrative dashboards.

---

## 1. How to Run (Frontend Only)

QueueBite is built as a pure static front end. To run the application locally:

1. Open a terminal inside the project directory:
   ```bash
   python -m http.server 5500
   ```
2. In your web browser, navigate to:
   ```
   http://localhost:5500/login.html
   ```
   *(Please use this exact port and address: `http://localhost:5500/login.html`).*

### Demo Logins
- **Canteen Staff (Admin)**:
  - **Username**: `admin`
  - **Password**: `admin123`
  - *Redirects to*: overview.html
- **Student**:
  - **Name**: `Demo Student`
  - **Roll Number**: `IT-101`
  - *Redirects to*: student-menu.html

> [!NOTE]
> **Simultaneous Admin & Student Testing**:
> User authentication sessions are isolated per browser tab via `sessionStorage`. You can open an Admin session in Tab 1 and a Student session in Tab 2 within the same browser without session conflicts.

> [!WARNING]
> The demo login in storage.js is for testing only. The backend must implement real registration and login: hashed passwords (bcrypt), a token or session, and role checks on every admin endpoint. Never use admin / admin123 in production.

---

## 2. Project File Structure

All pages are hosted in a single flat directory with shared styling and data layers.

```
QueueBite/
|-- index.html            # Landing / Welcome page; detects active sessions
|-- login.html            # Dual tab portal for Student and Admin login
|-- overview.html         # Admin dashboard: metrics, recent orders, canteen toggle
|-- orders.html           # Admin orders console: search, filter, payment & status updates
|-- queue.html            # Admin kitchen dispatch board: live status transitions & token scanner
|-- slots.html            # Admin slot management: capacities, generation, breaks & blocking
|-- admin.html            # Admin menu manager: add/edit items, stock, availability & JSON export
|-- student-menu.html     # Student food menu with category filter, search & live stock badges
|-- student-cart.html     # Student cart review, slot selection, UPI/counter payment & checkout
|-- student-track.html    # Live order tracker: digital token, QR code, progress & cancellation
|-- student-orders.html   # Student past order history & 1-click re-ordering
|-- storage.js            # Unified data layer (the ONLY file the backend must connect to)
|-- theme.js              # Shared Tailwind CSS config ("Cocoa and Cream" color palette)
|-- images/               # Local menu image assets for offline display
|   |-- samosa.jpg
|   |-- sandwich.jfif
|   |-- masaladosa.jfif
|   |-- coffee.jfif
|   |-- cholebhature.jfif
|   |-- maggi.jfif
|   `-- kandepohe.jpg
`-- QUEUEBITE_BRIEF.md    # Original project requirements specification
```

---

## 3. Storage Layer (`storage.js`) API Reference

`storage.js` is the sole data boundary of the application. Web pages never touch `localStorage` or `sessionStorage` directly; every operation passes through these async functions.

> **Note**: Comments show full paths. In code, /api comes from API_BASE.

**Backend Needed Categories**:
- **Yes: endpoint**: The Flask backend must implement this REST endpoint to provide persistent database operations.
- **No: frontend-only helper**: Formatting, time calculations, normalizing fields, or client-side UI helpers that execute entirely in the browser.
- **Mock only: the server does this itself**: Prototype helpers for client-side storage (whole-list saves, token generation); the backend database and business logic handle persistence automatically.

| Function Name | Description | Inputs | Return Value | Callers (Pages) | Backend needed? | REST Endpoint in storage.js |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `login(role, credentials)` | Authenticates student or admin credentials | `role` (string), `credentials` (object) | `Promise<sessionObject>` | login.html | Yes: POST /api/auth/login | `POST ${API_BASE}/auth/login` |
| `saveCurrentUser(user)` | Saves session to tab `sessionStorage` | `user` (object) | `sessionObject` | login.html, student-menu.html | No: frontend-only helper | Client-side `sessionStorage` |
| `saveSession(user)` | Async alias to save user session | `user` (object) | `Promise<sessionObject>` | Internal / Export | No: frontend-only helper | Client-side `sessionStorage` |
| `getCurrentUser()` | Synchronous getter for current session | None | `sessionObject \| null` | index.html, login.html, student-menu.html | No: frontend-only helper | Client-side `sessionStorage` |
| `getSession()` | Async getter for authenticated session | None | `Promise<sessionObject \| null>` | Admin pages & Student pages | Yes: GET /api/auth/session | `GET ${API_BASE}/auth/session` |
| `logoutUser()` | Clears current tab session and legacy keys | None | `Promise<void>` | All pages (Sidebar / Navbar) | Yes: POST /api/auth/logout | `POST ${API_BASE}/auth/logout` |
| `isLoggedIn()` | Checks if valid session exists | None | `Promise<boolean>` | Internal / Export | No: frontend-only helper | Client-side session check |
| `requireRole(allowedRole, redirectUrl)` | Route guard verifying active role | `allowedRole` (string), `redirectUrl` (string) | `Promise<boolean>` | Internal / Route guard | No: frontend-only helper | Client-side role check |
| `getMenu()` | Retrieves full food catalog with image fallbacks | None | `Promise<MenuItem[]>` | admin.html, overview.html, student-menu.html, student-cart.html, student-orders.html | Yes: GET /api/menu | `GET ${API_BASE}/menu` |
| `saveMenu(items)` | Overwrites entire menu catalog | `items` (MenuItem[]) | `Promise<MenuItem[]>` | Internal / admin.html | Mock only: the server does this itself | `POST ${API_BASE}/menu` |
| `getCategories()` | Retrieves category filter array | None | `Promise<string[]>` | admin.html | Yes: GET /api/categories | Client-side `localStorage` (`cubite_categories`) |
| `saveCategories(categories)` | Saves category filter list | `categories` (string[]) | `Promise<string[]>` | admin.html | Yes: POST /api/categories | Client-side `localStorage` (`cubite_categories`) |
| `saveMenuItem(item)` | Creates or updates a single food item | `item` (object) | `Promise<MenuItem>` | admin.html | Yes: POST /api/admin/menu (create) or PUT /api/admin/menu/:id (update) | `POST /api/admin/menu` or `PUT /api/admin/menu/:id` |
| `deleteMenuItem(id)` | Deletes a menu item by ID | `id` (string) | `Promise<MenuItem>` | admin.html | Yes: DELETE /api/admin/menu/:id | `DELETE /api/admin/menu/:id` |
| `setAvailability(id, value)` | Toggles availability flag for an item | `id` (string), `value` (boolean) | `Promise<MenuItem>` | admin.html | Yes: PATCH /api/admin/menu/:id/availability | `PATCH /api/admin/menu/:id/availability` |
| `updateItemStock(id, newStockOrChange)` | Updates stock count (direct number or delta) | `id` (string), `newStockOrChange` (number) | `Promise<MenuItem>` | admin.html | Yes: PATCH /api/admin/menu/:id/stock | `PATCH /api/admin/menu/:id/stock` |
| `makeAllAvailable()` | Marks all visible menu items as available | None | `Promise<MenuItem[]>` | admin.html | Yes: POST /api/admin/menu/make-all-available | `POST /api/admin/menu/make-all-available` |
| `normalizeMenuItem(item)` | Normalizes item field aliases (desc/description, veg/isVeg) | `item` (object) | `MenuItem` | Internal helper | No: frontend-only helper | Client-side helper |
| `getCart()` | Returns student's local cart items | None | `Promise<CartItem[]>` | student-menu.html, student-cart.html | No: frontend-only helper | Client-side `localStorage` (`cubite_cart`) |
| `saveCart(cartItems)` | Persists cart items array | `cartItems` (CartItem[]) | `Promise<CartItem[]>` | Internal / Cart ops | Mock only: the server does this itself | Client-side `localStorage` (`cubite_cart`) |
| `addToCart(item)` | Adds item to student cart or increments quantity | `item` (object) | `Promise<CartItem[]>` | student-menu.html, student-orders.html | No: frontend-only helper | Client-side cart operation |
| `updateCartItemQty(itemId, delta)` | Adjusts quantity of a cart item (+1 / -1) | `itemId` (string), `delta` (number) | `Promise<CartItem[]>` | student-menu.html, student-cart.html | No: frontend-only helper | Client-side cart operation |
| `removeFromCart(itemId)` | Removes a specific item from cart | `itemId` (string) | `Promise<CartItem[]>` | student-cart.html | No: frontend-only helper | Client-side cart operation |
| `clearCart()` | Empties student cart | None | `Promise<void>` | student-cart.html | No: frontend-only helper | Client-side cart operation |
| `getCartSummary()` | Returns cart count and calculated subtotal | None | `Promise<{count, total}>` | All Student pages | No: frontend-only helper | Client-side cart operation |
| `getSlotSettings()` | Returns slot configuration and kitchen breaks | None | `Promise<SlotSettings>` | slots.html, student-cart.html | Yes: GET /api/slots/settings | Client-side `localStorage` (`cubite_slot_settings`) |
| `saveSlotSettings(newSettings)` | Updates open/close hours, duration, breaks | `newSettings` (object) | `Promise<SlotSettings>` | slots.html | Yes: POST /api/admin/slots/settings | Client-side `localStorage` (`cubite_slot_settings`) |
| `getSlots(date)` | Retrieves time slots (all or filtered by date) | `date` (string \| null) | `Promise<Slot[]>` | overview.html, orders.html, slots.html, student-cart.html | Yes: GET /api/slots?date=:date | `GET ${API_BASE}/slots` (or `?date=:date`) |
| `saveSlots(slots)` | Persists full slots collection | `slots` (Slot[]) | `Promise<Slot[]>` | Internal / slots.html | Mock only: the server does this itself | `POST ${API_BASE}/slots` |
| `generateAvailableTimeSlots(targetDate)` | Calculates future non-blocked slots with capacity | `targetDate` (string \| null) | `Promise<Slot[]>` | overview.html | Yes: GET /api/slots/available?date=:date | Client-side algorithm / future `GET ${API_BASE}/slots/available` |
| `isSlotPastInternal(slot)` | Checks if a slot time window has passed | `slot` (object) | `boolean` | Internal helper | No: frontend-only helper | Client-side helper |
| `syncBookedCounts()` | Recalculates all slot booking counts from active orders | None | `Promise<Slot[]>` | slots.html | Yes: POST /api/admin/slots/sync-booked-counts | `POST /api/admin/slots/sync-booked-counts` |
| `generateSlots(targetDate)` | Generates time windows, skips breaks, keeps bookings | `targetDate` (string \| null) | `Promise<Slot[]>` | slots.html | Yes: POST /api/admin/slots/generate | `POST /api/admin/slots/generate` |
| `updateSlotCapacity(slotId, newCapacity)` | Validates and updates a single slot's max capacity | `slotId` (string), `newCapacity` (number) | `Promise<Slot>` | slots.html | Yes: PATCH /api/admin/slots/:id/capacity | `PATCH /api/admin/slots/:id/capacity` |
| `toggleBlockSlot(slotId, blocked)` | Toggles or sets blocked status of a slot | `slotId` (string), `blocked` (boolean \| null) | `Promise<Slot>` | slots.html | Yes: PATCH /api/admin/slots/:id/block | `PATCH /api/admin/slots/:id/block` |
| `saveSlot(slotData)` | Adds new custom slot with overlap check | `slotData` (object) | `Promise<Slot>` | slots.html | Yes: POST /api/admin/slots | `POST /api/admin/slots` |
| `deleteSlot(slotId)` | Deletes an unbooked, unpassed slot | `slotId` (string) | `Promise<Slot>` | slots.html | Yes: DELETE /api/admin/slots/:id | `DELETE /api/admin/slots/:id` |
| `bulkBlockSlots(date)` | Blocks all remaining unpassed slots for date | `date` (string) | `Promise<{count, slots}>` | slots.html | Yes: POST /api/admin/slots/bulk-block | `POST /api/admin/slots/bulk-block` |
| `bulkSetSlotCapacity(date, newCapacity)` | Updates capacity for all unpassed slots on date | `date` (string), `newCapacity` (number) | `Promise<{updatedCount, skippedCount}>` | slots.html | Yes: POST /api/admin/slots/bulk-capacity | `POST /api/admin/slots/bulk-capacity` |
| `bulkUnblockSlots(date)` | Unblocks all blocked slots for date | `date` (string) | `Promise<{count, slots}>` | slots.html | Yes: POST /api/admin/slots/bulk-unblock | `POST /api/admin/slots/bulk-unblock` |
| `addBreakPeriod(breakData)` | Adds new kitchen break interval (max 3) | `breakData` (object \| null) | `Promise<SlotSettings>` | slots.html | Yes: POST /api/admin/slots/settings/breaks | `POST /api/admin/slots/settings/breaks` |
| `removeBreakPeriod(index)` | Removes a break interval by index | `index` (number) | `Promise<SlotSettings>` | slots.html | Yes: DELETE /api/admin/slots/settings/breaks/:index | `DELETE /api/admin/slots/settings/breaks/:index` |
| `getOrders()` | Retrieves all orders sorted latest first | None | `Promise<Order[]>` | overview.html, orders.html, queue.html, slots.html | Yes: GET /api/orders | `GET ${API_BASE}/orders` |
| `saveOrders(orders)` | Persists full order collection | `orders` (Order[]) | `Promise<Order[]>` | Internal / Order ops | Mock only: the server does this itself | `POST ${API_BASE}/orders` |
| `placeOrder(orderData)` | Validates, reserves stock, creates token & order | `orderData` (object) | `Promise<Order>` | student-cart.html | Yes: POST /api/orders | `POST ${API_BASE}/orders` |
| `getMyOrders(studentRollOrId)` | Retrieves order history for a student | `studentRollOrId` (string \| null) | `Promise<Order[]>` | student-orders.html, student-track.html | Yes: GET /api/orders/student/:rollNo | Client-side filter / future `GET /api/orders/student/:rollNo` |
| `verifyToken(tokenQuery)` | Finds order matching digital token (e.g. `#042`) | `tokenQuery` (string) | `Promise<Order \| null>` | orders.html, queue.html | Yes: GET /api/orders/token/:token | Client-side filter / future `GET /api/orders/token/:token` |
| `getOrderByToken(token)` | Look up order by exact token | `token` (string) | `Promise<Order \| null>` | Internal / Export | Yes: GET /api/orders/token/:token | Client-side filter / future `GET /api/orders/token/:token` |
| `getOrderById(orderId)` | Look up order by internal ID | `orderId` (string) | `Promise<Order \| null>` | student-track.html | Yes: GET /api/orders/:id | Client-side filter / future `GET /api/orders/:id` |
| `updateOrderStatus(orderId, newStatus)` | Advances status (`Placed` -> `Preparing` -> `Ready` -> `Collected`) | `orderId` (string), `newStatus` (string) | `Promise<Order>` | overview.html, orders.html, queue.html | Yes: PUT /api/orders/:id/status | `PUT ${API_BASE}/orders/${orderId}/status` |
| `markOrderPaid(orderId)` | Sets Pending order paymentStatus to Paid | `orderId` (string) | `Promise<Order>` | orders.html | Yes: PATCH /api/admin/orders/:id/payment | `PATCH ${API_BASE}/admin/orders/${orderId}/payment` |
| `bulkUpdateOrderStatus(orderIds, newStatus)` | Batch updates status with transition validation | `orderIds` (Iterable), `newStatus` (string) | `Promise<{updatedCount, skippedCount, skipped, orders}>` | orders.html | Yes: POST /api/admin/orders/bulk-status | `POST ${API_BASE}/admin/orders/bulk-status` |
| `cancelOrder(orderId, reason, cancelledBy)` | Cancels order, restores stock, decrements slot, refunds | `orderId` (string), `reason` (string), `cancelledBy` (string) | `Promise<Order>` | orders.html, student-track.html | Yes: POST /api/orders/:id/cancel | `POST ${API_BASE}/orders/${orderId}/cancel` |
| `normalizeOrder(order)` | Normalizes order field aliases | `order` (object) | `Order` | Internal helper | No: frontend-only helper | Client-side helper |
| `isCanteenOpen()` | Returns master canteen operating state | None | `Promise<boolean>` | overview.html, orders.html, slots.html, student-menu.html, student-cart.html | Yes: GET /api/canteen/status | Client-side `localStorage` (`cubite_canteen_open`) |
| `setCanteenOpen(isOpen)` | Toggles master canteen status and notifies tabs | `isOpen` (boolean) | `Promise<boolean>` | overview.html | Yes: POST /api/admin/canteen/status | Client-side `localStorage` (`cubite_canteen_open`) |
| `generateNextToken()` | Increments daily digital token counter | None | `Promise<string>` | Internal / `placeOrder` | Mock only: the server does this itself | Client-side `localStorage` (`cubite_token_counter`) |
| `resetTokenCounter()` | Resets counter back to base `#041` | None | `Promise<void>` | Internal / Demo reset | Mock only: the server does this itself | Client-side `localStorage` (`cubite_token_counter`) |
| `saveOrder(orderData)` | Legacy alias calling `placeOrder(orderData)` | `orderData` (object) | `Promise<Order>` | Legacy alias | Mock only: the server does this itself | Alias to `placeOrder` |
| `timeStrToMinutes(timeStr)` | Converts `"13:10"` or `"1:10 PM"` to minutes from midnight | `timeStr` (string) | `number` | student-cart.html, student-track.html | No: frontend-only helper | Client-side helper |
| `minutesToTimeStr(minutes)` | Converts minute number to `"HH:MM"` 24h format | `minutes` (number) | `string` | student-cart.html | No: frontend-only helper | Client-side helper |
| `formatSlotTime12(time24)` | Formats `"13:10"` to `"1:10 PM"` | `time24` (string) | `string` | orders.html, overview.html, student-cart.html | No: frontend-only helper | Client-side helper |

---

## 4. Example JSON Schemas (From Production Code)

### Menu Item (`cubite_menu`)
```json
{
  "id": "item-1",
  "name": "Samosa (2 pcs)",
  "category": "Snacks",
  "price": 25,
  "prepTime": 5,
  "prep": 5,
  "description": "Crispy golden triangular pastries stuffed with spiced potatoes and peas.",
  "desc": "Crispy golden triangular pastries stuffed with spiced potatoes and peas.",
  "imageUrl": "images/samosa.jpg",
  "image": "images/samosa.jpg",
  "isVeg": true,
  "veg": true,
  "tags": ["Bestseller"],
  "stock": 35,
  "isAvailable": true,
  "available": true,
  "isVisible": true,
  "visible": true
}
```

### Time Slot (`cubite_slots`)
```json
{
  "id": "slot-2026-10-11-790",
  "date": "2026-10-11",
  "start": "13:10",
  "end": "13:20",
  "maxOrders": 8,
  "bookedCount": 3,
  "blocked": false
}
```

### Order with Items (`cubite_orders`)
```json
{
  "id": "ORD-1772450000000",
  "token": "#042",
  "studentName": "Demo Student",
  "collegeId": "IT-101",
  "rollNo": "IT-101",
  "phone": "9876543210",
  "items": [
    {
      "name": "Samosa (2 pcs)",
      "qty": 2,
      "price": 25
    },
    {
      "name": "Cold Coffee with Ice Cream",
      "qty": 1,
      "price": 50
    }
  ],
  "total": 100,
  "totalAmount": 100,
  "slotTime": "1:10 PM - 1:20 PM",
  "orderStatus": "Placed",
  "status": "Placed",
  "paymentStatus": "Paid",
  "paymentMethod": "UPI",
  "note": "Extra chutney please",
  "createdAt": "2026-10-11T12:30:00.000Z",
  "cancelledBy": "",
  "cancelReason": ""
}
```

### Slot Settings with Breaks (`cubite_slot_settings`)
```json
{
  "openTime": "09:00",
  "closeTime": "16:00",
  "duration": 10,
  "defaultMax": 8,
  "lastOrderBufferMinutes": 15,
  "breaks": [
    {
      "start": "11:00",
      "end": "11:30"
    }
  ]
}
```

### Session Objects (`cubite_session` / `cubite_user`)

**Student Session:**
```json
{
  "role": "student",
  "name": "Demo Student",
  "rollNo": "IT-101",
  "collegeId": "IT-101",
  "phone": "9876543210",
  "timestamp": "2026-10-11T09:00:00.000Z"
}
```

**Admin Session:**
```json
{
  "role": "admin",
  "username": "admin",
  "name": "Canteen Manager",
  "timestamp": "2026-10-11T09:00:00.000Z"
}
```

---

## 5. Status Enums & State Transition Rules

### `orderStatus`
Valid states:
- `Placed` (Initial order state)
- `Preparing` (In the kitchen)
- `Ready` (Awaiting student pickup at the counter)
- `Collected` (Order fulfilled and handed over)
- `Cancelled` (Order cancelled by student or staff)
- `Missed` (Pickup time expired without collection)

**Valid Status Progression:**
`Placed -> Preparing -> Ready -> Collected`

**Cancellation Rules:**
- Orders can ONLY be cancelled while in `Placed` or `Preparing` status.
- Once an order reaches `Ready` or `Collected`, cancellation is strictly rejected.
- Audit fields:
  - `cancelledBy`: `"student"` or `"admin"`.
  - `cancelReason`: Descriptive string explaining why the order was voided.

### `paymentStatus`
Valid states:
- `Pending`: Default for `"Pay at counter"` orders.
- `Paid`: Default for `"UPI"` orders, or when admin clears payment via `markOrderPaid()`.
- `Failed`: Rejected payment transactions.
- `Refunded`: When an order whose status was `Paid` is cancelled, its payment status automatically transitions to `Refunded`. (`Pending` orders remain `Pending` upon cancellation).

### `paymentMethod`
- `"UPI"`
- `"Pay at counter"`

---

## 6. Business Rules the Backend Must Enforce

The following rules are marked with `// BACKEND WILL DO THIS:` in `storage.js` and must be strictly enforced on the server:

1. **Slot Assignment & Capacity Validation**:
   - Verify that the target slot exists, is not blocked (`blocked === false`), and has remaining capacity (`bookedCount < maxOrders`).
   - Reject orders submitted for past time slots.
2. **Sequential Daily Token Numbers**:
   - Generate consecutive tokens formatted as `#042`, `#043`, etc.
   - Counter resets daily at midnight.
3. **Server-Side Price Calculation**:
   - Multiply item prices by quantities on the server side using the database price catalog. Never trust client-submitted `total` amounts.
4. **Inventory Stock Management**:
   - Decrement item `stock` atomically when an order is placed.
   - When stock reaches `0`, set `isAvailable = false`.
   - If an order is cancelled, automatically restore the quantities back to item stock, re-enabling availability if stock > 0.
5. **Slot Booking Counts**:
   - Increment slot `bookedCount` when an order is placed.
   - Decrement slot `bookedCount` when an order is cancelled.
6. **Cancellation Cutoff & Refunds**:
   - Enforce cancellation cutoff (`Placed` and `Preparing` only).
   - If `paymentStatus === "Paid"`, transition to `paymentStatus = "Refunded"`.
7. **Strict Status Move Transitions**:
   - Only allow sequential moves (`Placed -> Preparing -> Ready -> Collected`).
   - In bulk updates, skip orders not currently in the required preceding state without failing the batch.
8. **Canteen Status Guard**:
   - If `cubite_canteen_open` is `false`, reject new order creation with `"Canteen is closed"`.
9. **Role Protection & Auth Guards**:
   - Protect all `/api/admin/*` endpoints. Verify JWT/session role before permitting menu mutations, slot modifications, or payment clearance.

---

## 7. Connecting the Flask Backend

When Yashraj and Ashutosh have built the Flask backend:

1. Open `storage.js`.
2. At the top of the file, update the configuration flags:
   ```javascript
   const USE_BACKEND = true;
   const API_BASE = 'http://localhost:5000/api';
   ```
3. Ensure the Flask server:
   - Returns responses matching the exact JSON shapes documented in Section 4.
   - Returns errors formatted with HTTP >= 400 and a JSON body:
     ```json
     {
       "message": "Specific error description here"
     }
     ```
   - Enables Cross-Origin Resource Sharing (CORS) for `http://localhost:5500`:
     ```python
     from flask import Flask
     from flask_cors import CORS

     app = Flask(__name__)
     CORS(app, resources={r"/api/*": {"origins": "http://localhost:5500"}})
     ```

---

## 8. Known Limitations of the Frontend-Only Version

- **Data is Per Browser and Per Address**: All data is stored in the browser's `localStorage` and `sessionStorage` under `http://localhost:5500`. Opening the app in a different browser, incognito window, or via a different host address creates a separate, independent dataset.
- **No Cross-Device Data Sharing**: A student ordering from a phone and the canteen computer running the admin queue do not share data until the Flask backend and database are connected.
- **Mock UPI Payment**: Selecting UPI payment displays a simulated confirmation popup. No real payment gateway (e.g. Razorpay, Paytm) is integrated yet.
- **Internet Requirement**: Tailwind CSS and the `qrcode.js` library are loaded via external CDNs. An active internet connection is required to render UI styles and generate QR codes.

---

## 9. Technical Notes & Constraints

- **Storage Key Prefix**: `localStorage` keys retain the legacy prefix `cubite_` (`cubite_menu`, `cubite_orders`, `cubite_slots`, `cubite_slot_settings`, `cubite_canteen_open`, `cubite_cart`, `cubite_token_counter`, `cubite_session`). **Do not rename these keys.**
- **CDN Dependencies**: Tailwind CSS via `cdn.tailwindcss.com` and `qrcode.js` via `cdnjs.cloudflare.com`.

---

## 10. Team & Collaboration Guidelines

- **Ruchita**: Frontend architecture, user interfaces, and UI theme alignment.
- **Yashraj & Ashutosh**: Backend API development (Flask, Database models, and business logic enforcement).
- **Working Rules**:
  - Work on separate git feature branches (`feature/backend-...`, `feature/frontend-...`).
  - Commit small, working changes frequently with descriptive messages.
  - **Never modify JSON schema field names or storage keys** without prior discussion and agreement with the entire team.
