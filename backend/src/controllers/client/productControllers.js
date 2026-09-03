import Product from "../../models/product.js";
import Category from "../../models/category.js";
import EquipmentType from "../../models/equipmentType.js";

/**
 * Standard Client Category Population Config with nested EquipmentType
 */
const categoryPopulateConfig = {
  path: "category",
  select: "name slug description howItWorks howItWorksSteps features applications generalSpecifications filters equipmentType",
  populate: {
    path: "equipmentType",
    select: "name slug",
  },
};

/**
 * Helper: Fallback to Category description, features, applications, and howItWorks if product's own are empty
 */
const resolveProductInheritance = (prodDoc) => {
  if (!prodDoc) return null;
  const prod = prodDoc.toObject ? prodDoc.toObject() : { ...prodDoc };

  // Convert ES6 Map -> Plain Object if needed
  if (prod.specifications instanceof Map) {
    prod.specifications = Object.fromEntries(prod.specifications);
  } else if (!prod.specifications || typeof prod.specifications !== "object") {
    prod.specifications = {};
  }

  // If product specifications are empty and category has general specifications, auto-inherit them
  if (Object.keys(prod.specifications).length === 0 && prod.category?.generalSpecifications?.length > 0) {
    const catSpecs = {};
    prod.category.generalSpecifications.forEach((s) => {
      if (s.key && s.value) catSpecs[s.key] = s.value;
    });
    prod.specifications = catSpecs;
  }

  if ((!prod.description || !prod.description.trim()) && prod.category?.description) {
    prod.description = prod.category.description;
  }

  if (
    (!prod.features || !Array.isArray(prod.features) || prod.features.length === 0) &&
    prod.category?.features?.length > 0
  ) {
    prod.features = prod.category.features;
  }

  if (
    (!prod.applications || !Array.isArray(prod.applications) || prod.applications.length === 0) &&
    prod.category?.applications?.length > 0
  ) {
    prod.applications = prod.category.applications;
  }

  // Ensure completeSetIncludes is an array
  if (!Array.isArray(prod.completeSetIncludes)) {
    prod.completeSetIncludes = [];
  }

  // Inherit category's "How It Works" working principle and process steps to the product
  if (prod.category?.howItWorks) {
    prod.howItWorks = prod.category.howItWorks;
  }
  if (prod.category?.howItWorksSteps && prod.category.howItWorksSteps.length > 0) {
    prod.howItWorksSteps = prod.category.howItWorksSteps;
  }

  if (prod.category?.equipmentType?.name) {
    prod.equipmentTypeName = prod.category.equipmentType.name;
    prod.equipmentTypeId = prod.category.equipmentType._id;
  }

  return prod;
};

/**
 * @desc    Get All Active Products (Client)
 * @route   GET /api/v1/client/products
 * @access  Public
 */
