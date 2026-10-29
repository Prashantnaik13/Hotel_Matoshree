# 🏨 The Emerald Grandeur — Premium Hotel Billing & Restaurant POS Management System

A production-oriented, visually premium **Hotel / Restaurant Billing and Table Management Software** built with **React.js + Node.js + Express + MySQL (Sequelize ORM) + JWT**.

> Fully functional — not a UI prototype. Includes complete frontend, backend APIs, database models, authentication, table-wise billing isolation, accurate tax calculations, KOT, thermal & A4 printing, payments, history, reports, and settings.

---

## ✨ Features

### 🔐 Authentication & RBAC
- JWT (Bearer + HttpOnly cookie), bcrypt, rate limiting, Helmet, CORS
- Roles: **Super Admin**, **Manager**, **Cashier**, **Waiter**
- Protected routes on both frontend and backend

### 📊 Dashboard
Today's sales, bills count, active orders, available/occupied/reserved/cleaning/billing tables, pending payments, avg bill, sales chart (hourly/daily/monthly), payment breakdown, top-selling items, recent orders.

### 🪑 Table Management (Core)
- Floor plan grid with 6 statuses: Available, Occupied, Reserved, Billing, Cleaning, Out of Service
- Colors distinct but on-brand
- Add/Edit tables, capacity, section/floor, status toggle
- Every dine-in order bound to `tableId` + `activeOrderId` — **table isolation enforced via transaction**
- Transfer order, view active order, prevent duplicate active order per table

### 🛒 POS Billing (3-panel)
- Left: Table selector (status, search, floor filter)
- Center: Category pills + menu cards with veg/non-veg, price, availability
- Right: Order list with qty controls, notes, live totals (subtotal, discount, CGST/SGST, service, round-off, grand total)
- Save order → Send to Kitchen → Generate Bill → Payment → Print

### 📋 Menu Management
- Categories CRUD + soft-deactivate
- Items with price, description, veg type, availability, taxRate, image, preparation station
- Variants support
- **Backend is source of truth for price** — frontend price ignored

### 🧾 Order Lifecycle
`draft → confirmed → preparing → ready → served → completed → cancelled`
- Add items to active order (incremental KOT)
- Update qty / remove, cancel with auth, transfer table, history

### 💰 Accurate Billing & Tax
- Decimal-safe via **paise (integer paise)** = `Math.round(amount*100)`
- MySQL `DECIMAL(10,2)` for money columns
- Discount (fixed / percent), configurable tax (inclusive/exclusive), CGST/SGST split, IGST, service charge, round-off to nearest ₹1
- Example: 760 –20 = 740 +5% = 777 (matches spec)
- Totals recalculated on backend before finalization; printed bill = DB bill

### 🖨️ Printing
- **Thermal Receipt**: 58mm/80mm compact, dashed separators, monospace, print margins
- **A4 Invoice**: Branded with tax summary, bill/order/table/cashier, payment status
- Dedicated printable component + `window.print()` + Save as PDF
- Reprint uses original data, marked REPRINT, no new bill number

### 💳 Payments
Cash, UPI, Debit/Credit Card, Other — partial/split with idempotencyKey to prevent duplicates.

### 👨‍🍳 KOT
KOT number, order/table, items/notes, station, status pipeline; new items → new ticket.

### 📜 Billing History
Search by bill/order, filter by date/table/method/status, view/print, reprint counter.

### 📈 Reports
Daily/Weekly/Monthly, table-wise, item-wise, category-wise, payment-method, discount, tax summary, cancelled, cashier-wise, best-sellers, peak hours + CSV export.

### ⚙️ Settings
Restaurant profile (name, logo, address, GSTIN, footer), billing settings (receipt width, tax, service, bill prefix, round-off), floors/sections, users.

---

## 🎨 Design System

| Role | Color | Hex |
|------|-------|-----|
| Primary (headers, sidebar) | Deep Emerald | `#123C32` |
| Secondary (bg) | Warm Ivory | `#F7F4ED` |
| Accent (CTA, highlights) | Champagne Gold | `#C6A15B` |
| Surface | Pure White | `#FFFFFF` |
| Text | Charcoal | `#252B29` |
| Muted | Muted Gray | `#7B827E` |
| Success/Warning/Error | | `#248A57` `#D99A32` `#C74747` |
| Borders | | `#E6E5DF` |

- Typography: **Outfit** (body) + **Playfair Display** (brand headings)
- Rounded cards (16px), subtle shadows, hover lift, transitions
- Responsive: desktop/laptop/tablet/mobile; large tap targets for POS
- Premium commercial look, not a college project

---

## 🏗️ Architecture

```
hotel-pos/
├── backend/
│   ├── src/
│   │   ├── config/ (database.js, constants.js)
│   │   ├── models/ (index.js — 19 models with associations)
│   │   ├── middleware/ (auth, authorize, errorHandler)
│   │   ├── routes/ (auth, tables, menu, orders, billing, kitchen, dashboard, reports, settings)
│   │   ├── validators/, utils/calculateBill.js, jobs/
│   │   ├── migrations/run.js, seeders/run.js
│   │   ├── app.js, server.js
│   ├── .env.example, package.json, README.md
│   └── database.sqlite (dev)
└── frontend/
    ├── src/
    │   ├── api/axios.js (JWT bearer)
    │   ├── context/AuthContext.jsx
    │   ├── components/layout (Sidebar, Topbar), common/Protect
    │   ├── pages/ Auth, Dashboard, Tables, POS, Menu, Orders, Kitchen, Billing, Reports, Users, Settings
    │   ├── utils/format.js, App.jsx, main.jsx, index.css
    ├── vite.config.js, index.html, .env.example
```

