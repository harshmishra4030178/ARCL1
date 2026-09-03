# 🔬 ARCL-eCommerce (Enterprise Industrial Platform)
> **ARCL Instruments Pvt. Ltd.** — An ISO 9001:2025 Certified Company  
> High-Precision Laboratory, Testing & Scientific Instrumentation Web Application & Management Portal.

---

## 🏛️ System Architecture

This project is engineered using **Clean Enterprise Full-Stack Architecture**:

```
ARCL/
├── backend/
│   ├── src/
│   │   ├── config/              # MongoDB (with DNS auto-fallback) & Cloudinary config
│   │   ├── constants/           # HTTP status codes, DB names, API versioning
│   │   ├── controllers/
│   │   │   ├── admin/           # Dedicated Admin Business Logic (CRUD & Status Workflows)
│   │   │   ├── client/          # Dedicated Public Storefront Logic & Showcases
│   │   │   └── auth/            # Google OAuth & JWT Session Management
│   │   ├── middlewares/         # verifyAdmin, errorHandler, asyncHandler, multer
│   │   ├── models/              # Mongoose Schemas (User, EquipmentType, Category, Product, Inquiry, Contact)
│   │   ├── routes/
│   │   │   ├── admin/           # Protected Admin Routes (/api/v1/admin/*)
│   │   │   ├── client/          # Public Storefront Routes (/api/v1/client/*)
│   │   │   └── authRoutes.js    # Auth Routes (/api/v1/auth/*)
│   │   ├── utils/               # ApiError, ApiResponse, asyncHandler
│   │   ├── app.js               # Express Application Definition
│   │   └── index.js             # Process Bootstrapper & Graceful Shutdown
│   ├── .env.example
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── api/                 # Axios HTTP Layer with Bearer Token Interceptor
    │   ├── assets/              # Company Logos, Hero Carousel Banners, Badges
    │   ├── components/
    │   │   ├── admin/           # Admin Layout, ProtectedRoute, Forms, Modals
    │   │   ├── common/          # Toggle, Tooltip, StatCard, SkeletonLoader, EmptyState
    │   │   ├── layout/          # Public Navbar, Footer, Floating Buttons
    │   │   └── products/        # ProductCard, ProductGrid, ProductToolbar, ProductSidebar
    │   ├── pages/
    │   │   ├── admin/           # AdminLogin, Dashboard, EquipmentTypes, Categories, Products, Inquiries, Messages
    │   │   ├── ProductCatalogPdfPage.jsx  # 📄 Official PDF Catalog Viewer & 1-Click Downloader
    │   │   ├── ProductListingPage.jsx     # 🔍 Multi-Faceted Filterable Product Catalogue
    │   │   ├── CategoryProductPage.jsx    # ⚙️ Dynamic Attribute Specification Filter Page
    │   │   ├── ProductDetailsPage.jsx     # 📦 Product Specs, WhatsApp & Quote Modal
    │   │   ├── Home.jsx                   # 🌟 Hero Carousel & Featured Categories Showcase
    │   │   ├── About.jsx & Contact.jsx
    │   ├── services/            # Normalized Service Data Layer
    │   ├── store/               # Zustand Reactive State Stores
    │   ├── App.jsx
    │   └── main.jsx             # React Router v7
    ├── .env.example
    └── package.json
```

---

## 🌟 Key Features

### 1. 📄 Official PDF Catalog Generation & 1-Click Download
* Every product page has a dedicated **"Download Catalog (PDF)"** button.
* Navigates to `/products/:slug/catalog`, rendering a clean technical specification sheet with:
  * ARCL Instruments Pvt. Ltd. Official Letterhead & ISO 9001:2025 badge
  * High-Res Image, Name, Model Code, Tagline, Description
  * Formatted Technical Specifications Table
  * Features & Applications Bullet Grid
  * Registered Office & Contact Details
* One-click print/download to PDF format directly from any device.

### 2. 🔐 Google OAuth Role-Based Admin Panel
* Google Identity Services OAuth integration + Quick Developer Access.
* Protected by backend JWT verification middleware (`verifyAdmin`) and frontend `ProtectedRoute`.
* Admin Dashboard with real-time counters and quick actions.

### 3. 📦 Complete Product & Catalogue Management
* Displays **all products** (both active and inactive) in Admin Panel.
* Real-time interactive switches for **`isActive`** and **`isFeatured`**.
* Multi-attribute dynamic specification creator on Categories (e.g. Capacity, Accuracy, Material).
* Cloudinary image upload handling with local fallback previews.

### 4. 🔍 Multi-Faceted & Dynamic Specification Filtering
* **Catalogue (`/products`)**: Filter by Equipment Type, dynamic Category, search keyword, and sorting.
* **Category Page (`/categories/:slug`)**: Multi-select specification checkboxes matching product `specifications` map.

---

## 🚀 Quick Start & Local Setup

### 1. Backend Setup
```bash
cd backend
cp .env.example .env
# Update MONGO_URI in .env
npm install
npm start
```
* Backend starts at `http://localhost:3000`
* Health check available at `http://localhost:3000/api/v1/health`

### 2. Frontend Setup
```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```
* Frontend dev server runs at `http://localhost:5173`

---

## 🔑 Admin Login Access
* Visit: `http://localhost:5173/admin`
* Click **"Continue as Admin"** for instant local access, or sign in with your Google account.
