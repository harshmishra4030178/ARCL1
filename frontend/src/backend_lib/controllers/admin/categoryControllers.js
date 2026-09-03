import Category from "../../models/category.js";
import EquipmentType from "../../models/equipmentType.js";
import Product from "../../models/product.js";
import slugify from "slugify";
import mongoose from "mongoose";

/**
 * Helper to clean and format howItWorksSteps
 */
const formatSteps = (steps) => {
  if (typeof steps === "string") {
    try {
      steps = JSON.parse(steps);
    } catch (e) {
      steps = [];
    }
  }

  if (!Array.isArray(steps)) return [];

  return steps
    .filter((s) => s && (s.title?.trim() || s.description?.trim()))
    .map((s, idx) => ({
      stepNumber: typeof s.stepNumber === "number" ? s.stepNumber : idx + 1,
      title: s.title ? s.title.trim() : `Step ${idx + 1}`,
      description: s.description ? s.description.trim() : "",
    }));
};

/**
 * @desc    Create Category
 * @route   POST /api/v1/admin/categories
 * @access  Admin
 */
export const createCategory = async (req, res) => {
  try {
    let {
      name,
      description,
      howItWorks,
      howItWorksSteps,
      features,
      applications,
      generalSpecifications,
      equipmentType,
      filters,
      isFeatured,
      isActive,
    } = req.body;

    if (!name || !equipmentType) {
      return res.status(400).json({
        success: false,
        message: "Name and Equipment Type are required.",
      });
    }

    const equipment = await EquipmentType.findById(equipmentType);
    if (!equipment) {
      return res.status(404).json({
        success: false,
        message: "Equipment Type not found.",
      });
    }

    const slug = slugify(name, {
      lower: true,
      strict: true,
      trim: true,
    });

    const existingCategory = await Category.findOne({
      $or: [{ name: new RegExp(`^${name.trim()}$`, "i") }, { slug }],
    });

    if (existingCategory) {
      return res.status(409).json({
        success: false,
        message: "Category with this name already exists.",
      });
    }

    // Format features & applications
    if (typeof features === "string") {
      try {
        features = JSON.parse(features);
      } catch (e) {
        features = features.split("\n").map((f) => f.trim()).filter(Boolean);
      }
    }
    const cleanFeatures = Array.isArray(features)
      ? features.filter((f) => f && String(f).trim().length > 0)
      : [];

    if (typeof applications === "string") {
      try {
        applications = JSON.parse(applications);
      } catch (e) {
        applications = applications.split("\n").map((a) => a.trim()).filter(Boolean);
      }
    }
    const cleanApplications = Array.isArray(applications)
      ? applications.filter((a) => a && String(a).trim().length > 0)
      : [];

    // Format generalSpecifications
    let cleanGeneralSpecs = [];
    if (typeof generalSpecifications === "string") {
      try {
        generalSpecifications = JSON.parse(generalSpecifications);
      } catch (e) {
        cleanGeneralSpecs = [];
      }
    }
    if (Array.isArray(generalSpecifications)) {
      cleanGeneralSpecs = generalSpecifications
        .filter((s) => s && (s.key?.trim() || s.value?.trim()))
        .map((s) => ({
          key: s.key ? String(s.key).trim() : "",
          value: s.value ? String(s.value).trim() : "",
        }));
    } else if (generalSpecifications && typeof generalSpecifications === "object") {
      cleanGeneralSpecs = Object.entries(generalSpecifications).map(([k, v]) => ({
        key: String(k).trim(),
        value: String(v).trim(),
      }));
    }

    // Format filters
    const formattedFilters = Array.isArray(filters)
      ? filters.map((f) => ({
          name: f.name ? f.name.trim() : "",
          key:
            f.key ||
            slugify(f.name || "", { lower: true, replacement: "_" }),
          values: Array.isArray(f.values)
            ? f.values
            : typeof f.values === "string"
            ? f.values
                .split(",")
                .map((v) => v.trim())
                .filter(Boolean)
            : [],
        }))
      : [];

    const formattedSteps = formatSteps(howItWorksSteps);

    const category = await Category.create({
      name: name.trim(),
      slug,
      description: description ? description.trim() : "",
      howItWorks: howItWorks ? howItWorks.trim() : "",
      howItWorksSteps: formattedSteps,
      features: cleanFeatures,
      applications: cleanApplications,
      generalSpecifications: cleanGeneralSpecs,
      equipmentType,
      filters: formattedFilters,
      isFeatured: isFeatured === true || isFeatured === "true",
      isActive:
        typeof isActive !== "undefined"
          ? isActive === true || isActive === "true"
          : true,
    });

    await category.populate("equipmentType", "name slug");

    return res.status(201).json({
      success: true,
      message: "Category created successfully! 🎉",
      data: category,
    });
  } catch (error) {
    console.error("Create Category Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error.",
    });
  }
};