### Database Models (19)
`User, Restaurant, RestaurantSetting, Floor, RestaurantTable, MenuCategory, MenuItem, MenuItemVariant, Order, OrderItem, KOT, KOTItem, Bill, BillItem, Payment, TaxConfiguration, Discount, AuditLog` (+ extras)

- PK/FK, associations, indexes, `DECIMAL` money, unique `billNumber` per restaurant, `orderId` unique in bills, `activeOrderId` on tables, `idempotencyKey` on payments, transactions & row locking for critical operations

---

## 🔒 Security

- bcrypt password hashing, JWT expiry 8h, verification middleware, role middleware
- express-validator, Helmet headers, CORS (configurable), rate limiting on login
- HttpOnly cookie + Bearer both supported; no hardcoded secrets; env-driven

---

## 🚀 Installation (Without Docker — Windows / XAMPP)

### Prerequisites
- Node.js LTS (v18+) + npm
- MySQL Server **or** XAMPP MariaDB
- VS Code (recommended)

### Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env — for XAMPP MySQL:
# DB_DIALECT=mysql
# DB_HOST=localhost
# DB_PORT=3306
# DB_NAME=hotel_pos_db
# DB_USER=root
# DB_PASSWORD=   (empty for XAMPP default)
# JWT_SECRET=change_me_to_strong_random_string
# For SQLite dev (no MySQL needed):
# DB_DIALECT=sqlite

# Create MySQL DB (if using MySQL):
# In phpMyAdmin or mysql client:
CREATE DATABASE hotel_pos_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

npm run setup       # runs migrations + seeders
# Or separately:
node src/migrations/run.js
node src/seeders/run.js

npm run dev         # http://localhost:5000
npm start           # production
```

### Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env
# VITE_API_URL=http://localhost:5000/api
npm run dev         # http://localhost:5173
npm run build       # production
```

### Default URLs
- Frontend: http://localhost:5173
- Backend:  http://localhost:5000

### Initial Admin
Seed creates:
| Email | Username | Password | Role |
|-------|----------|----------|------|
| admin@emerald.com | admin | admin123 | Super Admin |
| manager@emerald.com | manager | admin123 | Manager |
| cashier@emerald.com | cashier | admin123 | Cashier |
| waiter@emerald.com | waiter | admin123 | Waiter |

> Change passwords immediately in production. Create first admin via seeder or `POST /api/settings/users` as super_admin.

---

## 🧪 Business Logic Tests & Edge Cases Covered

1. Table-wise isolation: `tableId` + `activeOrderId` + transaction — adding to Table 1 never touches Table 2/3
2. No duplicate active dine-in order per table
3. Refresh preserves saved orders (DB, not memory)
4. `sendToKitchen` creates incremental KOT for new items only
5. Transfer to available table only
6. Billing recalculated on backend; printed = stored (paise-safe)
7. Duplicate finalization blocked (unique `orderId` in bills, transaction)
8. Reprint does not create new bill; logs `reprintCount`
9. Price change does not affect historical snapshot (`nameSnapshot`, `unitPrice`)
10. RBAC enforced backend-side (not just UI hiding)
11. Expired JWT rejected, audit logs for sensitive ops
12. Failed transaction rolls back (no partial bill)
13. Table not released until payment complete → then `cleaning`
14. Partial payment does not mark `paid` until `sum(payments) >= grandTotal`
15. Idempotency key prevents duplicate payment recording
16. Optimistic concurrency via transactions for same-order edits

---

## 🖨️ Printing Checklist (58mm & 80mm)

- [ ] OS has USB/Network receipt printer installed and set as default
- [ ] Browser print dialog shows printer; margins set to Minimal
- [ ] Receipt width matches Settings (58mm/80mm); test both
- [ ] Item names wrap correctly; qty/price columns aligned
- [ ] Totals, CGST/SGST, round-off visible and match DB
- [ ] Reprint adds "REPRINT" watermark/label
- [ ] A4 prints with logo, address, GSTIN, invoice footer
- [ ] Save as PDF works; then print PDF locally if needed

---

## 📦 Deliverables Checklist

- [x] React frontend (Vite, Router, Axios, Context, premium CSS)
- [x] Node/Express backend (Sequelize, MySQL/SQLite, JWT, bcrypt, Helmet)
- [x] 19 Sequelize models + migrations + seeders
- [x] JWT + RBAC
- [x] Table management + floor plan
- [x] POS 3-panel UI
- [x] Menu management
- [x] Order lifecycle + KOT
- [x] Accurate billing (CGST/SGST, discount, round-off)
- [x] Thermal + A4 printing
- [x] Billing history + reprint
- [x] Reports + CSV export
- [x] Settings + user management
- [x] Input validation + error handling
- [x] .env.example files + docs + sample data

---

## 📄 License

Demo project for hospitality POS — adapt for production with proper payment gateway integration, E2E tests, and MySQL hardening.

---

**Built for:** Premium Hotel Billing & Restaurant POS — Real-world operations ready.
