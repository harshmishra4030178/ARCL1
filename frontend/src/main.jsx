import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  RouterProvider,
} from 'react-router-dom'
import './index.css'
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import App from './App.jsx'
import Home from './pages/Home.jsx'
import About from './pages/About.jsx'
import Contact from './pages/Contact.jsx'
import CatalogPage from './pages/CatalogPage.jsx'
import CalibrationServices from './pages/CalibrationServices.jsx'
import CompanyProfile from './pages/CompanyProfile.jsx'
import Layout from './components/admin/layout/Layout.jsx'
import ProtectedRoute from './components/admin/ProtectedRoute.jsx'
import AdminLogin from './pages/admin/AdminLogin.jsx'
import Dashboard from './pages/admin/Dashboard.jsx'
import EquipmentTypeList from './pages/admin/EquipmentTypeList.jsx'
import CategoryList from './pages/admin/CategoryList.jsx'
import ProductList from './pages/admin/ProductList.jsx'
import ProductForm from './pages/admin/ProductForm.jsx'
import CreateCategoryForm from './components/admin/category/CreateCategoryForm.jsx'
import EditCategoryForm from './components/admin/category/EditCategoryForm.jsx'
import ProductListingPage from './pages/ProductListingPage.jsx'
import ProductDetailsPage from './pages/ProductDetailsPage.jsx'
import ProductCatalogPdfPage from './pages/ProductCatalogPdfPage.jsx'
import InquiryPage from './pages/admin/InquiryPage.jsx'
import ContactPage from './pages/admin/ContactPage.jsx'
import CategoryProductsPage from './pages/CategoryProductPage.jsx'
import UserManagementPage from './pages/admin/UserManagementPage.jsx'
import SubscriberListPage from './pages/admin/SubscriberListPage.jsx'

const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      {/* Public Website Layout */}
      <Route path="/" element={<App />}>
        <Route index element={<Home />} />
        <Route path="about" element={<About />} />
        <Route path="catalog" element={<CatalogPage />} />
        <Route path="products" element={<ProductListingPage />} />
        <Route path="products/:slug" element={<ProductDetailsPage />} />
        <Route path="calibration-services" element={<CalibrationServices />} />
        <Route path="company-profile" element={<CompanyProfile />} />
        <Route path="contact" element={<Contact />} />
        <Route path="categories/:slug" element={<CategoryProductsPage />} />
      </Route>

      {/* PDF Catalog Full View & Download (Standalone Page) */}
      <Route path="/products/:slug/catalog" element={<ProductCatalogPdfPage />} />

      {/* Admin Login Route (Public) */}
      <Route path="/admin/login" element={<AdminLogin />} />

      {/* Admin Panel (Protected by Role-Based Auth) */}
      <Route path="/admin" element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="equipment-types" element={<EquipmentTypeList />} />
          <Route path="categories" element={<CategoryList />} />
          <Route path="categories/create" element={<CreateCategoryForm />} />
          <Route path="categories/edit/:slug" element={<EditCategoryForm />} />
          <Route path="products" element={<ProductList />} />
          <Route path="products/create" element={<ProductForm />} />
          <Route path="products/edit/:id" element={<ProductForm />} />
          <Route path="users" element={<UserManagementPage />} />
          <Route path="inquiry" element={<InquiryPage />} />
          <Route path="contact-messages" element={<ContactPage />} />
          <Route path="subscribers" element={<SubscriberListPage />} />
        </Route>
      </Route>
    </>
  )
)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ToastContainer
      position="top-right"
      autoClose={3000}
      hideProgressBar={false}
      newestOnTop={true}
      closeOnClick
      rtl={false}
      pauseOnFocusLoss
      draggable
      pauseOnHover
      theme="light"
      style={{ zIndex: 999999 }}
    />
    <RouterProvider router={router} />
  </StrictMode>,
)