/**
 * @desc    Get All Categories (Admin)
 * @route   GET /api/v1/admin/categories
 * @access  Admin
 */
export const getCategories = async (req, res) => {
  try {
    let {
      page,
      limit,
      search = "",
      equipmentType,
      sort = "createdAt",
      order = "desc",
    } = req.query;

    const query = {};

    if (search && search.trim()) {
      query.name = {
        $regex: search.trim(),
        $options: "i",
      };
    }

    if (equipmentType) {
      query.equipmentType = equipmentType;
    }

    const sortOption = {
      [sort]: order === "asc" ? 1 : -1,
    };

    if (page && limit) {
      page = parseInt(page);
      limit = parseInt(limit);
      const totalCategories = await Category.countDocuments(query);
      const categories = await Category.find(query)
        .populate("equipmentType", "name slug")
        .sort(sortOption)
        .skip((page - 1) * limit)
        .limit(limit);

      return res.status(200).json({
        success: true,
        message: "Categories fetched successfully.",
        totalCategories,
        currentPage: page,
        totalPages: Math.ceil(totalCategories / limit),
        data: categories,
      });
    }

    const categories = await Category.find(query)
      .populate("equipmentType", "name slug")
      .sort(sortOption);

    return res.status(200).json({
      success: true,
      count: categories.length,
      data: categories,
    });
  } catch (error) {
    console.error("Get Categories Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch categories.",
      error: error.message,
    });
  }
};

/**
 * @desc    Get Category By ID (Admin)
 * @route   GET /api/v1/admin/categories/id/:id
 * @access  Admin
 */
export const getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Category ID.",
      });
    }

    const category = await Category.findById(id).populate(
      "equipmentType",
      "name slug"
    );

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: category,
    });
  } catch (error) {
    console.error("Get Category By ID Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error.",
      error: error.message,
    });
  }
};

/**
 * @desc    Get Category By Slug (Admin/Client)
 * @route   GET /api/v1/admin/categories/:slug
 * @access  Admin
 */
export const getCategory = async (req, res) => {
  try {
    const { slug } = req.params;

    const category = await Category.findOne({ slug }).populate(
      "equipmentType",
      "name slug"
    );

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: category,
    });
  } catch (error) {
    console.error("Get Category Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error.",
    });
  }
};

/**
 * @desc    Update Category
 * @route   PUT /api/v1/admin/categories/:id
 * @access  Admin
 */
