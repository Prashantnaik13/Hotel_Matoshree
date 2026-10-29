# Hotel POS Backend

## Setup
1. Install Node.js LTS, MySQL or XAMPP MariaDB
2. `cd backend && npm install`
3. Copy `.env.example` to `.env` and configure:
   - For XAMPP MySQL: set DB_DIALECT=mysql, DB_HOST=localhost, DB_PORT=3306, DB_NAME=hotel_pos_db, DB_USER=root, DB_PASSWORD=
   - For SQLite dev (default): DB_DIALECT=sqlite
4. Create MySQL database if using MySQL: `CREATE DATABASE hotel_pos_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
5. Run migrations & seed: `npm run setup`
6. Start: `npm run dev` → http://localhost:5000

## Test Users
- admin / admin123 (super_admin)
- manager / admin123
- cashier / admin123
- waiter / admin123

All JWT protected. Use Bearer token header.
