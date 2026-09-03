"use client";

import { useEffect, useState, useMemo } from "react";
import { useCategoryStore } from "../../store/useCategoryStore.js";
import { useEquipmentTypeStore } from "../../store/useEquipmentTypeStore.js";
import {
  FaEdit,
  FaTrash,
  FaPlus,
  FaSearch,
  FaEye,
  FaChevronLeft,
  FaChevronRight,
  FaLayerGroup,
  FaStar,
  FaRegStar,
} from "react-icons/fa";
import { Link } from "../../utils/navigation.jsx";
import Toggle from "../../components/admin/common/Toggle.jsx";
import SkeletonLoader from "../../components/admin/common/SkeletonLoader.jsx";
import Tooltip from "../../components/admin/common/Tooltip.jsx";
import CategoryDetailsModal from "../../components/admin/category/CategoryDetailsModal.jsx";
import { toast } from "react-toastify";
import { Eye } from "lucide-react";
import { formatTitleCase } from "../../utils/stringUtils.js";

const ITEMS_PER_PAGE = 10;

const CategoryList = () => {
  const {
    categories,
    fetchCategories,
    removeCategory,
    toggleFeatured,
    loading,
    error,
  } = useCategoryStore();

  const { equipmentTypes, fetchEquipmentTypes } = useEquipmentTypeStore();

  const [search, setSearch] = useState("");
  const [selectedEquipmentType, setSelectedEquipmentType] = useState("");
  const [featuredFilter, setFeaturedFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  // Modals & Action states
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [togglingId, setTogglingId] = useState(null);

  useEffect(() => {
    fetchCategories();
    fetchEquipmentTypes();
  }, []);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedEquipmentType, featuredFilter]);

  // Filtered categories
  const filteredCategories = useMemo(() => {
    return categories.filter((cat) => {
      const term = search.toLowerCase().trim();
      const matchesSearch =
        !term ||
        cat.name?.toLowerCase().includes(term) ||
        cat.slug?.toLowerCase().includes(term);

      const matchesEquipment =
        !selectedEquipmentType ||
        cat.equipmentType?._id === selectedEquipmentType ||
        cat.equipmentType === selectedEquipmentType;

      const matchesFeatured =
        featuredFilter === "all" ||
        (featuredFilter === "featured" && cat.isFeatured) ||
        (featuredFilter === "standard" && !cat.isFeatured);

      return matchesSearch && matchesEquipment && matchesFeatured;
    });
  }, [categories, search, selectedEquipmentType, featuredFilter]);

  // Pagination slice
  const totalPages = Math.ceil(filteredCategories.length / ITEMS_PER_PAGE) || 1;
  const paginatedCategories = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredCategories.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredCategories, currentPage]);

  // DELETE
  const handleDelete = async (id) => {
    if (
      !confirm(
        "⚠️ Warning: Deletion May Affect Related Data\n\n" +
        "This record is linked to one or more products or dependent records. " +
        "Deleting it may impact associated data and system relationships.\n\n" +
        "Please verify all related products and dependencies before confirming this action. " +
        "This operation may not be reversible.\n\n" +
        "Do you want to proceed with deletion?"
      )
    ) return;


    try {
      setDeletingId(id);
      await removeCategory(id);
      toast.success("Category deleted successfully");
    } catch (err) {
      toast.error(err.message || "Failed to delete category");
    } finally {
      setDeletingId(null);
    }
  };

  // TOGGLE FEATURED
  const handleToggleFeatured = async (id) => {
    try {
      setTogglingId(id);
      const res = await toggleFeatured(id);
      toast.success(
        res.isFeatured ? "Category marked as featured" : "Removed from featured"
      );
    } catch (err) {
      toast.error(err.message || "Failed to toggle featured status");
    } finally {
      setTogglingId(null);
    }
  };

  // OPEN DETAILS
  const handleOpenDetails = (category) => {
    setSelectedCategory(category);
    setIsDetailsOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <FaLayerGroup className="text-[#021C57]" /> Categories Management
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Total {categories.length} categories • Showing {filteredCategories.length} filtered ({ITEMS_PER_PAGE} per page)
          </p>
        </div>

        <Link
          to="/admin/categories/create"
          className="inline-flex items-center justify-center gap-2 bg-[#021C57] hover:bg-[#03308f] text-white font-medium px-5 py-2.5 rounded-xl shadow-sm transition cursor-pointer"
        >
          <FaPlus size={13} /> Add New Category
        </Link>
      </div>

      {/* FILTER & SEARCH TOOLBAR */}
      <div className="bg-white p-4 rounded-2xl shadow-xs border border-gray-100 flex flex-col md:flex-row gap-4 justify-between items-center">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by category name..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
          <select
            value={selectedEquipmentType}
            onChange={(e) => setSelectedEquipmentType(e.target.value)}
            className="border border-gray-200 rounded-xl px-3.5 py-2 text-sm outline-none bg-white text-gray-700 cursor-pointer focus:border-blue-500"
          >
            <option value="">All Equipment Types ({equipmentTypes.length})</option>
            {equipmentTypes.map((eq) => (
              <option key={eq._id} value={eq._id}>
                {eq.name}
              </option>
            ))}
          </select>

          <select
            value={featuredFilter}
            onChange={(e) => setFeaturedFilter(e.target.value)}
            className="border border-gray-200 rounded-xl px-3.5 py-2 text-sm outline-none bg-white text-gray-700 cursor-pointer focus:border-blue-500"
          >
            <option value="all">All Categories</option>
            <option value="featured">Featured Only</option>
            <option value="standard">Standard Only</option>
          </select>
        </div>
      </div>

      {/* LOADING */}
      {loading && <SkeletonLoader />}

      {/* ERROR */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl">
          {error}
        </div>
      )}

      {/* EMPTY */}
      {!loading && !error && filteredCategories.length === 0 && (
        <div className="bg-white p-12 rounded-3xl shadow-xs border border-gray-100 text-center">
          <p className="text-gray-500 mb-4">No categories matched your criteria.</p>
          <Link
            to="/admin/categories/create"
            className="inline-flex items-center gap-2 bg-[#021C57] text-white px-5 py-2.5 rounded-xl font-medium hover:bg-[#03308f] transition"
          >
            <FaPlus /> Create New Category
          </Link>
        </div>
      )}

      {/* RESPONSIVE TABLE */}
      {!loading && !error && filteredCategories.length > 0 && (
        <div className="bg-white rounded-2xl shadow-xs border border-gray-100 overflow-hidden">
          
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[650px]">
              <thead className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider border-b border-gray-100">
                <tr>
                  <th className="p-4">Category Name</th>
                  <th className="p-4">Equipment Type</th>
                  <th className="p-4">Dynamic Filters</th>
                  <th className="p-4">Featured</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100 text-sm">
                {paginatedCategories.map((cat) => (
                  <tr
                    key={cat._id}
                    className="hover:bg-gray-50/80 transition duration-150"
                  >
                    {/* NAME */}
                    <td className="p-4 font-semibold text-gray-800">
                      <div>{formatTitleCase(cat.name)}</div>
                      <div className="text-xs text-gray-400 font-mono mt-0.5">
                       {cat.description? `${cat.description.slice(0, 30)}${cat.description.length > 30 ? "..." : ""}`
                          : "Equipment Description"}

                      </div>
                    </td>

                    {/* EQUIPMENT TYPE */}
                    <td className="p-4 text-gray-600 font-medium">
                      <span className="bg-blue-50 text-[#021C57] px-2.5 py-1 rounded-lg text-xs font-semibold">
                        {formatTitleCase(cat.equipmentType?.name || "—")}
                      </span>
                    </td>

                    {/* FILTER COUNT */}
                    <td className="p-4">
                      <span className="bg-emerald-50 text-emerald-800 px-2.5 py-1 text-xs font-semibold rounded-full border border-emerald-100">
                        {cat.filters?.length || 0} filters defined
                      </span>
                    </td>

                    {/* FEATURED TOGGLE */}
                    <td className="p-4 text-center">
                      <button
                        onClick={() => handleToggleFeatured(cat._id)}
                        disabled={togglingId === cat._id}
                        className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition shadow-2xs cursor-pointer ${
                          cat.isFeatured
                            ? "bg-amber-100 text-amber-800 hover:bg-amber-200 border border-amber-300"
                            : "bg-gray-100 text-gray-500 hover:bg-gray-200 border border-gray-200"
                        } disabled:opacity-50`}
                        title={
                          cat.isFeatured
                            ? "Click to remove from featured showcase"
                            : "Click to mark as featured on homepage"
                        }
                      >
                        {togglingId === cat._id ? (
                          <span className="w-3 h-3 border-2 border-amber-600 border-t-transparent rounded-full animate-spin"></span>
                        ) : cat.isFeatured ? (
                          <FaStar className="text-amber-500" size={13} />
                        ) : (
                          <FaRegStar className="text-gray-400" size={13} />
                        )}
                        <span>{cat.isFeatured ? "Featured" : "Standard"}</span>
                      </button>
                    </td>

                    {/* ACTIONS */}
                    <td className="p-4">
                      <div className="flex justify-center items-center gap-2">
                        
                        {/* EYE BUTTON (QUICK DETAILS) */}
                        <Tooltip text="View Full Details">
                          <button
                            onClick={() => handleOpenDetails(cat)}
                            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition cursor-pointer"
                          >
                              <Eye className="w-4 h-4" />

                          </button>
                        </Tooltip>

                        {/* EDIT BUTTON */}
                        <Tooltip text="Edit Category">
                          <Link
                            to={`/admin/categories/edit/${cat.slug}`}
                          >
                           
                            <div className='p-2 text-blue-600 hover:bg-blue-50  rounded-xl transition cursor-pointer'>
                              <FaEdit size={15} />
                            </div>
                          </Link>
                        </Tooltip>

                        {/* DELETE BUTTON */}
                        <Tooltip text="Delete Category">
                          <button
                            onClick={() => handleDelete(cat._id)}
                            disabled={deletingId === cat._id}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition disabled:opacity-50 cursor-pointer"
                          >
                            {deletingId === cat._id ? (
                              <span className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin inline-block"></span>
                            ) : (
                              <FaTrash size={14} />
                            )}
                          </button>
                        </Tooltip>

                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* PAGINATION CONTROLS */}
          {totalPages > 1 && (
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500 font-medium">
              <div>
                Showing{" "}
                <span className="font-bold text-gray-800">
                  {(currentPage - 1) * ITEMS_PER_PAGE + 1}
                </span>{" "}
                to{" "}
                <span className="font-bold text-gray-800">
                  {Math.min(
                    currentPage * ITEMS_PER_PAGE,
                    filteredCategories.length
                  )}
                </span>{" "}
                of{" "}
                <span className="font-bold text-gray-800">
                  {filteredCategories.length}
                </span>{" "}
                categories
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                >
                  <FaChevronLeft size={10} />
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
                  <button
                    key={pg}
                    onClick={() => setCurrentPage(pg)}
                    className={`w-8 h-8 rounded-lg font-bold transition cursor-pointer ${
                      currentPage === pg
                        ? "bg-[#021C57] text-white shadow-xs"
                        : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    {pg}
                  </button>
                ))}

                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                >
                  <FaChevronRight size={10} />
                </button>
              </div>
            </div>
          )}

        </div>
      )}

      {/* DETAILS MODAL POPUP */}
      <CategoryDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        category={selectedCategory}
      />

    </div>
  );
};

export default CategoryList;