export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    let {
      name,
      description,
      howItWorks,
      howItWorksSteps,
      features,
      applications,
      generalSpecifications,
      equipmentType,
      filters,
      isFeatured,
      isActive,
    } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid category id.",
      });
    }

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found.",
      });
    }

    if (equipmentType) {
      const equipmentExists = await EquipmentType.findById(equipmentType);
      if (!equipmentExists) {
        return res.status(404).json({
          success: false,
          message: "Equipment Type not found.",
        });
      }
      category.equipmentType = equipmentType;
    }

    if (name && name.trim()) {
      const slug = slugify(name, {
        lower: true,
        strict: true,
        trim: true,
      });

      const duplicateCategory = await Category.findOne({
        _id: { $ne: id },
        slug,
      });

      if (duplicateCategory) {
        return res.status(409).json({
          success: false,
          message: "Category with the same name already exists.",
        });
      }

      category.name = name.trim();
      category.slug = slug;
    }

    if (typeof description !== "undefined") {
      category.description = description;
    }

    if (typeof howItWorks !== "undefined") {
      category.howItWorks = howItWorks;
    }

    if (typeof howItWorksSteps !== "undefined") {
      category.howItWorksSteps = formatSteps(howItWorksSteps);
    }

    if (typeof features !== "undefined") {
      if (typeof features === "string") {
        try {
          features = JSON.parse(features);
        } catch (e) {
          features = features.split("\n").map((f) => f.trim()).filter(Boolean);
        }
      }
      category.features = Array.isArray(features)
        ? features.filter((f) => f && String(f).trim().length > 0)
        : [];
    }

    if (typeof applications !== "undefined") {
      if (typeof applications === "string") {
        try {
          applications = JSON.parse(applications);
        } catch (e) {
          applications = applications.split("\n").map((a) => a.trim()).filter(Boolean);
        }
      }
      category.applications = Array.isArray(applications)
        ? applications.filter((a) => a && String(a).trim().length > 0)
        : [];
    }

    if (typeof generalSpecifications !== "undefined") {
      let cleanGeneralSpecs = [];
      if (typeof generalSpecifications === "string") {
        try {
          generalSpecifications = JSON.parse(generalSpecifications);
        } catch (e) {
          cleanGeneralSpecs = [];
        }
      }
      if (Array.isArray(generalSpecifications)) {
        cleanGeneralSpecs = generalSpecifications
          .filter((s) => s && (s.key?.trim() || s.value?.trim()))
          .map((s) => ({
            key: s.key ? String(s.key).trim() : "",
            value: s.value ? String(s.value).trim() : "",
          }));
      } else if (generalSpecifications && typeof generalSpecifications === "object") {
        cleanGeneralSpecs = Object.entries(generalSpecifications).map(([k, v]) => ({
          key: String(k).trim(),
          value: String(v).trim(),
        }));
      }
      category.generalSpecifications = cleanGeneralSpecs;
    }

    if (filters) {
      category.filters = filters.map((f) => ({
        name: f.name ? f.name.trim() : "",
        key:
          f.key ||
          slugify(f.name || "", { lower: true, replacement: "_" }),
        values: Array.isArray(f.values)
          ? f.values
          : typeof f.values === "string"
          ? f.values
              .split(",")
              .map((v) => v.trim())
              .filter(Boolean)
          : [],
      }));
    }

    if (typeof isFeatured !== "undefined") {
      category.isFeatured = isFeatured === true || isFeatured === "true";
    }

    if (typeof isActive !== "undefined") {
      category.isActive = isActive === true || isActive === "true";
    }

    await category.save();

    const updatedCategory = await Category.findById(category._id).populate(
      "equipmentType",
      "name slug"
    );

    return res.status(200).json({
      success: true,
      message: "Category updated successfully! 🎉",
      data: updatedCategory,
    });
  } catch (error) {
    console.error("Update Category Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error.",
      error: error.message,
    });
  }
};

/**
 * @desc    Toggle Category Status (Active/Inactive)
 * @route   PATCH /api/v1/admin/categories/:id/toggle
 * @access  Admin
 */
export const toggleCategoryStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found.",
      });
    }

    category.isActive = !category.isActive;
    await category.save();

    return res.status(200).json({
      success: true,
      message: `Category ${
        category.isActive ? "activated" : "deactivated"
      } successfully.`,
      data: category,
    });
  } catch (error) {
    console.error("Toggle Category Status Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error.",
      error: error.message,
    });
  }
};

/**
 * @desc    Toggle Category Featured Status
 * @route   PATCH /api/v1/admin/categories/:id/toggle-featured
 * @access  Admin
 */
export const toggleCategoryFeatured = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findById(id).populate(
      "equipmentType",
      "name slug"
    );
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found.",
      });
    }

    category.isFeatured = !category.isFeatured;
    await category.save();

    return res.status(200).json({
      success: true,
      message: `Category ${
        category.isFeatured ? "marked as featured" : "removed from featured"
      } successfully.`,
      data: category,
    });
  } catch (error) {
    console.error("Toggle Category Featured Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error.",
      error: error.message,
    });
  }
};

/**
 * @desc    Delete Category
 * @route   DELETE /api/v1/admin/categories/:id
 * @access  Admin
 */
export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found.",
      });
    }

    await Category.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Category deleted successfully.",
    });
  } catch (error) {
    console.error("Delete Category Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error.",
    });
  }
};