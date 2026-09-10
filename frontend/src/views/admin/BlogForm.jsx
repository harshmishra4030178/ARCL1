"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Save,
  BookOpen,
  Sparkles,
  Image as ImageIcon,
  Tag,
  ShieldCheck,
  CheckCircle,
  Layers,
  Check,
  Search,
  Heading2,
  Heading3,
  Bold,
  Italic,
  List,
  ListOrdered,
  Quote,
  Table,
  Eye,
  Edit3,
  CornerDownLeft,
} from "lucide-react";
import { toast } from "react-toastify";
import API from "../../api/axios";
import { useBlogStore } from "../../store/useBlogStore";
import { useCategoryStore } from "../../store/useCategoryStore";
import { useEquipmentTypeStore } from "../../store/useEquipmentTypeStore";
import { useProductStore } from "../../store/useProductStore";
import { STANDARDS_DATA } from "../../data/standardsData";
import { formatTitleCase } from "../../utils/stringUtils";
import { parseRichContentToHtml } from "../../utils/richContentParser";

// Extract base catalog machines from STANDARDS_DATA
const BASE_CATALOG_MACHINES = STANDARDS_DATA.flatMap((s) =>
  s.requiredEquipment.map((eq) => ({
    name: eq.name,
    category: s.category,
    image: eq.image,
    code: eq.code || "",
    source: "standards",
  }))
).filter((v, i, a) => a.findIndex((t) => t.image === v.image) === i);

