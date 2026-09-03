"use client";

import { useState, useEffect, useRef } from "react";
import { getAdminCategories } from "../../api/categoryApi.js";
import {
  createProduct,
  getProductById,
  updateProduct,
} from "../../api/productApi.js";
import { useProductStore } from "../../store/useProductStore.js";
import { FaUpload, FaPlus, FaTrash, FaLayerGroup, FaSlidersH } from "react-icons/fa";
import { MdClose } from "react-icons/md";
import { CheckCircle2, ChevronDown, Sparkles, SlidersHorizontal, Info } from "lucide-react";
import { useNavigate, useParams } from "../../utils/navigation.jsx";
import { toast } from "react-toastify";
import { formatTitleCase } from "../../utils/stringUtils.js";

const ProductForm = ({ initialId }) => {
  const routeParams = useParams();
  const id = initialId || routeParams.id;
  const isEditMode = Boolean(id);

  const fileInputRef = useRef();
  const navigate = useNavigate();
  const { fetchAdminProducts } = useProductStore();

  const [form, setForm] = useState({
    name: "",
    productCode: "",
    hsnCode: "",
    description: "",
    category: "",
    features: [""],
    applications: [""],
    completeSetIncludes: [""],
    isFeatured: false,
    isActive: true,
  });

  // 1. Specific values chosen for the category's distinguishing dynamic filters: { [filterKey]: "selectedValue" }
  const [categoryFilterSelections, setCategoryFilterSelections] = useState({});

  // 2. Separate General Technical Specifications: Array of { key: "", value: "" } (can have 0, 5, 10, 20 items)
  const [generalSpecsList, setGeneralSpecsList] = useState([]);

  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const [showAdvancedOverrides, setShowAdvancedOverrides] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(isEditMode);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchInitialData();
  }, [id]);

  const fetchInitialData = async () => {
    try {
      if (isEditMode) setPageLoading(true);

      // Fetch Categories
      const catRes = await getAdminCategories();
      const catList = catRes.data?.data || catRes.data || [];
      setCategories(catList);

      // If Edit Mode, fetch product details
      if (isEditMode && id) {
        const prodRes = await getProductById(id);
        const prod = prodRes.data?.data || prodRes.data;

        if (prod) {
          const matchedCategory = catList.find(
            (c) => c._id === (prod.category?._id || prod.category)
          );
          setSelectedCategory(matchedCategory || null);

          // Separate category filters vs general specs
          const filterSelections = {};
          const otherSpecs = [];

          if (prod.specifications && typeof prod.specifications === "object") {
            const categoryFilterKeys = new Set(
              (matchedCategory?.filters || []).map((f) =>
                f.name.toLowerCase().trim()
              )
            );

            Object.entries(prod.specifications).forEach(([k, v]) => {
              const normalizedK = k.toLowerCase().trim();
              if (categoryFilterKeys.has(normalizedK)) {
                filterSelections[k] = String(v || "");
              } else {
                otherSpecs.push({ key: k, value: String(v || "") });
              }
            });
          }

          setCategoryFilterSelections(filterSelections);
          setGeneralSpecsList(otherSpecs);

          setForm({
            name: prod.name || "",
            productCode: prod.productCode || "",
            hsnCode: prod.hsnCode || "",
            description:
              prod.description || matchedCategory?.description || "",
            category: prod.category?._id || prod.category || "",
            features:
              Array.isArray(prod.features) && prod.features.length > 0
                ? prod.features
                : matchedCategory?.features?.length > 0
                ? matchedCategory.features
                : [""],
            applications:
              Array.isArray(prod.applications) && prod.applications.length > 0
                ? prod.applications
                : matchedCategory?.applications?.length > 0
                ? matchedCategory.applications
                : [""],
            completeSetIncludes:
              Array.isArray(prod.completeSetIncludes) && prod.completeSetIncludes.length > 0
                ? prod.completeSetIncludes
                : [""],
            isFeatured: prod.isFeatured || false,
            isActive: typeof prod.isActive === "boolean" ? prod.isActive : true,
          });

          if (prod.images && prod.images.length > 0) {
            setPreview(prod.images[0]);
          }
        }
      }
    } catch (err) {
      console.error("Failed to load product form data:", err);
      toast.error("Failed to load product details");
    } finally {
      setPageLoading(false);
    }
  };

  const handleCategoryChange = (catId) => {
    const category = categories.find((c) => c._id === catId);
    setSelectedCategory(category || null);

    // Clear previous filter selections (let admin select the specific value for THIS product)
    setCategoryFilterSelections({});

    // Auto-inherit general specifications from category if current specs are empty
    if (category?.generalSpecifications && category.generalSpecifications.length > 0 && generalSpecsList.length === 0) {
      setGeneralSpecsList(
        category.generalSpecifications.map((s) => ({
          key: s.key || "",
          value: s.value || "",
        }))
      );
    }

    // Auto-inherit description, features, applications from the selected category
    const inheritedDesc = category?.description || form.description || "";
    const inheritedFeatures =
      category?.features && category.features.length > 0
        ? category.features
        : form.features.length > 0 && form.features[0]
        ? form.features
        : [""];
    const inheritedApps =
      category?.applications && category.applications.length > 0
        ? category.applications
        : form.applications.length > 0 && form.applications[0]
        ? form.applications
        : [""];

    setForm({
      ...form,
      category: catId,
      description: inheritedDesc,
      features: inheritedFeatures,
      applications: inheritedApps,
    });

    if (errors.category) {
      setErrors((prev) => ({ ...prev, category: null }));
    }
  };

  // CATEGORY FILTER VALUE SELECTION
  const handleCategoryFilterSelect = (filterName, val) => {
    setCategoryFilterSelections((prev) => ({
      ...prev,
      [filterName]: val,
    }));
  };

  // GENERAL TECHNICAL SPECIFICATIONS (UNLIMITED DYNAMIC ROWS)
  const addGeneralSpecRow = () => {
    setGeneralSpecsList((prev) => [...prev, { key: "", value: "" }]);
  };

  const removeGeneralSpecRow = (index) => {
    setGeneralSpecsList((prev) => prev.filter((_, i) => i !== index));
  };

  const handleGeneralSpecChange = (index, field, val) => {
    setGeneralSpecsList((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: val };
      return updated;
    });
  };

  // FEATURES
  const addFeature = () =>
    setForm({ ...form, features: [...form.features, ""] });

  const removeFeature = (i) => {
    if (form.features.length === 1) {
      setForm({ ...form, features: [""] });
      return;
    }
    setForm({
      ...form,
      features: form.features.filter((_, index) => index !== i),
    });
  };

  const handleFeatureChange = (i, value) => {
    const updated = [...form.features];
    updated[i] = value;
    setForm({ ...form, features: updated });
  };

  // APPLICATIONS
  const addApplication = () =>
    setForm({ ...form, applications: [...form.applications, ""] });

  const removeApplication = (i) => {
    if (form.applications.length === 1) {
      setForm({ ...form, applications: [""] });
      return;
    }
    setForm({
      ...form,
      applications: form.applications.filter((_, index) => index !== i),
    });
  };

  const handleApplicationChange = (i, value) => {
    const updated = [...form.applications];
    updated[i] = value;
    setForm({ ...form, applications: updated });
  };

  // COMPLETE SET INCLUDES (STANDARD MACHINE SUPPLY OUTFIT)
  const addCompleteSetItem = () =>
    setForm((prev) => ({
      ...prev,
      completeSetIncludes: [...prev.completeSetIncludes, ""],
    }));

  const removeCompleteSetItem = (i) => {
    if (form.completeSetIncludes.length === 1) {
      setForm((prev) => ({ ...prev, completeSetIncludes: [""] }));
      return;
    }
    setForm((prev) => ({
      ...prev,
      completeSetIncludes: prev.completeSetIncludes.filter(
        (_, index) => index !== i
      ),
    }));
  };

  const handleCompleteSetChange = (i, value) => {
    const updated = [...form.completeSetIncludes];
    updated[i] = value;
    setForm((prev) => ({ ...prev, completeSetIncludes: updated }));
  };

  // IMAGE
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImage(file);
    setPreview(URL.createObjectURL(file));
    if (errors.image) {
      setErrors((prev) => ({ ...prev, image: null }));
    }
  };

  const removeImage = () => {
    setImage(null);
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // VALIDATION
  const validateForm = () => {
    const newErrors = {};

    if (!form.name.trim()) newErrors.name = "Product name is required.";
    if (!form.category) newErrors.category = "Please select a category.";

    // Image required on create mode
    if (!isEditMode && !image && !preview) {
      newErrors.image = "Product image is required. Please upload an image file.";
    }

    return newErrors;
  };

  // SUBMIT
  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validateForm();

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      toast.error("Please fill in the required fields marked with *");
      return;
    }

    try {
      setLoading(true);
      setErrors({});

      // MERGE: Category Filter Selections + General Technical Specifications into specifications object
      const mergedSpecifications = {};

      // 1. Add category filter selections (e.g. Size: "60")
      Object.entries(categoryFilterSelections).forEach(([k, v]) => {
        if (k && k.trim() && v && String(v).trim()) {
          mergedSpecifications[k.trim()] = String(v).trim();
        }
      });

      // 2. Add general technical specifications (e.g. Motor Power: "3.0 HP", Weight: "120kg", etc.)
      generalSpecsList.forEach((spec) => {
        if (spec.key && spec.key.trim()) {
          mergedSpecifications[spec.key.trim()] = spec.value ? spec.value.trim() : "";
        }
      });

      const formData = new FormData();
      formData.append("name", form.name.trim());
      formData.append(
        "productCode",
        (form.productCode || "").trim().toUpperCase()
      );
      formData.append(
        "hsnCode",
        (form.hsnCode || "").trim().toUpperCase()
      );
      formData.append(
        "description",
        form.description.trim() || selectedCategory?.description || ""
      );
      formData.append("category", form.category);
      formData.append("isFeatured", String(form.isFeatured));
      formData.append("isActive", String(form.isActive));

      formData.append(
        "specifications",
        JSON.stringify(mergedSpecifications)
      );

      const cleanFeatures = form.features.filter((f) => f && f.trim());
      formData.append(
        "features",
        JSON.stringify(
          cleanFeatures.length > 0
            ? cleanFeatures
            : selectedCategory?.features || []
        )
      );

      const cleanApplications = form.applications.filter((a) => a && a.trim());
      formData.append(
        "applications",
        JSON.stringify(
          cleanApplications.length > 0
            ? cleanApplications
            : selectedCategory?.applications || []
        )
      );

      const cleanCompleteSet = form.completeSetIncludes.filter((item) => item && item.trim());
      formData.append("completeSetIncludes", JSON.stringify(cleanCompleteSet));

      if (image) {
        formData.append("image", image);
      }

      if (isEditMode) {
        await updateProduct(id, formData);
        toast.success("Product updated successfully! 🎉");
      } else {
        await createProduct(formData);
        toast.success("Product created successfully! 🎉");
      }

      await fetchAdminProducts().catch(() => {});

      setTimeout(() => {
        navigate("/admin/products");
      }, 500);
    } catch (err) {
      console.error("Product submission error:", err);
      toast.error(
        err.response?.data?.message ||
          (isEditMode ? "Failed to update product" : "Failed to create product")
      );
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <div className="max-w-5xl mx-auto p-12 text-center">
        <div className="w-10 h-10 border-4 border-[#021C57] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-500 font-medium">Loading product information...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6">
      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6 md:p-10 space-y-8">
        
        {/* FORM TITLE */}
        <div className="border-b border-gray-100 pb-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-800">
                {isEditMode ? "Edit Product" : "Create New Product"}
              </h2>
              <p className="text-gray-500 text-xs sm:text-sm mt-1">
                Select a category to auto-inherit its description, features, and applications. Just enter product name, image, and dynamic filter values and add general technical specifications.
              </p>
            </div>

          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-7">
          
          {/* STEP 1: CATEGORY SELECTION */}
          <div className="bg-blue-50/40 p-5 rounded-2xl border border-blue-100 space-y-3">
            <label className="text-sm font-bold text-gray-800 flex items-center gap-2">
              <FaLayerGroup className="text-[#021C57]" /> Select Equipment Category <span className="text-red-500">*</span>
            </label>
            
            <select
              value={form.category}
              className={`w-full border p-3.5 rounded-xl focus:ring-2 focus:ring-blue-100 outline-none transition bg-white cursor-pointer ${
                errors.category
                  ? "border-red-400 bg-red-50/20 focus:border-red-500"
                  : "border-gray-200 focus:border-blue-500"
              }`}
              onChange={(e) => handleCategoryChange(e.target.value)}
            >
              <option value="">Choose Category </option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>
                  {formatTitleCase(c.name)} {c.equipmentType?.name ? `(${formatTitleCase(c.equipmentType.name)})` : ""}
                </option>
              ))}
            </select>

            {errors.category && (
              <p className="text-red-500 text-xs font-semibold mt-1">
                {errors.category}
              </p>
            )}

            {selectedCategory && (
              <div className="text-xs text-blue-900 bg-white/80 p-3 rounded-xl border border-blue-200/80 flex items-center justify-between flex-wrap gap-2">
                <span>
                  ✓ Auto-inheriting default description, features, & applications from <strong>{formatTitleCase(selectedCategory.name)}</strong>.
                </span>
                <span className="font-semibold text-blue-700">
                  Category: {formatTitleCase(selectedCategory.name)}
                </span>
              </div>
            )}
          </div>

          {/* STEP 2: CATEGORY DISTINGUISHING FILTER SELECTION (IF CATEGORY HAS FILTERS) */}
          {selectedCategory?.filters && selectedCategory.filters.length > 0 && (
            <div className="bg-emerald-50/40 p-5 rounded-2xl border border-emerald-200/80 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-emerald-950 flex items-center gap-2">
                  <FaSlidersH className="text-emerald-700" /> Category Filter Attributes 
                </h3>
                <p className="text-xs text-emerald-800/80 mt-0.5">
                  Select which specific filter value this product represents (e.g. Size: 60, or Capacity: 100L). Create 1 product for each filter option.
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                {selectedCategory.filters.map((filter) => {
                  const currentValue = categoryFilterSelections[filter.name] || "";

                  return (
                    <div
                      key={filter.name}
                      className="bg-white p-4 rounded-xl border border-emerald-200 shadow-2xs space-y-2"
                    >
                      <label className="text-xs font-bold text-gray-700 uppercase tracking-wide block">
                        {formatTitleCase(filter.name)}
                      </label>

                      {filter.values && filter.values.length > 0 ? (
                        <select
                          value={currentValue}
                          onChange={(e) =>
                            handleCategoryFilterSelect(filter.name, e.target.value)
                          }
                          className="w-full border border-gray-200 p-2.5 rounded-lg text-xs bg-white focus:border-emerald-500 outline-none font-semibold text-gray-800"
                        >
                          <option value="">-- Choose {formatTitleCase(filter.name)} Value --</option>
                          {filter.values.map((val, idx) => (
                            <option key={idx} value={val}>
                              {val}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          value={currentValue}
                          placeholder={`Enter ${filter.name} value`}
                          className="w-full border border-gray-200 p-2.5 rounded-lg text-xs outline-none focus:border-emerald-500"
                          onChange={(e) =>
                            handleCategoryFilterSelect(filter.name, e.target.value)
                          }
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 3: PRODUCT NAME, PRODUCT CODE, AND HSN CODE */}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-bold text-gray-700">
                Product Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.name}
                placeholder="e.g. Lab Pan Mixer 60 Litres"
                className={`w-full border p-3.5 rounded-xl mt-1.5 focus:ring-2 focus:ring-blue-100 outline-none transition ${
                  errors.name
                    ? "border-red-400 bg-red-50/20 focus:border-red-500"
                    : "border-gray-200 focus:border-blue-500"
                }`}
                onChange={(e) => {
                  setForm({ ...form, name: e.target.value });
                  if (errors.name) setErrors({ ...errors, name: null });
                }}
              />
              {errors.name && (
                <p className="text-red-500 text-xs font-semibold mt-1">
                  {errors.name}
                </p>
              )}
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wide flex items-center justify-between">
                  <span>Product Code / SKU</span>
                  <span className="text-[10px] text-gray-400 font-normal">Auto-Uppercase</span>
                </label>
                <input
                  type="text"
                  value={form.productCode}
                  placeholder="e.g. ARCL-LPM-60"
                  className="w-full border border-gray-200 p-3.5 rounded-xl mt-1.5 text-xs font-mono font-bold uppercase focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition"
                  onChange={(e) =>
                    setForm({ ...form, productCode: e.target.value.toUpperCase() })
                  }
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wide flex items-center justify-between">
                  <span>HSN Code</span>
                  <span className="text-[10px] text-gray-400 font-normal">Auto-Uppercase</span>
                </label>
                <input
                  type="text"
                  value={form.hsnCode}
                  placeholder="e.g. 8474 / 9031"
                  className="w-full border border-gray-200 p-3.5 rounded-xl mt-1.5 text-xs font-mono font-bold uppercase focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition"
                  onChange={(e) =>
                    setForm({ ...form, hsnCode: e.target.value.toUpperCase() })
                  }
                />
              </div>
            </div>
          </div>

          {/* STEP 4: COMPLETE SET INCLUDES (STANDARD SUPPLY OUTFIT) */}
          <div className="bg-emerald-50/40 p-6 rounded-2xl border border-emerald-200/70 space-y-4">
            <div className="flex justify-between items-center flex-wrap gap-2">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-gray-800 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white text-xs flex items-center justify-center font-black">
                    ✓
                  </span>
                  Complete Set Includes (Standard Supply Outfit)
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Specify all components, platens, cables, accessories, and calibration certificates supplied with this machine when delivered.
                </p>
              </div>

              <button
                type="button"
                onClick={addCompleteSetItem}
                className="text-xs font-bold text-emerald-800 hover:text-emerald-950 cursor-pointer bg-white px-3.5 py-1.5 rounded-xl border border-emerald-300 shadow-2xs transition"
              >
                + Add Item to Complete Set
              </button>
            </div>

            <div className="space-y-2.5">
              {form.completeSetIncludes.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-6 text-center text-xs font-bold text-emerald-700">
                    {index + 1}.
                  </div>
                  <input
                    type="text"
                    value={item}
                    placeholder={
                      index === 0
                        ? "e.g. 1x Digital Load Indicator with NABL Traceable Calibration Certificate"
                        : index === 1
                        ? "e.g. 1x Pair of Upper & Lower Platens (150mm)"
                        : index === 2
                        ? "e.g. 1x Connecting Hydraulic Hose with Quick Couplers"
                        : "e.g. 1x User Manual & Standard Tool Kit"
                    }
                    className="w-full border border-gray-200 p-2.5 rounded-xl text-xs bg-white outline-none focus:border-emerald-500 text-gray-800"
                    onChange={(e) => handleCompleteSetChange(index, e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => removeCompleteSetItem(index)}
                    className="p-2.5 text-red-500 hover:bg-red-50 rounded-xl transition cursor-pointer shrink-0"
                    title="Remove item"
                  >
                    <MdClose size={18} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* STEP 5: IMAGE UPLOAD */}
          <div>
            <label className="text-sm font-bold text-gray-700">
              Product Image {!isEditMode && <span className="text-red-500">*</span>}
            </label>

            <div
              onClick={() => fileInputRef.current.click()}
              className={`mt-2 border-2 border-dashed p-6 rounded-2xl text-center cursor-pointer transition ${
                errors.image
                  ? "border-red-400 bg-red-50/20"
                  : "border-gray-300 hover:border-blue-500 bg-gray-50/50 hover:bg-blue-50/30"
              }`}
            >
              <FaUpload className="mx-auto text-gray-400 text-xl mb-2" />
              <p className="text-sm font-semibold text-gray-700">
                {image ? `Selected: ${image.name}` : "Click to select product image file"}
              </p>
              <p className="text-xs text-gray-400 mt-1">PNG, JPG, WEBP, JPEG up to 10MB</p>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />

            {preview && (
              <div className="relative mt-4 w-48 rounded-2xl overflow-hidden border-2 border-blue-200 shadow-md">
                <img
                  src={preview}
                  alt="Product preview"
                  className="w-full h-48 object-cover"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-2 right-2 bg-black/75 hover:bg-red-600 text-white p-1.5 rounded-full text-xs transition cursor-pointer"
                  title="Remove Image"
                >
                  <MdClose size={15} />
                </button>
                <div className="bg-blue-900/80 text-white text-[10px] text-center py-1 font-bold">
                  Image Ready
                </div>
              </div>
            )}

            {errors.image && (
              <p className="text-red-500 text-xs font-semibold mt-1.5">
                {errors.image}
              </p>
            )}
          </div>

          {/* STEP 6: OPTIONAL ADVANCED OVERRIDES ACCORDION */}
          <div className="border border-gray-200 rounded-2xl overflow-hidden bg-gray-50/40">
            <button
              type="button"
              onClick={() => setShowAdvancedOverrides(!showAdvancedOverrides)}
              className="w-full p-4 flex items-center justify-between font-bold text-xs sm:text-sm text-gray-700 hover:bg-gray-100/70 transition cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Sparkles size={14} className="text-blue-600" />
                Customize Description, Features, Applications & Specifications (Optional Overrides)
              </span>
              <span className="text-xs text-blue-600 font-semibold flex items-center gap-1">
                {showAdvancedOverrides ? "Hide Details" : "Show Details"}
                <ChevronDown
                  size={14}
                  className={`transition-transform duration-200 ${
                    showAdvancedOverrides ? "rotate-180" : ""
                  }`}
                />
              </span>
            </button>

            {showAdvancedOverrides && (
              <div className="p-5 border-t border-gray-200 bg-white space-y-6 animate-fade-in">
                
                {/* DESCRIPTION */}
                <div>
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                    Product Description (Auto-Inherited from Category)
                  </label>
                  <textarea
                    value={form.description}
                    rows="3"
                    placeholder="Auto-inherited from category..."
                    className="w-full border border-gray-200 p-3 rounded-xl mt-1.5 text-sm outline-none focus:border-blue-500"
                    onChange={(e) =>
                      setForm({ ...form, description: e.target.value })
                    }
                  />
                </div>

                {/* FEATURES */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                      Key Features
                    </label>
                    <button
                      type="button"
                      onClick={addFeature}
                      className="text-blue-600 hover:text-blue-800 text-xs font-bold cursor-pointer"
                    >
                      + Add Feature Point
                    </button>
                  </div>
                  <div className="space-y-2">
                    {form.features.map((f, i) => (
                      <div key={i} className="flex gap-2">
                        <input
                          value={f}
                          placeholder={`Feature #${i + 1}`}
                          className="border border-gray-200 p-2.5 w-full rounded-xl text-xs outline-none focus:border-blue-500"
                          onChange={(e) => handleFeatureChange(i, e.target.value)}
                        />
                        <button
                          type="button"
                          onClick={() => removeFeature(i)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition cursor-pointer"
                        >
                          <MdClose size={15} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* APPLICATIONS */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                      Applications
                    </label>
                    <button
                      type="button"
                      onClick={addApplication}
                      className="text-blue-600 hover:text-blue-800 text-xs font-bold cursor-pointer"
                    >
                      + Add Application Scope
                    </button>
                  </div>
                  <div className="space-y-2">
                    {form.applications.map((a, i) => (
                      <div key={i} className="flex gap-2">
                        <input
                          value={a}
                          placeholder={`Application #${i + 1}`}
                          className="border border-gray-200 p-2.5 w-full rounded-xl text-xs outline-none focus:border-blue-500"
                          onChange={(e) => handleApplicationChange(i, e.target.value)}
                        />
                        <button
                          type="button"
                          onClick={() => removeApplication(i)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition cursor-pointer"
                        >
                          <MdClose size={15} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* GENERAL TECHNICAL SPECIFICATIONS (OPTIONAL OVERRIDES) */}
                <div className="pt-2 border-t border-gray-100">
                  <div className="flex justify-between items-center mb-2 flex-wrap gap-2">
                    <div>
                      <label className="text-xs font-bold text-gray-700 uppercase tracking-wide flex items-center gap-1.5">
                        <SlidersHorizontal size={13} className="text-blue-600" />
                        General Technical Specifications (Optional Overrides)
                      </label>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        Auto-inherited from category master. Add or customize specific parameter rows for this product if needed.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={addGeneralSpecRow}
                      className="text-blue-600 hover:text-blue-800 text-xs font-bold cursor-pointer bg-blue-50/80 px-2.5 py-1 rounded-lg border border-blue-200"
                    >
                      + Add Specification Row
                    </button>
                  </div>

                  {generalSpecsList.length > 0 ? (
                    <div className="space-y-2.5">
                      {generalSpecsList.map((spec, index) => (
                        <div
                          key={index}
                          className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center bg-gray-50/70 p-3 rounded-xl border border-gray-200/80"
                        >
                          <div className="sm:col-span-5">
                            <input
                              type="text"
                              value={spec.key}
                              placeholder="Parameter (e.g. Motor Power, Platen Size)"
                              className="w-full border border-gray-200 p-2.5 rounded-lg text-xs bg-white outline-none focus:border-blue-500 font-semibold text-gray-700"
                              onChange={(e) =>
                                handleGeneralSpecChange(index, "key", e.target.value)
                              }
                            />
                          </div>

                          <div className="sm:col-span-6">
                            <input
                              type="text"
                              value={spec.value}
                              placeholder="Value (e.g. 3.0 HP / 150x150 mm)"
                              className="w-full border border-gray-200 p-2.5 rounded-lg text-xs bg-white outline-none focus:border-blue-500 text-gray-800"
                              onChange={(e) =>
                                handleGeneralSpecChange(index, "value", e.target.value)
                              }
                            />
                          </div>

                          <div className="sm:col-span-1 flex justify-center">
                            <button
                              type="button"
                              onClick={() => removeGeneralSpecRow(index)}
                              className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition cursor-pointer"
                              title="Delete parameter"
                            >
                              <MdClose size={15} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-gray-50/60 p-4 rounded-xl border border-dashed border-gray-300 text-center">
                      <p className="text-xs text-gray-500">
                        No custom specification overrides added. Category master technical specifications will apply automatically.
                      </p>
                    </div>
                  )}
                </div>

              </div>
            )}
          </div>

          {/* TOGGLES */}
          <div className="grid md:grid-cols-2 gap-4 pt-2">
            <label className="border border-gray-200 rounded-2xl p-4 flex items-center gap-3.5 cursor-pointer hover:border-blue-400 transition bg-white">
              <input
                type="checkbox"
                checked={form.isFeatured}
                onChange={(e) =>
                  setForm({ ...form, isFeatured: e.target.checked })
                }
                className="w-5 h-5 accent-blue-600"
              />
              <div>
                <h4 className="font-semibold text-gray-800 text-sm">
                  Mark as Featured Product
                </h4>
                <p className="text-xs text-gray-400">
                  Highlight on the homepage catalogue showcase
                </p>
              </div>
            </label>

            <label className="border border-gray-200 rounded-2xl p-4 flex items-center gap-3.5 cursor-pointer hover:border-blue-400 transition bg-white">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) =>
                  setForm({ ...form, isActive: e.target.checked })
                }
                className="w-5 h-5 accent-blue-600"
              />
              <div>
                <h4 className="font-semibold text-gray-800 text-sm">
                  Product Active Status
                </h4>
                <p className="text-xs text-gray-400">
                  Show or hide this product on the public website
                </p>
              </div>
            </label>
          </div>

          {/* ACTIONS */}
          <div className="flex justify-end gap-4 border-t border-gray-100 pt-6">
            <button
              type="button"
              onClick={() => navigate("/admin/products")}
              className="px-6 py-3 rounded-xl border border-gray-200 hover:bg-gray-50 font-medium text-gray-700 transition cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="min-w-[180px] bg-[#021C57] hover:bg-[#03308f] text-white px-8 py-3 rounded-xl font-bold shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  {isEditMode ? "Saving Changes..." : "Creating Product..."}
                </>
              ) : isEditMode ? (
                "Save Changes"
              ) : (
                "Create Product"
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default ProductForm;