export const getProducts = async (req, res) => {
  try {
    const {
      search,
      category,
      equipmentType,
      featured,
      sort = "latest",
      page,
      limit,
    } = req.query;

    const filter = { isActive: true };

    // Search by product name
    if (search && search.trim()) {
      filter.name = { $regex: search.trim(), $options: "i" };
    }

    // Filter by Featured
    if (typeof featured !== "undefined" && featured !== "") {
      filter.isFeatured = featured === "true" || featured === true;
    }

    // Filter by Category (slug or ObjectId)
    if (category && category.trim()) {
      let catId = category;
      if (!category.match(/^[0-9a-fA-F]{24}$/)) {
        const cat = await Category.findOne({ slug: category });
        if (cat) {
          catId = cat._id;
        } else {
          return res.status(200).json({ success: true, count: 0, data: [] });
        }
      }
      filter.category = catId;
    }

    // Filter by Equipment Type (slug or ObjectId)
    if (equipmentType && equipmentType.trim()) {
      let eqId = equipmentType;
      if (!equipmentType.match(/^[0-9a-fA-F]{24}$/)) {
        const eq = await EquipmentType.findOne({ slug: equipmentType });
        if (eq) {
          eqId = eq._id;
        }
      }

      if (eqId) {
        const categoriesInType = await Category.find({
          equipmentType: eqId,
          isActive: true,
        }).select("_id");

        const catIds = categoriesInType.map((c) => c._id);

        if (filter.category) {
          // If both category and equipmentType are filtered, ensure category is in equipmentType
          if (!catIds.some((id) => id.toString() === filter.category.toString())) {
            return res.status(200).json({ success: true, count: 0, data: [] });
          }
        } else {
          filter.category = { $in: catIds };
        }
      }
    }

    // Sort mappings
    let sortOption = { createdAt: -1 };
    if (sort === "a-z" || sort === "name-asc") {
      sortOption = { name: 1 };
    } else if (sort === "z-a" || sort === "name-desc") {
      sortOption = { name: -1 };
    } else if (sort === "popular" || sort === "featured") {
      sortOption = { isFeatured: -1, createdAt: -1 };
    } else if (sort === "oldest") {
      sortOption = { createdAt: 1 };
    }

    if (page && limit) {
      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      const total = await Product.countDocuments(filter);
      const products = await Product.find(filter)
        .populate(categoryPopulateConfig)
        .sort(sortOption)
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum);

      const resolvedProducts = products.map(resolveProductInheritance);

      return res.status(200).json({
        success: true,
        total,
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        data: resolvedProducts,
      });
    }

    const products = await Product.find(filter)
      .populate(categoryPopulateConfig)
      .sort(sortOption);

    const resolvedProducts = products.map(resolveProductInheritance);

    return res.status(200).json({
      success: true,
      count: resolvedProducts.length,
      data: resolvedProducts,
    });
  } catch (error) {
    console.error("Client Get Products Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch products",
    });
  }
};

/**
 * @desc    Get Products By Category Slug (Client - for Category Product Listing Page with Dynamic Filters)
 * @route   GET /api/v1/client/products/category/:slug
 * @access  Public
 */
