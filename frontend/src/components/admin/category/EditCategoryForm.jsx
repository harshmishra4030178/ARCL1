"use client";

import { useEffect, useState } from "react";
import { FaPlus, FaTrash, FaCogs } from "react-icons/fa";
import { MdClose } from "react-icons/md";
import { useNavigate, useParams } from "../../../utils/navigation.jsx";
import { toast } from "react-toastify";
import {
  getAdminCategoryBySlug,
  updateCategory,
} from "../../../api/categoryApi.js";
import { getAdminEquipmentTypes } from "../../../api/equipmentTypeApi.js";
import { formatTitleCase } from "../../../utils/stringUtils.js";

const EditCategoryForm = ({ initialSlug }) => {
  const navigate = useNavigate();
  const routeParams = useParams();
  const slug = initialSlug || routeParams.slug;

  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [categoryId, setCategoryId] = useState(null);
  const [equipmentTypes, setEquipmentTypes] = useState([]);

  const [form, setForm] = useState({
    name: "",
    description: "",
    howItWorks: "",
    howItWorksSteps: [
      {
        stepNumber: 1,
        title: "",
        description: "",
      },
    ],
    features: [""],
    applications: [""],
    generalSpecifications: [{ key: "", value: "" }],
    equipmentType: "",
    filters: [
      {
        name: "",
        values: "",
      },
    ],
    isFeatured: false,
    isActive: true,
  });

  useEffect(() => {
    if (slug) {
      fetchData();
    }
  }, [slug]);

  const fetchData = async () => {
    try {
      setPageLoading(true);

      const [eqRes, catRes] = await Promise.all([
        getAdminEquipmentTypes(),
        getAdminCategoryBySlug(slug),
      ]);

      setEquipmentTypes(eqRes.data?.data || eqRes.data || []);

      const data = catRes.data?.data || catRes.data;

      if (data) {
        setCategoryId(data._id);
        setForm({
          name: data.name || "",
          description: data.description || "",
          howItWorks: data.howItWorks || "",
          howItWorksSteps:
            Array.isArray(data.howItWorksSteps) && data.howItWorksSteps.length > 0
              ? data.howItWorksSteps.map((s, idx) => ({
                  stepNumber: s.stepNumber || idx + 1,
                  title: s.title || "",
                  description: s.description || "",
                }))
              : [{ stepNumber: 1, title: "", description: "" }],
          features:
            Array.isArray(data.features) && data.features.length > 0
              ? data.features
              : [""],
          applications:
            Array.isArray(data.applications) && data.applications.length > 0
              ? data.applications
              : [""],
          generalSpecifications:
            Array.isArray(data.generalSpecifications) && data.generalSpecifications.length > 0
              ? data.generalSpecifications.map((s) => ({
                  key: s.key || "",
                  value: s.value || "",
                }))
              : [{ key: "", value: "" }],
          equipmentType: data.equipmentType?._id || data.equipmentType || "",
          filters:
            data.filters?.length > 0
              ? data.filters.map((f) => ({
                  name: f.name || "",
                  values: Array.isArray(f.values)
                    ? f.values.join(", ")
                    : f.values || "",
                }))
              : [{ name: "", values: "" }],
          isFeatured: data.isFeatured || false,
          isActive: typeof data.isActive === "boolean" ? data.isActive : true,
        });
      }
    } catch (err) {
      console.error("Failed to load category:", err);
      toast.error("Failed to load category details");
    } finally {
      setPageLoading(false);
    }
  };

  // HOW IT WORKS DYNAMIC STEPS
  const addStep = () => {
    setForm((prev) => ({
      ...prev,
      howItWorksSteps: [
        ...prev.howItWorksSteps,
        {
          stepNumber: prev.howItWorksSteps.length + 1,
          title: "",
          description: "",
        },
      ],
    }));
  };

  const removeStep = (index) => {
    if (form.howItWorksSteps.length === 1) {
      setForm((prev) => ({
        ...prev,
        howItWorksSteps: [{ stepNumber: 1, title: "", description: "" }],
      }));
      return;
    }

    const updated = form.howItWorksSteps
      .filter((_, i) => i !== index)
      .map((s, i) => ({ ...s, stepNumber: i + 1 }));

    setForm((prev) => ({
      ...prev,
      howItWorksSteps: updated,
    }));
  };

  const handleStepChange = (index, field, value) => {
    const updated = [...form.howItWorksSteps];
    updated[index] = { ...updated[index], [field]: value };
    setForm((prev) => ({
      ...prev,
      howItWorksSteps: updated,
    }));
  };

  // FEATURES
  const addFeature = () =>
    setForm((prev) => ({ ...prev, features: [...prev.features, ""] }));

  const removeFeature = (i) => {
    if (form.features.length === 1) {
      setForm((prev) => ({ ...prev, features: [""] }));
      return;
    }
    setForm((prev) => ({
      ...prev,
      features: prev.features.filter((_, idx) => idx !== i),
    }));
  };

  const handleFeatureChange = (i, value) => {
    const updated = [...form.features];
    updated[i] = value;
    setForm((prev) => ({ ...prev, features: updated }));
  };

  // APPLICATIONS
  const addApplication = () =>
    setForm((prev) => ({ ...prev, applications: [...prev.applications, ""] }));

  const removeApplication = (i) => {
    if (form.applications.length === 1) {
      setForm((prev) => ({ ...prev, applications: [""] }));
      return;
    }
    setForm((prev) => ({
      ...prev,
      applications: prev.applications.filter((_, idx) => idx !== i),
    }));
  };

  const handleApplicationChange = (i, value) => {
    const updated = [...form.applications];
    updated[i] = value;
    setForm((prev) => ({ ...prev, applications: updated }));
  };

  // GENERAL SPECIFICATIONS
  const addGeneralSpec = () =>
    setForm((prev) => ({
      ...prev,
      generalSpecifications: [
        ...prev.generalSpecifications,
        { key: "", value: "" },
      ],
    }));

  const removeGeneralSpec = (i) => {
    if (form.generalSpecifications.length === 1) {
      setForm((prev) => ({
        ...prev,
        generalSpecifications: [{ key: "", value: "" }],
      }));
      return;
    }
    setForm((prev) => ({
      ...prev,
      generalSpecifications: prev.generalSpecifications.filter(
        (_, idx) => idx !== i
      ),
    }));
  };

  const handleGeneralSpecChange = (i, field, value) => {
    const updated = [...form.generalSpecifications];
    updated[i] = { ...updated[i], [field]: value };
    setForm((prev) => ({ ...prev, generalSpecifications: updated }));
  };

  // DYNAMIC FILTERS
  const addFilter = () => {
    setForm((prev) => ({
      ...prev,
      filters: [
        ...prev.filters,
        {
          name: "",
          values: "",
        },
      ],
    }));
  };

  const removeFilter = (index) => {
    if (form.filters.length === 1) {
      setForm((prev) => ({
        ...prev,
        filters: [{ name: "", values: "" }],
      }));
      return;
    }

    setForm((prev) => ({
      ...prev,
      filters: prev.filters.filter((_, i) => i !== index),
    }));
  };

  const handleFilterChange = (index, field, value) => {
    const updated = [...form.filters];
    updated[index][field] = value;
    setForm((prev) => ({
      ...prev,
      filters: updated,
    }));
  };

  // SUBMIT
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name.trim() || !form.equipmentType) {
      toast.error("Category name and equipment type are required");
      return;
    }

    try {
      setLoading(true);

      const formattedFilters = form.filters
        .filter((f) => f.name.trim())
        .map((f) => ({
          name: f.name.trim(),
          key: f.name
            .toLowerCase()
            .trim()
            .replace(/\s+/g, "_"),
          values: f.values
            .split(",")
            .map((v) => v.trim())
            .filter(Boolean),
        }));

      const cleanSteps = form.howItWorksSteps.filter(
        (s) => s.title.trim() || s.description.trim()
      );

      const cleanFeatures = form.features.filter((f) => f && f.trim());
      const cleanApplications = form.applications.filter((a) => a && a.trim());
      const cleanGeneralSpecs = form.generalSpecifications
        .filter((s) => s && (s.key?.trim() || s.value?.trim()))
        .map((s) => ({
          key: s.key ? s.key.trim() : "",
          value: s.value ? s.value.trim() : "",
        }));

      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        howItWorks: form.howItWorks.trim(),
        howItWorksSteps: cleanSteps,
        features: cleanFeatures,
        applications: cleanApplications,
        generalSpecifications: cleanGeneralSpecs,
        equipmentType: form.equipmentType,
        isFeatured: form.isFeatured,
        isActive: form.isActive,
        filters: formattedFilters,
      };

      await updateCategory(categoryId, payload);
      toast.success("Category & Master Specifications updated successfully! 🎉");
      navigate("/admin/categories");
    } catch (err) {
      console.error("Update category error:", err);
      toast.error(
        err.response?.data?.message || "Failed to update category"
      );
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <div className="max-w-5xl mx-auto p-12 text-center">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-500">Loading category information...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6">
      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
        
        {/* HEADER */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-8 py-6 border-b border-gray-100">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800">
            Edit Category & Master Specifications
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Update category master description, working principle steps, features, applications, and dynamic filters.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-8">
          
          {/* BASIC INFO */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-semibold text-gray-700">
                Category Name *
              </label>
              <input
                type="text"
                required
                value={form.name}
                className="w-full mt-2 border border-gray-200 rounded-xl p-3.5 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition"
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700">
                Equipment Type *
              </label>
              <select
                required
                value={form.equipmentType}
                className="w-full mt-2 border border-gray-200 rounded-xl p-3.5 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition bg-white cursor-pointer"
                onChange={(e) =>
                  setForm({ ...form, equipmentType: e.target.value })
                }
              >
                <option value="">Select Equipment Type</option>
                {equipmentTypes.map((item) => (
                  <option key={item._id} value={item._id}>
                    {formatTitleCase(item.name)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* MASTER DESCRIPTION */}
          <div>
            <label className="text-sm font-semibold text-gray-700">
              Master Category Description (Applies to all products under this category)
            </label>
            <textarea
              rows="3"
              value={form.description}
              className="w-full mt-2 border border-gray-200 rounded-xl p-3.5 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition"
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />
          </div>

          {/* HOW IT WORKS / WORKING PRINCIPLE WITH DYNAMIC STEPS */}
          <div className="bg-amber-50/40 p-6 rounded-2xl border border-amber-200/70 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-amber-900 flex items-center gap-2">
                  <FaCogs className="text-amber-700" /> How It Works / Working Principle (Optional)
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Dynamic step-by-step process boxes (e.g. 3, 5, or 10 steps).
                </p>
              </div>

              <button
                type="button"
                onClick={addStep}
                className="text-xs font-bold text-amber-900 bg-white hover:bg-amber-100 px-3.5 py-1.5 rounded-xl border border-amber-300 shadow-2xs transition cursor-pointer"
              >
                + Add Step
              </button>
            </div>

            {/* Overview / Intro */}
            <div>
              <label className="text-xs font-semibold text-amber-950 uppercase tracking-wide">
                Principle Overview Summary
              </label>
              <textarea
                rows="2"
                value={form.howItWorks}
                placeholder="e.g. The apparatus functions on planetary blade motion coupled with counter-current batch circulation..."
                className="w-full mt-1.5 border border-gray-200 rounded-xl p-3 text-xs bg-white outline-none focus:border-amber-500"
                onChange={(e) =>
                  setForm({ ...form, howItWorks: e.target.value })
                }
              />
            </div>

            {/* Dynamic Step Boxes */}
            <div className="space-y-3 pt-1">
              <label className="text-xs font-semibold text-amber-950 uppercase tracking-wide block">
                Dynamic Step-by-Step Process Boxes ({form.howItWorksSteps.length})
              </label>

              {form.howItWorksSteps.map((step, index) => (
                <div
                  key={index}
                  className="bg-white p-4 rounded-xl border border-amber-200/80 shadow-2xs space-y-3 relative"
                >
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-900 font-bold text-xs">
                      Step {index + 1}
                    </span>

                    {form.howItWorksSteps.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeStep(index)}
                        className="text-red-500 hover:text-red-700 text-xs flex items-center gap-1 cursor-pointer"
                      >
                        <FaTrash size={10} /> Remove Step
                      </button>
                    )}
                  </div>

                  <div className="grid sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-1">
                      <input
                        type="text"
                        value={step.title}
                        placeholder={`Step ${index + 1} Title`}
                        className="w-full border border-gray-200 p-2.5 rounded-lg text-xs bg-gray-50/50 outline-none focus:border-amber-500 font-semibold"
                        onChange={(e) =>
                          handleStepChange(index, "title", e.target.value)
                        }
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <input
                        type="text"
                        value={step.description}
                        placeholder="Detailed operational action or test mechanism description..."
                        className="w-full border border-gray-200 p-2.5 rounded-lg text-xs bg-gray-50/50 outline-none focus:border-amber-500"
                        onChange={(e) =>
                          handleStepChange(index, "description", e.target.value)
                        }
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* MASTER KEY FEATURES */}
          <div className="bg-blue-50/40 p-6 rounded-2xl border border-blue-100 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-gray-800">
                  Master Key Features
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Applies to all products created under this category.
                </p>
              </div>

              <button
                type="button"
                onClick={addFeature}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 cursor-pointer bg-white px-3 py-1.5 rounded-xl border border-blue-200 shadow-2xs"
              >
                + Add Feature Point
              </button>
            </div>

            <div className="space-y-2.5">
              {form.features.map((f, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    value={f}
                    placeholder={`e.g. Heavy-duty mixing blades with planetary action for uniform dispersion`}
                    className="border border-gray-200 p-3 w-full rounded-xl text-sm bg-white outline-none focus:border-blue-500"
                    onChange={(e) => handleFeatureChange(i, e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => removeFeature(i)}
                    className="p-3 text-red-500 hover:bg-red-50 rounded-xl transition cursor-pointer"
                  >
                    <MdClose size={18} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* MASTER APPLICATIONS */}
          <div className="bg-emerald-50/40 p-6 rounded-2xl border border-emerald-100 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-gray-800">
                  Master Industrial & Lab Applications
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Application scopes inherited by all products under this category.
                </p>
              </div>

              <button
                type="button"
                onClick={addApplication}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-900 cursor-pointer bg-white px-3 py-1.5 rounded-xl border border-emerald-200 shadow-2xs"
              >
                + Add Application Scope
              </button>
            </div>

            <div className="space-y-2.5">
              {form.applications.map((a, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    value={a}
                    placeholder={`e.g. Concrete mix design testing, Ready-Mix Concrete batching QA`}
                    className="border border-gray-200 p-3 w-full rounded-xl text-sm bg-white outline-none focus:border-blue-500"
                    onChange={(e) => handleApplicationChange(i, e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => removeApplication(i)}
                    className="p-3 text-red-500 hover:bg-red-50 rounded-xl transition cursor-pointer"
                  >
                    <MdClose size={18} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* GENERAL TECHNICAL SPECIFICATIONS */}
          <div className="bg-indigo-50/40 p-6 rounded-2xl border border-indigo-100 space-y-4">
            <div className="flex justify-between items-center flex-wrap gap-2">
              <div>
                <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
                  <FaCogs className="text-indigo-600" />
                  General Technical Specifications
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Standard technical parameters that apply to all instruments in this category (e.g. Standard, Power Supply, Motor Power, Accuracy, etc.).
                </p>
              </div>

              <button
                type="button"
                onClick={addGeneralSpec}
                className="text-xs font-bold text-indigo-700 hover:text-indigo-900 cursor-pointer bg-white px-3.5 py-1.5 rounded-xl border border-indigo-200 shadow-2xs"
              >
                + Add Specification Row
              </button>
            </div>

            <div className="space-y-2.5">
              {form.generalSpecifications.map((spec, i) => (
                <div key={i} className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center bg-white p-2.5 rounded-xl border border-indigo-100/70 shadow-2xs">
                  <div className="sm:col-span-5">
                    <input
                      value={spec.key}
                      placeholder="Parameter (e.g. IS Standard, Power Supply)"
                      className="border border-gray-200 p-2.5 w-full rounded-lg text-xs bg-gray-50/50 outline-none focus:border-indigo-500 font-semibold text-gray-700"
                      onChange={(e) => handleGeneralSpecChange(i, "key", e.target.value)}
                    />
                  </div>
                  <div className="sm:col-span-6">
                    <input
                      value={spec.value}
                      placeholder="Value (e.g. IS: 516 / BS: 1881, 220V AC)"
                      className="border border-gray-200 p-2.5 w-full rounded-lg text-xs bg-gray-50/50 outline-none focus:border-indigo-500 text-gray-800"
                      onChange={(e) => handleGeneralSpecChange(i, "value", e.target.value)}
                    />
                  </div>
                  <div className="sm:col-span-1 flex justify-center">
                    <button
                      type="button"
                      onClick={() => removeGeneralSpec(i)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition cursor-pointer"
                      title="Remove row"
                    >
                      <MdClose size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* DYNAMIC FILTERS */}
          <div className="space-y-5">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-gray-800">
                  Dynamic Specification Filters (Distinguishing Attributes)
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Attributes used by products belonging to this category (e.g. Size: 60, 70, 80, 90, 100).
                </p>
              </div>

              <button
                type="button"
                onClick={addFilter}
                className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition cursor-pointer shadow-xs"
              >
                <FaPlus size={10} /> Add Filter
              </button>
            </div>

            <div className="space-y-4">
              {form.filters.map((filter, index) => (
                <div
                  key={index}
                  className="bg-gray-50/70 border border-gray-200 rounded-2xl p-5 space-y-4 hover:bg-white hover:shadow-xs transition"
                >
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-gray-600 uppercase">
                        Filter Name
                      </label>
                      <input
                        type="text"
                        value={filter.name}
                        className="w-full mt-1.5 border border-gray-200 rounded-xl p-3 text-sm bg-white outline-none focus:border-blue-500"
                        onChange={(e) =>
                          handleFilterChange(index, "name", e.target.value)
                        }
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-gray-600 uppercase">
                        Allowed Values (Comma-Separated)
                      </label>
                      <input
                        type="text"
                        value={filter.values}
                        className="w-full mt-1.5 border border-gray-200 rounded-xl p-3 text-sm bg-white outline-none focus:border-blue-500"
                        onChange={(e) =>
                          handleFilterChange(index, "values", e.target.value)
                        }
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => removeFilter(index)}
                      className="inline-flex items-center gap-1 text-xs text-red-500 hover:text-red-700 font-medium cursor-pointer"
                    >
                      <FaTrash size={11} /> Remove Attribute
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* FEATURED TOGGLE */}
          <div className="pt-2">
            <label className="border border-gray-200 rounded-2xl p-5 flex items-center gap-4 cursor-pointer hover:border-blue-400 transition bg-white">
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
                  Featured Category
                </h4>
                <p className="text-xs text-gray-400">
                  Highlight this category and its products in the featured section on the homepage
                </p>
              </div>
            </label>
          </div>

          {/* ACTIONS */}
          <div className="flex justify-end gap-4 border-t border-gray-100 pt-6">
            <button
              type="button"
              onClick={() => navigate("/admin/categories")}
              className="px-6 py-3 rounded-xl border border-gray-200 font-medium text-gray-700 hover:bg-gray-50 transition cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="min-w-[180px] bg-[#021C57] hover:bg-[#03308f] text-white px-8 py-3 rounded-xl font-medium shadow-md transition disabled:opacity-50 cursor-pointer"
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default EditCategoryForm;
