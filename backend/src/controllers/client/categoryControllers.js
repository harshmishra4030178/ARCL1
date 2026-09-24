import Category from "../../models/category.js";
import EquipmentType from "../../models/equipmentType.js";
import Product from "../../models/product.js";

/**
 * @desc    Get All Categories (Client - only active)
 * @route   GET /api/v1/client/categories
 * @access  Public
 */
export const getCategories = async (req, res) => {
  try {
    const { equipmentType, featured } = req.query;
    const filter = { isActive: true };

    if (equipmentType) {
      filter.equipmentType = equipmentType;
    }

    if (typeof featured !== "undefined") {
      filter.isFeatured = featured === "true" || featured === true;
    }

    const categories = await Category.find(filter)
      .populate("equipmentType", "name slug")
      .sort({ name: 1 });

    return res.status(200).json({
      success: true,
      count: categories.length,
      data: categories,
    });
  } catch (error) {
    console.error("Client Get Categories Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch categories",
    });
  }
};

/**
 * @desc    Get Single Category or EquipmentType By Slug (Client)
 * @route   GET /api/v1/client/categories/:slug
 * @access  Public
 */
export const getCategory = async (req, res) => {
  try {
    const rawSlug = req.params.slug ? String(req.params.slug).trim().toLowerCase() : "";
    let category = await Category.findOne({
      slug: rawSlug,
      isActive: true,
    }).populate("equipmentType", "name slug");

    if (!category) {
      const eqSlugVariants = [
        rawSlug,
        rawSlug.replace(/-equipment$/, "-equipments"),
        rawSlug.replace(/-equipments$/, "-equipment"),
        rawSlug.replace(/^bitumen-testing-equipment$/, "bitumen-and-asphalt-testing-equipments"),
        rawSlug.replace(/^bitumen-testing-equipments$/, "bitumen-and-asphalt-testing-equipments"),
        rawSlug.replace(/^non-destructive-testing-ndt-equipment$/, "ndt-equipments"),
        rawSlug.replace(/^surveying-instruments$/, "surveying-equipments"),
      ];

      const eqType = await EquipmentType.findOne({
        $or: [
          { slug: { $in: eqSlugVariants } },
          { name: { $regex: new RegExp(`^${rawSlug.replace(/[-_]+/g, "[ -]")}`, "i") } }
        ],
        isActive: true,
      });

      if (eqType) {
        return res.status(200).json({
          success: true,
          data: {
            _id: eqType._id,
            name: eqType.name,
            slug: req.params.slug,
            description: `Precision ${eqType.name} designed to comply with national and international quality testing standards.`,
            equipmentType: eqType,
          },
        });
      }

      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: category,
    });
  } catch (error) {
    console.error("Client Get Category Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch category",
    });
  }
};

/**
 * @desc    Get Categories By Equipment Type Slug (Client)
 * @route   GET /api/v1/client/categories/equipment/:slug
 * @access  Public
 */
export const getCategoriesByEquipmentType = async (req, res) => {
  try {
    const cleanSlug = String(req.params.slug).trim().toLowerCase();
    const eqSlugVariants = [
      cleanSlug,
      cleanSlug.replace(/-equipment$/, "-equipments"),
      cleanSlug.replace(/-equipments$/, "-equipment"),
      cleanSlug.replace(/^bitumen-testing-equipment$/, "bitumen-and-asphalt-testing-equipments"),
      cleanSlug.replace(/^bitumen-testing-equipments$/, "bitumen-and-asphalt-testing-equipments"),
      cleanSlug.replace(/^non-destructive-testing-ndt-equipment$/, "ndt-equipments"),
      cleanSlug.replace(/^surveying-instruments$/, "surveying-equipments"),
    ];

    const equipmentType = await EquipmentType.findOne({
      $or: [
        { slug: { $in: eqSlugVariants } },
        { name: { $regex: new RegExp(`^${cleanSlug.replace(/[-_]+/g, "[ -]")}`, "i") } }
      ],
      isActive: true,
    });

    if (!equipmentType) {
      return res.status(404).json({
        success: false,
        message: "Equipment type not found",
      });
    }

    const categories = await Category.find({
      equipmentType: equipmentType._id,
      isActive: true,
    })
      .populate("equipmentType", "name slug")
      .sort({ name: 1 });

    return res.status(200).json({
      success: true,
      equipmentType,
      data: categories,
    });
  } catch (error) {
    console.error("Client Get Categories By Equipment Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch categories",
    });
  }
};

/**
 * @desc    Get Featured Categories With Their Related Products (for Home Page)
 * @route   GET /api/v1/client/categories/featured-showcase
 * @access  Public
 */
export const getFeaturedCategoriesWithProducts = async (req, res) => {
  try {
    const featuredCategories = await Category.find({
      isFeatured: true,
      isActive: true,
    })
      .populate("equipmentType", "name slug")
      .sort({ createdAt: -1 });

    const showcase = await Promise.all(
      featuredCategories.map(async (cat) => {
        const products = await Product.find({
          category: cat._id,
          isActive: true,
        })
          .populate("category", "name slug")
          .limit(8)
          .sort({ isFeatured: -1, createdAt: -1 });

        return {
          _id: cat._id,
          name: cat.name,
          slug: cat.slug,
          description: cat.description,
          equipmentType: cat.equipmentType,
          products,
        };
      })
    );

    return res.status(200).json({
      success: true,
      data: showcase,
    });
  } catch (error) {
    console.error("Featured Showcase Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch featured showcase",
    });
  }
};
