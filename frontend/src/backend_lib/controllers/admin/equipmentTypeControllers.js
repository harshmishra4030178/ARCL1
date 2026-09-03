import slugify from "slugify";
import EquipmentType from "../../models/equipmentType.js";
import Category from "../../models/category.js";
import Product from "../../models/product.js";
import mongoose from "mongoose";
import { clearHomeShowcaseCache } from "../client/productControllers.js";

/**
 * @desc    Create Equipment Type
 * @route   POST /api/v1/admin/equipment-types
 * @access  Admin
 */
export const createEquipmentType = async (req, res) => {
  try {
    const { name, isFeatured } = req.body;

    // Validate input
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Equipment type name is required.",
      });
    }

    // Generate slug
    const slug = slugify(name, {
      lower: true,
      strict: true,
      trim: true,
    });

    // Check duplicate name
    const existingEquipment = await EquipmentType.findOne({
      $or: [
        { name: name.trim() },
        { slug }
      ],
    });

    if (existingEquipment) {
      return res.status(409).json({
        success: false,
        message: "Equipment type already exists.",
      });
    }

    // Determine default displayOrder (next in sequence)
    const count = await EquipmentType.countDocuments();

    // Create equipment type
    const equipmentType = await EquipmentType.create({
      name: name.trim(),
      slug,
      isActive: true,
      isFeatured: isFeatured === true || isFeatured === "true",
      displayOrder: count + 1,
    });

    clearHomeShowcaseCache();

    return res.status(201).json({
      success: true,
      message: "Equipment type created successfully.",
      data: equipmentType,
    });
  } catch (error) {
    console.error("Create Equipment Type Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error.",
    });
  }
};

/**
 * @desc    Get All Equipment Types (Admin)
 * @route   GET /api/v1/admin/equipment-types
 * @access  Admin
 */
export const getAllEquipmentTypes = async (req, res) => {
  try {
    const equipmentTypes = await EquipmentType.find().sort({
      displayOrder: 1,
      isFeatured: -1,
      createdAt: 1,
    });

    return res.status(200).json({
      success: true,
      count: equipmentTypes.length,
      data: equipmentTypes,
    });
  } catch (error) {
    console.error("Get Equipment Types Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error.",
    });
  }
};

/**
 * @desc    Get Single Equipment Type
 * @route   GET /api/v1/admin/equipment-types/:id
 * @access  Admin
 */
export const getSingleEquipmentType = async (req, res) => {
  try {
    const { id } = req.params;

    const equipmentType = await EquipmentType.findById(id);

    if (!equipmentType) {
      return res.status(404).json({
        success: false,
        message: "Equipment type not found."
      });
    }

    return res.status(200).json({
      success: true,
      data: equipmentType
    });
  } catch (error) {
    console.error("Get Equipment Type Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error."
    });
  }
};

/**
 * @desc    Update Equipment Type
 * @route   PUT /api/v1/admin/equipment-types/:id
 * @access  Admin
 */
export const updateEquipmentType = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, isFeatured } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Equipment type name is required."
      });
    }

    const equipmentType = await EquipmentType.findById(id);

    if (!equipmentType) {
      return res.status(404).json({
        success: false,
        message: "Equipment type not found."
      });
    }

    const slug = slugify(name, {
      lower: true,
      strict: true,
      trim: true
    });

    const duplicateEquipment = await EquipmentType.findOne({
      slug,
      _id: { $ne: id }
    });

    if (duplicateEquipment) {
      return res.status(409).json({
        success: false,
        message: "Equipment type already exists."
      });
    }

    equipmentType.name = name.trim();
    equipmentType.slug = slug;
    if (typeof isFeatured !== "undefined") {
      equipmentType.isFeatured = isFeatured === true || isFeatured === "true";
    }

    await equipmentType.save();

    return res.status(200).json({
      success: true,
      message: "Equipment type updated successfully.",
      data: equipmentType
    });
  } catch (error) {
    console.error("Update Equipment Type Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error."
    });
  }
};

/**
 * @desc    Toggle Equipment Type Status
 * @route   PATCH /api/v1/admin/equipment-types/:id/toggle
 * @access  Admin
 */
