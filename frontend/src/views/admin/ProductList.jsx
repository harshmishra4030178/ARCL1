"use client";

import { useEffect, useState, useMemo } from "react";
import {
  FaEdit,
  FaTrash,
  FaPlus,
  FaSearch,
  FaChevronLeft,
  FaChevronRight,
  FaBox,
  FaStar,
  FaRegStar,
  FaCheckCircle,
  FaTimesCircle,
  FaSlidersH,
} from "react-icons/fa";
import { Link } from "../../utils/navigation.jsx";
import { useProductStore } from "../../store/useProductStore.js";
import { useCategoryStore } from "../../store/useCategoryStore.js";
import { useEquipmentTypeStore } from "../../store/useEquipmentTypeStore.js";
import SkeletonLoader from "../../components/admin/common/SkeletonLoader.jsx";
import Tooltip from "../../components/admin/common/Tooltip.jsx";
import ProductDetailsModal from "../../components/admin/product/ProductDetailsModal.jsx";
import { toast } from "react-toastify";
import { Eye, Layers } from "lucide-react";
import { formatTitleCase } from "../../utils/stringUtils.js";

const ProductList = () => {
  const {
    adminProducts,
    fetchAdminProducts,
    toggleActive,
    toggleFeatured,
    removeProduct,
    loading,
    error,
  } = useProductStore();

  const { categories, fetchCategories } = useCategoryStore();
  const { equipmentTypes, fetchEquipmentTypes } = useEquipmentTypeStore();

  const [search, setSearch] = useState("");
  const [selectedEquipmentType, setSelectedEquipmentType] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Modals & Action states
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [togglingId, setTogglingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    fetchAdminProducts();
    fetchCategories();
    fetchEquipmentTypes();
  }, []);

  // Map of equipmentType ID -> Name for instant fallback lookup
  const equipmentTypeMap = useMemo(() => {
    const map = {};
    equipmentTypes.forEach((eq) => {
      if (eq._id && eq.name) {
        map[eq._id] = eq.name;
      }
    });
    return map;
  }, [equipmentTypes]);

  // Filter categories dynamically based on selectedEquipmentType
  const filteredCategoryOptions = useMemo(() => {
    if (!selectedEquipmentType) return categories;
    return categories.filter((cat) => {
      const eqId = cat.equipmentType?._id || cat.equipmentType;
      return eqId === selectedEquipmentType;
    });
  }, [categories, selectedEquipmentType]);

  // Reset to page 1 when search or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedEquipmentType, selectedCategory, statusFilter, itemsPerPage]);

  // Filtered products list
  const filteredProducts = useMemo(() => {
    return adminProducts.filter((product) => {
      const matchesSearch =
        !search.trim() ||
        product.name.toLowerCase().includes(search.toLowerCase()) ||
        product.slug.toLowerCase().includes(search.toLowerCase()) ||
        (product.productCode &&
          product.productCode.toLowerCase().includes(search.toLowerCase())) ||
        (product.hsnCode &&
          product.hsnCode.toLowerCase().includes(search.toLowerCase()));

      // Filter by Equipment Type
      const productEqTypeId =
        product.category?.equipmentType?._id ||
        product.category?.equipmentType ||
        product.equipmentTypeId;

      const matchesEquipmentType =
        !selectedEquipmentType || productEqTypeId === selectedEquipmentType;

      // Filter by Category
      const matchesCategory =
        !selectedCategory ||
        product.category?._id === selectedCategory ||
        product.category === selectedCategory;

      // Filter by Status
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && product.isActive) ||
        (statusFilter === "inactive" && !product.isActive) ||
        (statusFilter === "featured" && product.isFeatured);

      return matchesSearch && matchesEquipmentType && matchesCategory && matchesStatus;
    });
  }, [adminProducts, search, selectedEquipmentType, selectedCategory, statusFilter]);

  // Paginated slice (configurable items per page)
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage) || 1;
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(start, start + itemsPerPage);
  }, [filteredProducts, currentPage, itemsPerPage]);

  // TOGGLE ACTIVE
  const handleToggleActive = async (id) => {
    try {
      setTogglingId(id);
      const res = await toggleActive(id);
      toast.success(
        `Product ${res.isActive ? "activated" : "deactivated"} successfully`
      );
    } catch (err) {
      toast.error("Failed to toggle product status");
    } finally {
      setTogglingId(null);
    }
  };

  // TOGGLE FEATURED
  const handleToggleFeatured = async (id) => {
    try {
      setTogglingId(id);
      const res = await toggleFeatured(id);
      toast.success(
        res.isFeatured ? "Marked as featured" : "Removed from featured"
      );
    } catch (err) {
      toast.error("Failed to toggle featured status");
    } finally {
      setTogglingId(null);
    }
  };

  // DELETE PRODUCT
  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this product? This action cannot be undone."
    );
    if (!confirmDelete) return;

    try {
      setDeletingId(id);
      await removeProduct(id);
      toast.success("Product deleted successfully");
    } catch (err) {
      toast.error("Failed to delete product");
    } finally {
      setDeletingId(null);
    }
  };

  // OPEN DETAILS MODAL
  const handleOpenDetails = (product) => {
    setSelectedProduct(product);
    setIsDetailsOpen(true);
  };

  return (
    <div className="space-y-6 max-w-full">
      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <FaBox className="text-[#021C57]" /> Products Inventory
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Total {adminProducts.length} products • Showing {filteredProducts.length} filtered ({itemsPerPage} per page)
          </p>
        </div>

        <Link
          to="/admin/products/create"
          className="inline-flex items-center justify-center gap-2 bg-[#021C57] hover:bg-[#03308f] text-white font-medium px-5 py-2.5 rounded-xl shadow-sm transition cursor-pointer self-start sm:self-auto"
        >
          <FaPlus size={13} /> Add New Product
        </Link>
      </div>

      {/* FILTER & SEARCH TOOLBAR */}
      <div className="bg-white p-4 rounded-2xl shadow-xs border border-gray-100 flex flex-col lg:flex-row gap-3 justify-between items-stretch lg:items-center">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by product name, SKU, HSN, or slug..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition"
          />
        </div>

        {/* Dropdowns */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Equipment Type Filter */}
          <select
            value={selectedEquipmentType}
            onChange={(e) => {
              setSelectedEquipmentType(e.target.value);
              setSelectedCategory(""); // Reset category when equipment type changes
            }}
            className="border border-gray-200 rounded-xl px-3 py-2 text-xs sm:text-sm outline-none bg-white text-gray-700 cursor-pointer focus:border-blue-500 font-medium"
          >
            <option value="">All Equipment Types ({equipmentTypes.length})</option>
            {equipmentTypes.map((eq) => (
              <option key={eq._id} value={eq._id}>
                {formatTitleCase(eq.name)}
              </option>
            ))}
          </select>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-xs sm:text-sm outline-none bg-white text-gray-700 cursor-pointer focus:border-blue-500 font-medium"
          >
            <option value="">All Categories ({filteredCategoryOptions.length})</option>
            {filteredCategoryOptions.map((cat) => (
              <option key={cat._id} value={cat._id}>
                {formatTitleCase(cat.name)}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-xs sm:text-sm outline-none bg-white text-gray-700 cursor-pointer focus:border-blue-500 font-medium"
          >
            <option value="all">All Status</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
            <option value="featured">Featured Only</option>
          </select>

          {/* Page Size Selector */}
          <select
            value={itemsPerPage}
            onChange={(e) => setItemsPerPage(Number(e.target.value))}
            className="border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold outline-none bg-gray-50 text-gray-700 cursor-pointer focus:border-blue-500"
            title="Items per page"
          >
            <option value={10}>10 / pg</option>
            <option value={15}>15 / pg</option>
            <option value={25}>25 / pg</option>
            <option value={50}>50 / pg</option>
          </select>
        </div>
      </div>

      {/* LOADING SKELETON */}
      {loading && <SkeletonLoader />}

      {/* ERROR */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl">
          {error}
        </div>
      )}

      {/* EMPTY STATE */}
      {!loading && !error && filteredProducts.length === 0 && (
        <div className="bg-white p-12 rounded-3xl shadow-xs border border-gray-100 text-center">
          <p className="text-gray-500 mb-4 text-base">
            No products matched your criteria.
          </p>
          <Link
            to="/admin/products/create"
            className="inline-flex items-center gap-2 bg-[#021C57] text-white px-5 py-2.5 rounded-xl font-medium hover:bg-[#03308f] transition"
          >
            <FaPlus /> Create New Product
          </Link>
        </div>
      )}

      {/* COMPACT CLEAN TABLE (No awkward horizontal scroll on desktop) */}
      {!loading && !error && filteredProducts.length > 0 && (
        <div className="bg-white rounded-2xl shadow-xs border border-gray-100 overflow-hidden">
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-gray-50 text-gray-600 text-[11px] sm:text-xs uppercase tracking-wider border-b border-gray-100">
                <tr>
                  <th className="py-3.5 px-4 font-bold">Product & Equipment Type</th>
                  <th className="py-3.5 px-4 font-bold">Category</th>
                  <th className="py-3.5 px-3 font-bold text-center">Specs</th>
                  <th className="py-3.5 px-3 font-bold text-center">Featured</th>
                  <th className="py-3.5 px-3 font-bold text-center">Status</th>
                  <th className="py-3.5 px-4 font-bold text-center">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {paginatedProducts.map((product) => {
                  const eqId =
                    product.category?.equipmentType?._id ||
                    product.category?.equipmentType ||
                    product.equipmentTypeId;

                  const equipmentName =
                    product.category?.equipmentType?.name ||
                    product.equipmentTypeName ||
                    equipmentTypeMap[eqId] ||
                    "Laboratory Equipment";

                  return (
                    <tr
                      key={product._id}
                      className="hover:bg-gray-50/80 transition duration-150"
                    >
                      {/* PRODUCT INFO (SHOWS EQUIPMENT TYPE UNDER PRODUCT NAME INSTEAD OF DESCRIPTION) */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-xl bg-gray-50 border border-gray-200 shrink-0 overflow-hidden flex items-center justify-center p-1">
                            <img
                              src={
                                Array.isArray(product.images) && product.images[0]
                                  ? product.images[0]
                                  : typeof product.images === "string"
                                  ? product.images
                                  : "/placeholder.png"
                              }
                              alt={product.name}
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                e.target.style.display = "none";
                              }}
                            />
                          </div>

                          <div className="min-w-0 max-w-xs sm:max-w-md">
                            <div className="font-bold text-gray-900 line-clamp-1">
                              {formatTitleCase(product.name)}
                            </div>
                            
                            {/* EQUIPMENT TYPE NAME & SKU UNDER PRODUCT NAME */}
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                              <span className="text-[11px] font-semibold text-blue-700 flex items-center gap-1">
                                <Layers size={10} className="text-blue-500" />
                                {formatTitleCase(equipmentName)}
                              </span>

                              {product.productCode && (
                                <span className="text-[10px] font-mono font-bold text-gray-500 bg-gray-100 px-1.5 py-0.2 rounded border border-gray-200">
                                  {product.productCode.toUpperCase()}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* CATEGORY */}
                      <td className="py-3.5 px-4 text-gray-700 font-medium">
                        <span className="bg-gray-100 text-gray-800 px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap">
                          {formatTitleCase(product.category?.name || "—")}
                        </span>
                      </td>

                      {/* SPECS COUNT */}
                      <td className="py-3.5 px-3 text-center">
                        <span className="bg-blue-50 text-blue-700 px-2.5 py-1 text-[11px] font-bold rounded-full border border-blue-100 whitespace-nowrap">
                          {product.specifications
                            ? Object.keys(product.specifications).length
                            : 0}{" "}
                          specs
                        </span>
                      </td>

                      {/* IS FEATURED TOGGLE */}
                      <td className="py-3.5 px-3 text-center">
                        <button
                          onClick={() => handleToggleFeatured(product._id)}
                          disabled={togglingId === product._id}
                          className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold transition shadow-2xs cursor-pointer ${
                            product.isFeatured
                              ? "bg-amber-100 text-amber-800 hover:bg-amber-200 border border-amber-300"
                              : "bg-gray-100 text-gray-500 hover:bg-gray-200 border border-gray-200"
                          } disabled:opacity-50`}
                          title={
                            product.isFeatured
                              ? "Click to remove from featured"
                              : "Click to mark as featured on homepage"
                          }
                        >
                          {togglingId === product._id ? (
                            <span className="w-3 h-3 border-2 border-amber-600 border-t-transparent rounded-full animate-spin"></span>
                          ) : product.isFeatured ? (
                            <FaStar className="text-amber-500" size={11} />
                          ) : (
                            <FaRegStar className="text-gray-400" size={11} />
                          )}
                          <span>{product.isFeatured ? "Featured" : "Standard"}</span>
                        </button>
                      </td>

                      {/* IS ACTIVE TOGGLE */}
                      <td className="py-3.5 px-3 text-center">
                        <button
                          onClick={() => handleToggleActive(product._id)}
                          disabled={togglingId === product._id}
                          className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold transition shadow-2xs cursor-pointer ${
                            product.isActive
                              ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-300"
                              : "bg-red-100 text-red-700 hover:bg-red-200 border border-red-200"
                          } disabled:opacity-50`}
                          title={
                            product.isActive
                              ? "Click to deactivate / hide from website"
                              : "Click to activate / publish on website"
                          }
                        >
                          {product.isActive ? (
                            <FaCheckCircle className="text-emerald-600" size={11} />
                          ) : (
                            <FaTimesCircle className="text-red-500" size={11} />
                          )}
                          <span>{product.isActive ? "Active" : "Inactive"}</span>
                        </button>
                      </td>

                      {/* ACTIONS */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex justify-center items-center gap-1.5">
                          {/* EYE BUTTON (QUICK DETAILS POPUP) */}
                          <Tooltip text="Quick Preview">
                            <button
                              onClick={() => handleOpenDetails(product)}
                              className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition cursor-pointer"
                            >
                              <Eye size={16} />
                            </button>
                          </Tooltip>

                          {/* EDIT BUTTON */}
                          <Tooltip text="Edit Product">
                            <Link
                              to={`/admin/products/edit/${product._id}`}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition cursor-pointer"
                            >
                              <FaEdit size={14} />
                            </Link>
                          </Tooltip>

                          {/* DELETE BUTTON */}
                          <Tooltip text="Delete Product">
                            <button
                              onClick={() => handleDelete(product._id)}
                              disabled={deletingId === product._id}
                              className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition disabled:opacity-50 cursor-pointer"
                            >
                              {deletingId === product._id ? (
                                <span className="w-3.5 h-3.5 border-2 border-red-500 border-t-transparent rounded-full animate-spin inline-block"></span>
                              ) : (
                                <FaTrash size={13} />
                              )}
                            </button>
                          </Tooltip>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* PAGINATION FOOTER */}
          <div className="bg-gray-50 px-4 py-3 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
            <div>
              Showing{" "}
              <span className="font-semibold text-gray-700">
                {(currentPage - 1) * itemsPerPage + 1}
              </span>{" "}
              to{" "}
              <span className="font-semibold text-gray-700">
                {Math.min(currentPage * itemsPerPage, filteredProducts.length)}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-gray-700">
                {filteredProducts.length}
              </span>{" "}
              entries
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-gray-200 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                title="Previous Page"
              >
                <FaChevronLeft size={11} />
              </button>

              <span className="px-3 py-1 font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg">
                Page {currentPage} of {totalPages}
              </span>

              <button
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-gray-200 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                title="Next Page"
              >
                <FaChevronRight size={11} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QUICK VIEW DETAILS MODAL */}
      <ProductDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        product={selectedProduct}
      />
    </div>
  );
};

export default ProductList;