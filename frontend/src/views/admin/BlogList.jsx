"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  BookOpen,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  Calendar,
  Clock,
  Sparkles,
  RefreshCw,
  ExternalLink,
  Layers,
} from "lucide-react";
import { useBlogStore } from "../../store/useBlogStore";
import { useCategoryStore } from "../../store/useCategoryStore";
import { useEquipmentTypeStore } from "../../store/useEquipmentTypeStore";
import { useProductStore } from "../../store/useProductStore";
import { formatTitleCase } from "../../utils/stringUtils";
import { toast } from "react-toastify";

export default function BlogList() {
  const { blogs, fetchBlogs, deleteBlog, isLoading } = useBlogStore();
  const { categories, adminCategories, fetchCategories, fetchAdminCategories } = useCategoryStore();
  const { equipmentTypes, adminEquipmentTypes, fetchEquipmentTypes, fetchAdminEquipmentTypes } = useEquipmentTypeStore();
  const { adminProducts, products, fetchAdminProducts, fetchProducts } = useProductStore();

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  useEffect(() => {
    fetchBlogs({ category: selectedCategory, search });
    fetchCategories();
    if (typeof fetchAdminCategories === "function") fetchAdminCategories();
    fetchEquipmentTypes();
    if (typeof fetchAdminEquipmentTypes === "function") fetchAdminEquipmentTypes();
    if (typeof fetchAdminProducts === "function") fetchAdminProducts();
    if (typeof fetchProducts === "function") fetchProducts();
  }, [
    selectedCategory,
    search,
    fetchBlogs,
    fetchCategories,
    fetchAdminCategories,
    fetchEquipmentTypes,
    fetchAdminEquipmentTypes,
    fetchAdminProducts,
    fetchProducts,
  ]);

  // Combine ONLY Equipment Types created in Admin Panel
  const allEquipmentTypes = useMemo(() => {
    const list = new Set(["All"]);

    const allEq = [...(equipmentTypes || []), ...(adminEquipmentTypes || [])];
    allEq.forEach((eq) => {
      if (eq?.name) list.add(formatTitleCase(eq.name.trim()));
    });

    if (list.size === 1) {
      [
        "Concrete Testing Equipments",
        "Aggregate Testing Equipments",
        "Cement Testing Equipments",
        "Soil Testing Equipments",
        "NDT Equipments",
        "Surveying Equipments",
        "Bitumen & Asphalt Testing Equipments",
        "Measurement & General Equipments",
        "Laboratory Glasswares",
        "Scientific Equipments",
      ].forEach((name) => list.add(name));
    }

    return Array.from(list);
  }, [equipmentTypes, adminEquipmentTypes]);

  const handleDelete = async (idOrSlug, title) => {
    if (confirm(`Are you sure you want to delete "${title}"?`)) {
      await deleteBlog(idOrSlug);
      toast.success("Article deleted successfully");
    }
  };

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-amber-500" />
            <span>Blog & Technical Articles Management</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Create, edit, publish civil engineering laboratory test guides ({blogs.length} articles across {allEquipmentTypes.length - 1} equipment types).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/blogs/create"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Write New Article</span>
          </Link>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search articles by title, tags..."
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
          />
        </div>

        {/* Dynamic Equipment Types Filter Bar */}
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 no-scrollbar">
          {allEquipmentTypes.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === cat
                  ? "bg-slate-900 text-amber-400 shadow-sm ring-1 ring-slate-800"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Articles Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-900 text-white uppercase text-[11px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Article Title</th>
                <th className="py-3 px-4">Equipment Type / Category</th>
                <th className="py-3 px-4">Author</th>
                <th className="py-3 px-4">Read Time</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {blogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No articles found for "{selectedCategory}". Click "+ Write New Article" to publish one.
                  </td>
                </tr>
              ) : (
                blogs.map((blog) => (
                  <tr key={blog.slug || blog._id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900 max-w-sm">
                      <div className="truncate">{blog.title}</div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5 truncate">
                        /blog/{blog.slug}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 rounded bg-amber-50 text-amber-800 font-semibold border border-amber-200/60 inline-block max-w-[220px] truncate">
                        {formatTitleCase(blog.category)}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 font-medium">
                      {blog.author?.name || "ARCL Team"}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 font-medium">
                      {blog.readTime || "5 min"}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Published</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <Link
                          href={`/blog/${blog.slug}`}
                          target="_blank"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100"
                          title="View Live Article"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                        <Link
                          href={`/admin/blogs/edit/${blog.id || blog._id || blog.slug}`}
                          className="p-1.5 rounded-lg text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                          title="Edit Article"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(blog.id || blog._id || blog.slug, blog.title)}
                          className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 cursor-pointer"
                          title="Delete Article"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
