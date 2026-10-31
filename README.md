<div align="center">

# 📚 Book Store

### Online bookstore with QiCard payments and S3-compatible object storage

![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=for-the-badge&logo=nextdotjs&logoColor=white) ![React](https://img.shields.io/badge/React-19-149ECA?style=for-the-badge&logo=react&logoColor=white) ![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white) ![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=for-the-badge&logo=prisma&logoColor=white) ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-DB-4169E1?style=for-the-badge&logo=postgresql&logoColor=white) ![Clerk](https://img.shields.io/badge/Clerk-Auth-6C47FF?style=for-the-badge&logo=clerk&logoColor=white) ![Tailwind](https://img.shields.io/badge/Tailwind-v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white) ![Zod](https://img.shields.io/badge/Zod-validation-3E67B1?style=for-the-badge&logo=zod&logoColor=white) ![S3](https://img.shields.io/badge/S3-storage-569A31?style=for-the-badge&logo=amazons3&logoColor=white) ![Neon](https://img.shields.io/badge/Neon-serverless-00E599?style=for-the-badge&logo=neon&logoColor=white) ![Vercel](https://img.shields.io/badge/Vercel-deployed-000000?style=for-the-badge&logo=vercel&logoColor=white)

**[📦 Source](https://github.com/n1j10/book-store)**

</div>

---

## ✨ Overview

A bookstore seeded with real book metadata from the **Open Library API**. It takes card payments through **QiCard** and stores images on **Neon Object Storage** (S3-compatible). The seed script is idempotent and uses stable IDs.

The app uses the **Next.js App Router** with **React Server Components** and **Server Actions**, so the storefront needs no separate REST layer. Prisma provides end-to-end typed data access, and Zod validates every mutation before it reaches the database.

## 🧩 Features

**Customer**
- 🛍️ Product catalog with search, category filters and a featured carousel
- 🛒 Server-side cart; totals are **always recomputed on the server**
- ❤️ Favorites, ⭐ reviews and ratings
- 💳 Online checkout with **QiCard** and a payment result page
- 📦 Order history with payment status
- 🌗 Dark and light themes, fully responsive UI

**Admin dashboard** (`/admin`)
- Products CRUD with image upload (Neon Storage (S3))
- Categories CRUD with images
- Book seeding from Open Library
- Orders overview

## 🏗️ Architecture

```mermaid
flowchart LR
  U[Browser] -->|RSC + Server Actions| N[Next.js App Router]
  N -->|proxy.ts| C[Clerk Auth]
  N -->|Prisma| DB[(PostgreSQL)]
  N -->|Images| ST[Neon Storage (S3)]
  N -->|Create payment / inquiry| PG[QiCard]
  PG -->|Callback + webhook| N
```

**Payment flow (the server decides):**
1. The server computes the order total from the cart in the database. The client never supplies it.
2. QiCard returns a hosted payment page where the user pays.
3. On callback or webhook, the server makes a **server-to-server status inquiry** and settles the order in a **Serializable transaction**. Settlement is idempotent, so an order can never be marked paid twice.
4. The confirmed amount must match the stored amount. Otherwise the payment is flagged `AMOUNT_MISMATCH`.

## 🔐 Security

Security was designed in from the start:

| Area | Implementation |
| --- | --- |
| Authentication | `/admin` is guarded in `proxy.ts`, and every admin Server Action checks again (defense in depth) |
| Authorization | All admin mutations call `getAdminUser()`. Cart, favorites and orders are always scoped to the session user (no IDOR) |
| Input validation | Zod schemas for products, reviews, images and cart quantities (integer, 1–100), which blocks negative-price manipulation |
| Payments | The webhook body is untrusted input: status and amount are re-verified with QiCard server-to-server, with an optional RSA signature check. Settlement runs in a Serializable transaction |
| File uploads | Images only, 1 MB cap, sanitized storage keys. Old images are looked up in the database, never taken from client input |
| Spoofing | Review author name and avatar come from the session, not the form |
| HTTP headers | HSTS, `X-Frame-Options`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`; `X-Powered-By` removed |

> Secrets are stored only in environment variables. `.env*` is git-ignored, and `.env.example` contains placeholders only.

## 🛠️ Tech Stack

| Layer | Tech |
| --- | --- |
| Framework | Next.js 16 (App Router, RSC, Server Actions) · React 19 |
| Language | TypeScript (strict) |
| Database | PostgreSQL · Prisma ORM |
| Auth | Clerk |
| Payments | QiCard |
| Storage | Neon Storage (S3) |
| UI | Tailwind CSS v4 · shadcn/ui · Embla Carousel · next-themes |
| Validation | Zod |

## 📁 Project Structure

```
app/
├── (root)/            # storefront: products, cart, orders, favorites, reviews
│   └── api/payment/   # checkout, callback & webhook route handlers
├── (dashboard)/admin/ # admin dashboard
components/            # UI grouped by feature
lib/                   # payment gateway client
utils/
├── actions/           # Server Actions (cart, orders, products, …)
├── schema.ts          # Zod schemas
└── db.ts              # Prisma client singleton
prisma/schema.prisma   # data model
proxy.ts               # route protection (Clerk)
```

## 🚀 Getting Started

```bash
# 1. Install
npm install

# 2. Configure environment
cp .env.example .env        # fill in the values

# 3. Database
npx prisma migrate deploy   # or: npx prisma db push
npm run seed               # optional sample data

# 4. Run
npm run dev                 # http://localhost:3000
```

## ☁️ Deployment

Deployed on **Vercel**. Add the variables from `.env.example` under *Project → Settings → Environment Variables*, then push. Vercel builds and deploys automatically.

Set `WEBSITE_URL` to your HTTPS production URL so QiCard can reach the callback and webhook.

## 👤 Author

**n1j10**, full-stack engineer (Next.js · TypeScript · Node.js · PostgreSQL)

[![GitHub](https://img.shields.io/badge/GitHub-n1j10-181717?style=for-the-badge&logo=github)](https://github.com/n1j10)

> If you find this project useful, a ⭐ on the repo is appreciated.