export const getProductsByCategory = async (req, res) => {
  try {
    const { slug } = req.params;
    if (!slug) {
      return res.status(200).json({
        success: true,
        category: null,
        products: [],
        count: 0,
      });
    }

    const cleanSlug = String(slug).trim();
    let category = null;

    if (cleanSlug.match(/^[0-9a-fA-F]{24}$/)) {
      category = await Category.findOne({
        _id: cleanSlug,
        isActive: true,
      }).populate("equipmentType", "name slug");
    }

    if (!category) {
      category = await Category.findOne({
        slug: { $regex: new RegExp(`^${cleanSlug.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") },
        isActive: true,
      }).populate("equipmentType", "name slug");
    }

    if (!category) {
      return res.status(200).json({
        success: true,
        category: null,
        products: [],
        count: 0,
        message: "Category not found",
      });
    }

    const products = await Product.find({
      category: category._id,
      isActive: true,
    })
      .populate(categoryPopulateConfig)
      .sort({ isFeatured: -1, createdAt: -1 });

    const resolvedProducts = products.map(resolveProductInheritance);

    return res.status(200).json({
      success: true,
      category,
      products: resolvedProducts,
      count: resolvedProducts.length,
    });
  } catch (error) {
    console.error("Get Products By Category Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch category products",
    });
  }
};

/**
 * @desc    Get Single Active Product by Slug (Client)
 * @route   GET /api/v1/client/products/:slug
 * @access  Public
 */
export const getProduct = async (req, res) => {
  try {
    const product = await Product.findOne({
      slug: req.params.slug,
      isActive: true,
    }).populate(categoryPopulateConfig);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: resolveProductInheritance(product),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch product",
    });
  }
};

/**
 * @desc    Get Related Products (Client)
 * @route   GET /api/v1/client/products/:id/related
 * @access  Public
 */
export const getRelatedProducts = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate("category");

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    let categoryIds = [product.category?._id || product.category];

    // Find all categories in the exact same EquipmentType group
    if (product.category?.equipmentType) {
      const sameEqCategories = await Category.find({
        equipmentType: product.category.equipmentType,
      }).select("_id");
      if (sameEqCategories.length > 0) {
        categoryIds = sameEqCategories.map((c) => c._id);
      }
    }

    // 1. Primary: Products in the same Equipment Type group
    let related = await Product.find({
      category: { $in: categoryIds },
      _id: { $ne: product._id },
      isActive: true,
    })
      .populate(categoryPopulateConfig)
      .limit(4);

    // 2. If this category has fewer than 3 items, backfill with complementary featured equipment
    if (related.length < 3) {
      const existingIds = [product._id, ...related.map((p) => p._id)];
      const additionalNeeded = 3 - related.length;

      const backfill = await Product.find({
        _id: { $nin: existingIds },
        isActive: true,
      })
        .populate(categoryPopulateConfig)
        .sort({ isFeatured: -1, createdAt: -1 })
        .limit(additionalNeeded);

      related = [...related, ...backfill];
    }

    const resolvedRelated = related.map(resolveProductInheritance);

    return res.status(200).json({
      success: true,
      data: resolvedRelated,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch related products",
    });
  }
};

/**
 * @desc    Get Featured Products (Client)
 * @route   GET /api/v1/client/products/featured
 * @access  Public
 */
export const getFeaturedProducts = async (req, res) => {
  try {
    const products = await Product.find({
      isFeatured: true,
      isActive: true,
    })
      .populate(categoryPopulateConfig)
      .limit(8);

    const resolvedProducts = products.map(resolveProductInheritance);

    return res.status(200).json({
      success: true,
      data: resolvedProducts,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch featured products",
    });
  }
};

// In-memory cache for ultra-fast Home Page rendering (60s TTL)
let homeShowcaseCache = null;
let homeShowcaseCacheTime = 0;
const CACHE_TTL_MS = 60 * 1000;

/**
 * @desc    Get Ultra-Fast Structured Home Showcase (Client)
 * @route   GET /api/v1/client/products/home-showcase
 * @access  Public
 */
export const clearHomeShowcaseCache = () => {
  homeShowcaseCache = null;
  homeShowcaseCacheTime = 0;
};

export const getHomeShowcase = async (req, res) => {
  try {
    const now = Date.now();
    if (homeShowcaseCache && now - homeShowcaseCacheTime < CACHE_TTL_MS) {
      return res.status(200).json({
        success: true,
        cached: true,
        data: homeShowcaseCache,
      });
    }

    // 1. Fetch active equipment types sorted by custom displayOrder
    const equipmentTypes = await EquipmentType.find({ isActive: true })
      .sort({ displayOrder: 1, isFeatured: -1, createdAt: 1 })
      .lean();

    if (!equipmentTypes || equipmentTypes.length === 0) {
      return res.status(200).json({ success: true, data: [] });
    }

    let targetTypes = equipmentTypes.filter((eq) => eq.isFeatured);
    if (targetTypes.length === 0) {
      targetTypes = equipmentTypes.slice(0, 3);
    }

    const eqIds = targetTypes.map((t) => t._id);

    // 2. Fetch categories for target equipment types
    const categories = await Category.find({
      equipmentType: { $in: eqIds },
      isActive: true,
    })
      .select("name slug description equipmentType")
      .lean();

    const catIds = categories.map((c) => c._id);

    // 3. Fetch products with projection only
    const products = await Product.find({
      category: { $in: catIds },
      isActive: true,
    })
      .select("name slug productCode hsnCode images isFeatured specifications completeSetIncludes category createdAt")
      .sort({ isFeatured: -1, createdAt: -1 })
      .lean();

    // 4. Map and group structure
    const sections = targetTypes
      .map((eqType) => {
        const eqCategories = categories.filter(
          (cat) => String(cat.equipmentType) === String(eqType._id)
        );

        const representativeProducts = [];

        eqCategories.forEach((cat) => {
          const catProducts = products.filter(
            (p) => String(p.category) === String(cat._id)
          );

          if (catProducts.length > 0) {
            const repProduct =
              catProducts.find((p) => p.isFeatured) || catProducts[0];
            representativeProducts.push({
              ...repProduct,
              category: cat,
              equipmentTypeName: eqType.name,
            });
          }
        });

        return {
          equipmentType: eqType,
          categoriesCount: eqCategories.length,
          products: representativeProducts,
        };
      })
      .filter((sec) => sec.products.length > 0);

    homeShowcaseCache = sections;
    homeShowcaseCacheTime = now;

    return res.status(200).json({
      success: true,
      data: sections,
    });
  } catch (error) {
    console.error("Home Showcase Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to load home showcase",
    });
  }
};