export const toggleEquipmentTypeStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const equipmentType = await EquipmentType.findById(id);

    if (!equipmentType) {
      return res.status(404).json({
        success: false,
        message: "Equipment type not found.",
      });
    }

    equipmentType.isActive = !equipmentType.isActive;
    await equipmentType.save();

    return res.status(200).json({
      success: true,
      message: `Equipment type ${equipmentType.isActive ? "activated" : "deactivated"} successfully.`,
      data: equipmentType,
    });
  } catch (error) {
    console.error("Toggle Equipment Type Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
      error: error.message,
    });
  }
};

/**
 * @desc    Toggle Equipment Type Featured Status
 * @route   PATCH /api/v1/admin/equipment-types/:id/toggle-featured
 * @access  Admin
 */
export const toggleEquipmentTypeFeatured = async (req, res) => {
  try {
    const { id } = req.params;

    const equipmentType = await EquipmentType.findById(id);

    if (!equipmentType) {
      return res.status(404).json({
        success: false,
        message: "Equipment type not found.",
      });
    }

    equipmentType.isFeatured = !equipmentType.isFeatured;
    await equipmentType.save();

    clearHomeShowcaseCache();

    return res.status(200).json({
      success: true,
      message: `Equipment type ${equipmentType.isFeatured ? "marked as featured" : "removed from featured"} successfully! ⭐`,
      data: equipmentType,
    });
  } catch (error) {
    console.error("Toggle Featured Equipment Type Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
      error: error.message,
    });
  }
};

/**
 * @desc    Reorder Equipment Types (Drag and Drop / Ordering)
 * @route   PUT /api/v1/admin/equipment-types/reorder
 * @access  Admin
 */
export const reorderEquipmentTypes = async (req, res) => {
  try {
    const { items, orderedIds } = req.body;

    if (Array.isArray(orderedIds) && orderedIds.length > 0) {
      // Bulk update based on ordered array of IDs
      const bulkOps = orderedIds.map((id, index) => ({
        updateOne: {
          filter: { _id: id },
          update: { $set: { displayOrder: index + 1 } },
        },
      }));

      if (bulkOps.length > 0) {
        await EquipmentType.bulkWrite(bulkOps);
      }
    } else if (Array.isArray(items) && items.length > 0) {
      // Bulk update based on array of { id, displayOrder }
      const bulkOps = items.map((item, index) => ({
        updateOne: {
          filter: { _id: item.id || item._id },
          update: { $set: { displayOrder: typeof item.displayOrder === "number" ? item.displayOrder : index + 1 } },
        },
      }));

      if (bulkOps.length > 0) {
        await EquipmentType.bulkWrite(bulkOps);
      }
    } else {
      return res.status(400).json({
        success: false,
        message: "Array of ordered IDs or items is required for reordering.",
      });
    }

    clearHomeShowcaseCache();

    const updatedTypes = await EquipmentType.find().sort({
      displayOrder: 1,
      isFeatured: -1,
      createdAt: 1,
    });

    return res.status(200).json({
      success: true,
      message: "Equipment types reordered successfully.",
      data: updatedTypes,
    });
  } catch (error) {
    console.error("Reorder Equipment Types Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to reorder equipment types.",
    });
  }
};

/**
 * @desc    Delete Equipment Type
 * @route   DELETE /api/v1/admin/equipment-types/:id
 * @access  Admin
 */
export const deleteEquipmentType = async (req, res) => {
  try {
    const { id } = req.params;

    const equipmentType = await EquipmentType.findById(id);

    if (!equipmentType) {
      return res.status(404).json({
        success: false,
        message: "Equipment Type not found.",
      });
    }

    // Check if any categories are associated with this Equipment Type
    const categoryCount = await Category.countDocuments({
      equipmentType: id,
    });

    if (categoryCount > 0) {
      return res.status(400).json({
        success: false,
        message:
          "Cannot delete Equipment Type because it contains categories. Please delete the associated categories first.",
      });
    }

    await EquipmentType.findByIdAndDelete(id);

    clearHomeShowcaseCache();

    return res.status(200).json({
      success: true,
      message: "Equipment Type deleted successfully.",
    });
  } catch (error) {
    console.error("Delete Equipment Type Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error.",
      error: error.message,
    });
  }
};