export default function BlogForm({ blogId, isEdit = false }) {
  const router = useRouter();
  const { addBlog, updateBlog, blogs } = useBlogStore();
  const { categories, adminCategories, fetchCategories, fetchAdminCategories } = useCategoryStore();
  const { equipmentTypes, adminEquipmentTypes, fetchEquipmentTypes, fetchAdminEquipmentTypes } = useEquipmentTypeStore();
  const { adminProducts, products, fetchAdminProducts, fetchProducts } = useProductStore();

  const [galleryFilter, setGalleryFilter] = useState("All");
  const [machineSearch, setMachineSearch] = useState("");
  const [contentTab, setContentTab] = useState("write"); // 'write' | 'preview'
  const contentTextareaRef = useRef(null);

  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    category: "Concrete Testing Equipments",
    customCategory: "",
    tags: "",
    relatedStandards: "",
    authorName: "Er. Harsh Mishra",
    authorRole: "Chief Technical Consultant (Civil QA/QC)",
    readTime: "5 min read",
    featuredImage: "https://res.cloudinary.com/domeeznqa/image/upload/v1788261941/products/rwv9chfcohdlnj0zvsgk.jpg",
    metaTitle: "",
    metaDescription: "",
    isPublished: true,
  });

  const [saving, setSaving] = useState(false);

  // Helper to insert formatting or paragraphs at cursor position
  const insertFormatting = (prefix, suffix = "", defaultPlaceholder = "") => {
    const textarea = contentTextareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart ?? 0;
    const end = textarea.selectionEnd ?? 0;
    const currentVal = formData.content || "";
    const selectedText = currentVal.substring(start, end) || defaultPlaceholder;

    const before = currentVal.substring(0, start);
    const after = currentVal.substring(end);

    const newVal = before + prefix + selectedText + suffix + after;
    setFormData((prev) => ({ ...prev, content: newVal }));

    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + prefix.length + selectedText.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 50);
  };

  useEffect(() => {
    fetchCategories();
    if (typeof fetchAdminCategories === "function") fetchAdminCategories();
    fetchEquipmentTypes();
    if (typeof fetchAdminEquipmentTypes === "function") fetchAdminEquipmentTypes();
    if (typeof fetchAdminProducts === "function") fetchAdminProducts();
    if (typeof fetchProducts === "function") fetchProducts();
  }, [
    fetchCategories,
    fetchAdminCategories,
    fetchEquipmentTypes,
    fetchAdminEquipmentTypes,
    fetchAdminProducts,
    fetchProducts,
  ]);

  // 100% Real-Time Defined Equipment Types from Database
  const dynamicEquipmentTypes = useMemo(() => {
    const list = [];
    const seen = new Set();

    const allEq = [...(equipmentTypes || []), ...(adminEquipmentTypes || [])];
    allEq.forEach((eq) => {
      if (eq?.name) {
        const formatted = formatTitleCase(eq.name.trim());
        if (!seen.has(formatted.toLowerCase())) {
          seen.add(formatted.toLowerCase());
          list.push(formatted);
        }
      }
    });

    return list;
  }, [equipmentTypes, adminEquipmentTypes]);

  // Gallery Filter Pills with ONLY 100% Real-Time Equipment Types from Database
  const equipmentPills = useMemo(() => {
    return ["All", ...dynamicEquipmentTypes];
  }, [dynamicEquipmentTypes]);

  // Equipment Type ID -> Name Lookup Map
  const equipmentTypeMap = useMemo(() => {
    const map = {};
    const allEq = [...(equipmentTypes || []), ...(adminEquipmentTypes || [])];
    allEq.forEach((eq) => {
      if (eq?._id && eq?.name) {
        map[eq._id] = formatTitleCase(eq.name.trim());
      }
    });
    return map;
  }, [equipmentTypes, adminEquipmentTypes]);

  // Merge ALL Real-Time Database Products (prioritized first) + Catalog Machines
  const allAvailableMachines = useMemo(() => {
    const machineList = [];
    const seenImages = new Set();

    // 1. Add all real Products created by admin in Database
    const allProd = [...(adminProducts || []), ...(products || [])];
    allProd.forEach((p) => {
      const imgUrl = Array.isArray(p.images) && p.images[0]
        ? p.images[0]
        : typeof p.images === "string"
        ? p.images
        : "";

      if (imgUrl && !seenImages.has(imgUrl)) {
        seenImages.add(imgUrl);

        // Accurate Equipment Type extraction
        const eqTypeId = p.category?.equipmentType?._id || p.category?.equipmentType || p.equipmentTypeId;
        const eqTypeName =
          (p.category?.equipmentType?.name ? formatTitleCase(p.category.equipmentType.name) : null) ||
          equipmentTypeMap[eqTypeId] ||
          (p.equipmentTypeName ? formatTitleCase(p.equipmentTypeName) : "") ||
          "";

        machineList.push({
          name: p.name,
          category: eqTypeName || (p.category?.name ? formatTitleCase(p.category.name) : "General Equipment"),
          equipmentType: eqTypeName,
          image: imgUrl,
          code: p.productCode || p.slug || "",
          source: "database",
        });
      }
    });

    // 2. Add standards catalog machines for fallback
    BASE_CATALOG_MACHINES.forEach((m) => {
      if (!seenImages.has(m.image)) {
        seenImages.add(m.image);
        machineList.push({
          ...m,
          equipmentType: m.category,
        });
      }
    });

    return machineList;
  }, [adminProducts, products, equipmentTypeMap]);

  // Helper to match category image
  const getImageForCategory = (categoryName = "") => {
    const cat = (categoryName || "").toLowerCase();
    const match = allAvailableMachines.find((m) =>
      (m.category || "").toLowerCase().includes(cat) || cat.includes((m.category || "").toLowerCase())
    );
    if (match) return match.image;

    if (cat.includes("soil") || cat.includes("cbr") || cat.includes("shear")) {
      return "https://res.cloudinary.com/domeeznqa/image/upload/v1788334655/products/tmqm10rzvm51w7nvpymj.png";
    }
    if (cat.includes("bitumen") || cat.includes("highway") || cat.includes("ductility") || cat.includes("asphalt")) {
      return "https://res.cloudinary.com/domeeznqa/image/upload/v1788597428/products/s9jsybnbnnirc8mr9hmi.png";
    }
    if (cat.includes("cement") || cat.includes("mortar") || cat.includes("vicat")) {
      return "https://res.cloudinary.com/domeeznqa/image/upload/v1788594444/products/hotkt0gwwf6osg57zz0h.png";
    }
    if (cat.includes("ndt") || cat.includes("hammer") || cat.includes("pulse") || cat.includes("rebound")) {
      return "https://res.cloudinary.com/domeeznqa/image/upload/v1788606413/products/ps5uubhdmrb4dn90qgc8.png";
    }
    if (cat.includes("aggregate") || cat.includes("sieve")) {
      return "https://res.cloudinary.com/domeeznqa/image/upload/v1788351530/products/wadktgpi4lftjnzdg7wv.jpg";
    }
    return "https://res.cloudinary.com/domeeznqa/image/upload/v1788261941/products/rwv9chfcohdlnj0zvsgk.jpg";
  };

  // Filter machines for visual picker with search + equipment type filter
  const filteredMachines = useMemo(() => {
    return allAvailableMachines.filter((m) => {
      let matchesCategory = true;
      if (galleryFilter !== "All") {
        const filterLower = galleryFilter.toLowerCase();
        const mCat = (m.category || "").toLowerCase();
        const mName = (m.name || "").toLowerCase();

        // Extract key identifier words (e.g., "concrete", "soil", "cement", "aggregate", "bitumen", "ndt", "survey")
        const keywords = filterLower
          .replace(/equipments?|testing|materials?|instruments?|&/gi, "")
          .trim()
          .split(/\s+/)
          .filter((k) => k.length > 2);

        matchesCategory =
          mCat.includes(filterLower) ||
          filterLower.includes(mCat) ||
          (keywords.length > 0 && keywords.some((k) => mCat.includes(k) || mName.includes(k)));
      }

      const matchesSearch =
        !machineSearch.trim() ||
        (m.name || "").toLowerCase().includes(machineSearch.toLowerCase()) ||
        (m.category || "").toLowerCase().includes(machineSearch.toLowerCase()) ||
        (m.code || "").toLowerCase().includes(machineSearch.toLowerCase());

      return matchesCategory && matchesSearch;
    });
  }, [allAvailableMachines, galleryFilter, machineSearch]);

  const populateForm = (data) => {
    if (!data) return;
    setFormData({
      title: data.title || "",
      slug: data.slug || "",
      excerpt: data.excerpt || "",
      content: data.content || "",
      category: data.category || "Concrete Testing Equipments",
      customCategory: "",
      tags: Array.isArray(data.tags) ? data.tags.join(", ") : data.tags || "",
      relatedStandards: Array.isArray(data.relatedStandards)
        ? data.relatedStandards.join(", ")
        : data.relatedStandards || "",
      authorName: data.author?.name || "Er. Harsh Mishra",
      authorRole: data.author?.role || "Chief Technical Consultant (Civil QA/QC)",
      readTime: data.readTime || "5 min read",
      featuredImage: data.featuredImage || getImageForCategory(data.category),
      metaTitle: data.metaTitle || "",
      metaDescription: data.metaDescription || "",
      isPublished: data.isPublished !== undefined ? data.isPublished : true,
    });
  };

  useEffect(() => {
    if (isEdit && blogId) {
      const found = blogs.find((b) => b._id === blogId || b.slug === blogId || b.id === blogId);
      if (found) {
        populateForm(found);
      } else {
        API.get(`/admin/blogs/${blogId}`)
          .then((res) => {
            if (res.data?.data) {
              populateForm(res.data.data);
            }
          })
          .catch(() => {
            API.get(`/client/blogs/${blogId}`)
              .then((res2) => {
                if (res2.data?.data?.blog) {
                  populateForm(res2.data.data.blog);
                }
              })
              .catch((err) => console.warn("Could not fetch blog for edit:", err));
          });
      }
    }
  }, [isEdit, blogId, blogs]);

  // When user changes category, automatically update the default featured image to match that category!
  const handleCategoryChange = (e) => {
    const newCategory = e.target.value;
    const autoImage = getImageForCategory(newCategory);
    setFormData((prev) => ({
      ...prev,
      category: newCategory,
      featuredImage: autoImage,
    }));
    // Sync gallery filter as well
    if (newCategory !== "Custom") {
      setGalleryFilter(newCategory);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSelectPresetImage = (imageUrl, itemCategory) => {
    setFormData((prev) => ({
      ...prev,
      featuredImage: imageUrl,
      ...(itemCategory && itemCategory !== "Admin Defined Equipment"
        ? {
            category:
              dynamicEquipmentTypes.find(
                (c) => c.toLowerCase() === itemCategory.toLowerCase()
              ) || prev.category,
          }
        : {}),
    }));
    toast.info("Machine photo selected!");
  };

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!formData.title?.trim()) {
      toast.error("Please enter an article title");
      return;
    }

    setSaving(true);

    try {
      const chosenCategory =
        formData.category === "Custom" && formData.customCategory.trim()
          ? formData.customCategory.trim()
          : formData.category;

      const trimmedTitle = formData.title.trim();
      const trimmedContent =
        (formData.content || "").trim() ||
        `${trimmedTitle} - Comprehensive procedural guidelines, required civil engineering apparatus, calibration benchmarks, and formula derivations.`;
      const trimmedExcerpt =
        (formData.excerpt || "").trim() || trimmedContent.slice(0, 220);

      const payload = {
        title: trimmedTitle,
        slug: formData.slug?.trim() || undefined,
        excerpt: trimmedExcerpt,
        content: trimmedContent,
        category: chosenCategory,
        tags: formData.tags
          ? (typeof formData.tags === "string" ? formData.tags.split(",") : formData.tags)
              .map((t) => t.trim())
              .filter(Boolean)
          : ["Civil Engineering", "Testing Equipment"],
        relatedStandards: formData.relatedStandards
          ? (typeof formData.relatedStandards === "string"
              ? formData.relatedStandards.split(",")
              : formData.relatedStandards
            )
              .map((s) => s.trim())
              .filter(Boolean)
          : [],
        author: {
          name: formData.authorName || "Er. Harsh Mishra",
          role: formData.authorRole || "Chief Technical Consultant (Civil QA/QC)",
          avatar: "/assets/LOGO.png",
        },
        readTime: formData.readTime || "5 min read",
        featuredImage: formData.featuredImage || getImageForCategory(chosenCategory),
        metaTitle: formData.metaTitle || `${trimmedTitle} | ARCL Technical Guide`,
        metaDescription: formData.metaDescription || trimmedExcerpt,
        isPublished: formData.isPublished,
      };

      if (isEdit && blogId) {
        await updateBlog(blogId, payload);
        toast.success("Article updated successfully!");
      } else {
        await addBlog(payload);
        toast.success("Article published successfully!");
      }

      setTimeout(() => {
        router.push("/admin/blogs");
      }, 500);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "Failed to save article";
      console.error("Save error:", err);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        {/* Top Header */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/blogs"
              className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 shadow-sm"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-amber-500" />
                <span>{isEdit ? "Edit Technical Article" : "Create New Technical Article"}</span>
              </h1>
              <p className="text-xs text-slate-500">
                Publish high-ranking technical testing guides with direct equipment photo selection.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? "Saving..." : isEdit ? "Update Article" : "Publish Article Live"}</span>
          </button>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-5">
            
            {/* Title */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Article Title *
              </label>
              <input
                type="text"
                name="title"
                required
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g. IS 516 Concrete Cube Compressive Strength Test: Complete Guide"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500"
              />
            </div>

            {/* Category / Equipment Type Selector */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-amber-600" />
                    <span>Equipment Type *</span>
                  </span>
                  <span className="text-[10px] text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded">
                    Auto-picks matching machine photo
                  </span>
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleCategoryChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 bg-white"
                >
                  <optgroup label="Defined Equipment Types">
                    {dynamicEquipmentTypes.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </optgroup>
                  <option value="Custom">+ Enter Custom Equipment Type...</option>
                </select>

                {formData.category === "Custom" && (
                  <input
                    type="text"
                    name="customCategory"
                    value={formData.customCategory}
                    onChange={handleChange}
                    placeholder="Type custom equipment type..."
                    className="w-full mt-2 px-4 py-2 rounded-xl border border-amber-300 bg-amber-50/50 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Estimated Read Time
                </label>
                <input
                  type="text"
                  name="readTime"
                  value={formData.readTime}
                  onChange={handleChange}
                  placeholder="e.g. 5 min read"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500"
                />
              </div>
            </div>

            {/* Featured Image with 1-Click Visual Preset Machine Picker */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-slate-500" />
                  <span>Featured Machine Photo (Cloudinary) *</span>
                </span>
                <span className="text-[11px] text-amber-700 font-medium">
                  {allAvailableMachines.length} Machines &amp; Equipments available
                </span>
              </label>

              {/* Equipment Type Filter & Search for Gallery */}
              <div className="mb-3 p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>1-Click Machine Photo Picker (Filtered by Equipment Type):</span>
                  </span>

                  {/* Machine Search Input */}
                  <div className="relative w-full sm:w-56">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={machineSearch}
                      onChange={(e) => setMachineSearch(e.target.value)}
                      placeholder="Search equipment name / code..."
                      className="w-full pl-7 pr-3 py-1 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                    {machineSearch && (
                      <button
                        type="button"
                        onClick={() => setMachineSearch("")}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 hover:text-slate-700"
                      >
                        ×
                      </button>
                    )}
                  </div>
                </div>

                {/* Equipment Type Pill Filters */}
                <div className="flex items-center gap-1.5 overflow-x-auto text-[11px] pb-1.5 no-scrollbar">
                  {equipmentPills.map((filterName) => (
                    <button
                      type="button"
                      key={filterName}
                      onClick={() => setGalleryFilter(filterName)}
                      className={`px-3 py-1 rounded-lg font-bold transition-all whitespace-nowrap cursor-pointer ${
                        galleryFilter === filterName
                          ? "bg-slate-900 text-amber-400 shadow-sm ring-1 ring-slate-800"
                          : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100 hover:text-slate-900"
                      }`}
                    >
                      {filterName}
                    </button>
                  ))}
                </div>

                {/* Machine Cards Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2 max-h-60 overflow-y-auto p-1 bg-white rounded-lg border border-slate-200">
                  {filteredMachines.length === 0 ? (
                    <div className="col-span-full py-6 text-center text-xs text-slate-400">
                      No machines found matching "{machineSearch || galleryFilter}". Try another search term or click "All".
                    </div>
                  ) : (
                    filteredMachines.map((item) => {
                      const isSelected = formData.featuredImage === item.image;
                      return (
                        <button
                          type="button"
                          key={`${item.code}-${item.name}-${item.image}`}
                          onClick={() => handleSelectPresetImage(item.image, item.category)}
                          className={`p-1.5 rounded-lg border text-left transition-all flex flex-col items-center justify-between gap-1 relative cursor-pointer group ${
                            isSelected
                              ? "bg-amber-500/15 border-amber-500 ring-2 ring-amber-500/40"
                              : "bg-white border-slate-200 hover:border-slate-400 hover:bg-slate-50"
                          }`}
                        >
                          <div className="w-full h-12 bg-slate-900 rounded p-1 flex items-center justify-center overflow-hidden">
                            <img
                              src={item.image}
                              alt={item.name}
                              onError={(e) => {
                                e.currentTarget.src = "/assets/LOGO.png";
                              }}
                              className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform"
                            />
                          </div>
                          <span className="text-[9px] font-semibold text-slate-800 text-center line-clamp-1 w-full" title={item.name}>
                            {item.name}
                          </span>
                          {item.source === "database" && (
                            <span className="text-[7px] font-bold text-blue-700 bg-blue-50 px-1 py-0.2 rounded border border-blue-200">
                              Database Product
                            </span>
                          )}
                          {isSelected && (
                            <div className="absolute top-1 right-1 w-4 h-4 bg-amber-500 text-slate-950 rounded-full flex items-center justify-center text-[10px] font-bold shadow">
                              <Check className="w-2.5 h-2.5" />
                            </div>
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Custom Image URL Input & Live HD Preview */}
              <div className="flex gap-3 items-center">
                <input
                  type="text"
                  name="featuredImage"
                  value={formData.featuredImage}
                  onChange={handleChange}
                  placeholder="Or paste any custom Cloudinary image URL..."
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 bg-white"
                />
                {formData.featuredImage && (
                  <div className="w-14 h-14 rounded-xl bg-slate-900 p-1.5 flex items-center justify-center flex-shrink-0 border border-slate-300 shadow-sm">
                    <img
                      src={formData.featuredImage}
                      alt="Selected Machine Preview"
                      onError={(e) => {
                        e.currentTarget.src = "/assets/LOGO.png";
                      }}
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Excerpt */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Summary / Excerpt (1-2 lines for Google Search Results) *
              </label>
              <textarea
                name="excerpt"
                rows={2}
                required
                value={formData.excerpt}
                onChange={handleChange}
                placeholder="Brief technical summary explaining what the test is, required apparatus, and key benchmarks..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500"
              />
            </div>

            {/* Rich Article Content with Formatting Toolbar & Live Preview */}
            <div className="space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Article Content (Headings, Paragraphs, Lists & Formulas) *
                </label>

                {/* Write vs Preview Tabs */}
                <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setContentTab("write")}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      contentTab === "write"
                        ? "bg-white text-slate-900 shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <Edit3 size={12} /> Write / Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => setContentTab("preview")}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      contentTab === "preview"
                        ? "bg-amber-500 text-slate-950 shadow-xs font-black"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <Eye size={12} /> 👁️ Live Preview
                  </button>
                </div>
              </div>

              {contentTab === "write" ? (
                <div className="space-y-2">
                  {/* Quick Formatting Toolbar */}
                  <div className="flex flex-wrap items-center gap-1.5 p-2 bg-slate-100/90 rounded-xl border border-slate-200 text-xs">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">
                      Tools:
                    </span>

                    <button
                      type="button"
                      onClick={() => insertFormatting("\n\n## ", "\n", "Main Heading")}
                      className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-50 text-slate-800 font-bold border border-slate-200 shadow-2xs hover:border-amber-400 transition cursor-pointer flex items-center gap-1"
                      title="Add H2 Section Heading"
                    >
                      <Heading2 size={12} className="text-amber-600" /> H2 Heading
                    </button>

                    <button
                      type="button"
                      onClick={() => insertFormatting("\n\n### ", "\n", "Subheading")}
                      className="px-2 py-1 rounded-lg bg-white hover:bg-slate-50 text-slate-800 font-bold border border-slate-200 shadow-2xs hover:border-amber-400 transition cursor-pointer flex items-center gap-1"
                      title="Add H3 Subheading"
                    >
                      <Heading3 size={12} className="text-blue-600" /> H3 Sub
                    </button>

                    <button
                      type="button"
                      onClick={() => insertFormatting("**", "**", "bold text")}
                      className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-50 text-slate-900 font-black border border-slate-200 shadow-2xs hover:border-amber-400 transition cursor-pointer flex items-center gap-1"
                      title="Make Text Bold"
                    >
                      <Bold size={12} /> Bold
                    </button>

                    <button
                      type="button"
                      onClick={() => insertFormatting("*", "*", "italic text")}
                      className="px-2 py-1 rounded-lg bg-white hover:bg-slate-50 text-slate-800 italic font-semibold border border-slate-200 shadow-2xs hover:border-amber-400 transition cursor-pointer flex items-center gap-1"
                      title="Make Text Italic"
                    >
                      <Italic size={12} /> Italic
                    </button>

                    <button
                      type="button"
                      onClick={() => insertFormatting("\n\n", "", "")}
                      className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-950 font-bold border border-amber-300 shadow-2xs transition cursor-pointer flex items-center gap-1"
                      title="Insert New Paragraph (Double Line Break)"
                    >
                      <CornerDownLeft size={12} className="text-amber-700" /> New Paragraph
                    </button>

                    <button
                      type="button"
                      onClick={() => insertFormatting("\n- ", "\n- ", "List item 1")}
                      className="px-2 py-1 rounded-lg bg-white hover:bg-slate-50 text-slate-800 font-bold border border-slate-200 shadow-2xs hover:border-amber-400 transition cursor-pointer flex items-center gap-1"
                      title="Add Bulleted List"
                    >
                      <List size={12} className="text-emerald-600" /> Bullet List
                    </button>

                    <button
                      type="button"
                      onClick={() => insertFormatting("\n1. ", "\n2. ", "Step 1")}
                      className="px-2 py-1 rounded-lg bg-white hover:bg-slate-50 text-slate-800 font-bold border border-slate-200 shadow-2xs hover:border-amber-400 transition cursor-pointer flex items-center gap-1"
                      title="Add Numbered List"
                    >
                      <ListOrdered size={12} className="text-purple-600" /> Numbered
                    </button>

                    <button
                      type="button"
                      onClick={() => insertFormatting("\n> ", "\n", "Important Note / Quality Benchmark")}
                      className="px-2 py-1 rounded-lg bg-white hover:bg-slate-50 text-slate-800 font-bold border border-slate-200 shadow-2xs hover:border-amber-400 transition cursor-pointer flex items-center gap-1"
                      title="Add Highlighted Note Box"
                    >
                      <Quote size={12} className="text-amber-600" /> Note Box
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        insertFormatting(
                          "\n\n| Parameter / Component | Specification / IS Standard |\n| --- | --- |\n| Test Specimen Size | 150mm x 150mm x 150mm |\n| Curing Period | 7 / 28 Days |\n\n",
                          "",
                          ""
                        )
                      }
                      className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-50 text-slate-800 font-bold border border-slate-200 shadow-2xs hover:border-amber-400 transition cursor-pointer flex items-center gap-1"
                      title="Insert Table"
                    >
                      <Table size={12} className="text-indigo-600" /> Table
                    </button>
                  </div>

                  {/* Main Textarea with proper line height & whitespace handling */}
                  <textarea
                    ref={contentTextareaRef}
                    name="content"
                    rows={12}
                    required
                    value={formData.content}
                    onChange={handleChange}
                    placeholder="Type or paste your article here. You can paste paragraphs, headings, lists, tables, or plain text..."
                    className="w-full px-4 py-3.5 rounded-2xl border border-slate-300 text-sm leading-relaxed text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 shadow-2xs font-sans placeholder-slate-400"
                  />

                  <p className="text-[11px] text-slate-500 flex items-center gap-1">
                    💡 <strong>Tip:</strong> Press <kbd className="px-1.5 py-0.5 bg-slate-200 rounded font-mono text-[10px]">Enter</kbd> twice for a new paragraph. Click <strong>"👁️ Live Preview"</strong> above to check how it looks on the frontend before saving.
                  </p>
                </div>
              ) : (
                /* Live Preview Container */
                <div className="p-6 sm:p-8 bg-white rounded-2xl border-2 border-amber-400/60 shadow-md space-y-4 max-h-[500px] overflow-y-auto">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-900 text-xs font-bold border border-amber-200">
                      <Sparkles size={12} className="text-amber-600" /> Real-Time Frontend Preview
                    </span>
                    <span className="text-xs text-slate-400">
                      {formData.content ? `${formData.content.length} characters` : "Empty"}
                    </span>
                  </div>

                  {formData.content ? (
                    <div
                      className="prose prose-slate max-w-none text-slate-700"
                      dangerouslySetInnerHTML={{
                        __html: parseRichContentToHtml(formData.content),
                      }}
                    />
                  ) : (
                    <div className="py-12 text-center text-slate-400 text-sm italic">
                      No content typed yet. Switch to "Write / Edit" to add content.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Standards & Tags */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Compliant Standards (IS / ASTM / BS)
                </label>
                <input
                  type="text"
                  name="relatedStandards"
                  value={formData.relatedStandards}
                  onChange={handleChange}
                  placeholder="e.g. IS 516:2021, IS 456:2000, ASTM C39"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  SEO Tags (Comma separated)
                </label>
                <input
                  type="text"
                  name="tags"
                  value={formData.tags}
                  onChange={handleChange}
                  placeholder="e.g. concrete testing, CTM machine, cube test"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500"
                />
              </div>
            </div>

            {/* Author */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Author Name
                </label>
                <input
                  type="text"
                  name="authorName"
                  value={formData.authorName}
                  onChange={handleChange}
                  placeholder="Er. Harsh Mishra"
                  className="w-full px-4 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Author Role / Designation
                </label>
                <input
                  type="text"
                  name="authorRole"
                  value={formData.authorRole}
                  onChange={handleChange}
                  placeholder="Chief Technical Consultant"
                  className="w-full px-4 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            {/* Publish Toggle */}
            <div className="pt-2 flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800">
                <input
                  type="checkbox"
                  name="isPublished"
                  checked={formData.isPublished}
                  onChange={handleChange}
                  className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500"
                />
                <span>Publish Immediately (Make Visible to Google & Users)</span>
              </label>

              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition-all cursor-pointer"
              >
                {saving ? "Publishing..." : "Publish Article"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
