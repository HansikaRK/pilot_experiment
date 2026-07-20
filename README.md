# VibeCoding

VibeCoding is a MERN-style ecommerce project with a secure Express/MongoDB backend and a React + TypeScript + Vite frontend. The storefront lets users browse products, view product details, manage a cart, and place an order.

## Project Structure

- `backend/` - Express API, MongoDB models, seed script, and security middleware
- `frontend/frontend/` - React application built with Vite and TypeScript

## Features

- Product catalogue with optional category filtering
- Individual product detail pages
- Cart management and checkout flow
- Order creation with server-side total calculation and validation
- MongoDB-backed product seeding
- Security hardening with Helmet, CORS, rate limiting, sanitization, and validation

## Prerequisites

- Node.js 18+ recommended
- MongoDB running locally or a valid MongoDB Atlas connection string

## Environment Variables

Create a `.env` file in `backend/` with:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/ceyloncart
FRONTEND_URL=http://localhost:5173
```

Create a `.env` file in `frontend/frontend/` if you want to point the app at a custom API URL:

```env
VITE_API_URL=http://localhost:5000/api
```

If `VITE_API_URL` is not set, the frontend will call `/api` by default.

## Installation

Install dependencies separately for the backend and frontend:

```bash
cd backend
npm install

cd ../frontend/frontend
npm install
```

## Running Locally

1. Start MongoDB.
2. Seed the product data.
3. Start the backend.
4. Start the frontend.

Example commands:

```bash
cd backend
node seed.js
npm run dev
```

```bash
cd frontend/frontend
npm run dev
```

By default, the backend runs on `http://localhost:5000` and the frontend runs on `http://localhost:5173`.

## Available Scripts

### Backend (`backend/`)

- `npm start` - Start the Express server
- `npm run dev` - Start the Express server with Nodemon
- `node seed.js` - Replace the products collection with data from `data/products.json`

### Frontend (`frontend/frontend/`)

- `npm run dev` - Start the Vite development server
- `npm run build` - Type-check and build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview the production build locally

## API Overview

- `GET /api/health` - Health check
- `GET /api/products` - List products, optionally filtered by `category`
- `GET /api/products/:id` - Fetch a single product by MongoDB ID
- `POST /api/orders` - Create a new order

## Notes

- The backend uses MongoDB for products and orders.
- Order totals are calculated on the server to avoid trusting client-side totals.
- The frontend routes include the catalogue, product detail, cart, checkout, and order confirmation pages.