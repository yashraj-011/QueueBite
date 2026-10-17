# QUEUEBITE PROJECT BRIEF (read this fully before doing anything)

## 1. What we are building
QueueBite is a college canteen pre-order website. Students pre-order food online, get a digital token with a QR code and an assigned pickup time slot, and collect the food at that time, so they don't stand in long queues. The canteen staff (admin) manage orders, menu, queue and time slots.

## 2. My role and scope
I am building ONLY the front end. My friends will build the Flask + database backend later. Do not create a backend, server, database or any npm/Python project. Everything works with sample data stored in localStorage through storage.js.

## 3. Tech rules
- Plain HTML, Tailwind CSS via CDN (<script src="https://cdn.tailwindcss.com"></script>), theme.js configuration, and vanilla JavaScript. No React or other frameworks, no npm/build tools.
- One flat folder, no subfolders. Pages link shared files with <script src="storage.js"></script> and <script src="theme.js"></script>, using Cocoa and Cream :root CSS variables.
- External resources allowed: Google Fonts, Tailwind CDN, and the qrcode.js library from cdnjs.

## 4. Existing files (do not rewrite unless I ask)
index.html (welcome), login.html, admin.html (menu management), overview.html, orders.html, queue.html, slots.html, storage.js (data layer), theme.js (theme).
Files to build (student side): student-menu.html, student-cart.html, student-track.html, student-orders.html.

## 5. Design theme: "Cocoa and Cream" (same on every page)
Use the same CSS variables and font already defined in theme.js. Never invent new colors.
--bg-page #FBF4E9 | --bg-panel #EFE3D3 | --bg-card #FFFFFF | --bg-notice #FAE8D0
--text-dark #2F2118 | --text-muted #6B5645 | --primary #8B5E3C | --accent #E9A23B
--success #4F7A4A | --danger #B3453A
Style: cream page background, white rounded cards (about 16px), brown primary buttons with soft shadow, rounded sans-serif font, mobile first, large tap targets, visible focus outline.

## 6. Data rules (very important)
- Pages NEVER touch localStorage directly. They call async functions in storage.js (getMenu, getSlots, placeOrder, getMyOrders, getOrders, updateOrderStatus, cancelOrder, verifyToken, login, getSession, etc.) with await.
- localStorage keys: cubite_menu, cubite_orders, cubite_slots, cubite_slot_settings, cubite_canteen_open, cubite_cart, cubite_session. (Storage keys keep the prefix cubite_ for historical reasons. Do not rename them.)
- Do not rename keys or fields. If you need a new field or function, STOP and tell me first.
- Menu item: { id, name, category, price, prep, desc, image, veg, tags[], stock (number or null), available, visible }
- Slot: { id, date "YYYY-MM-DD", start "13:10", end "13:20", maxOrders, bookedCount, blocked }
- Order: { id, token "#042", studentName, collegeId, phone, items [{name, qty, price}], total, slotTime "1:10 PM", orderStatus, paymentStatus, paymentMethod, note, createdAt }
- orderStatus values: Placed, Preparing, Ready, Collected, Cancelled, Missed. Valid moves: Placed -> Preparing -> Ready -> Collected. Cancelled only from Placed or Preparing.
- paymentStatus values: Pending, Paid, Failed, Refunded. paymentMethod: "UPI" or "Pay at counter".
- Logic the backend will own later (slot assignment, token creation, total calculation, stock update, status validation) must sit inside single functions in storage.js, marked with the comment // BACKEND WILL DO THIS.

## 7. Pages and links (use exactly these)
Admin sidebar: Overview -> overview.html, Orders -> orders.html, Queue -> queue.html, Menu -> admin.html, Slots -> slots.html, Logout -> login.html.
Student navbar: Menu -> student-menu.html, My Order -> student-track.html, History -> student-orders.html, Cart -> student-cart.html, Logout -> login.html.
Student login goes to student-menu.html. Admin login goes to overview.html. Pages for the wrong role must redirect to login.html.

## 8. Behaviour rules
- Show loading and error states and toast messages for every action.
- Show friendly empty states.
- Handle bad data (missing fields, empty arrays, sold-out items) without crashing.
- Admin pages refresh every 5 to 15 seconds and on the "storage" event.
- Keep code simple, with short comments and clear function names.

## 9. Things you must NEVER do
- Never delete or rewrite working files or features I did not ask about.
- Never change the theme colors or the sidebar/navbar design.
- Never add libraries, frameworks, build steps or a backend.
- Never invent data keys, field names or file names.
- Never say something works without running it.

## 10. Definition of done for any task
1. Page opens with Live Server and the browser console shows no errors.
2. Links in the navbar/sidebar open the right pages.
3. Works on a phone-size screen (about 375px wide) and on a laptop.
4. The data it saves is visible in the matching admin page.
5. You tell me exactly what you changed, file by file.