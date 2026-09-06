import Product from "../../models/product.js";
import Category from "../../models/category.js";
import slugify from "slugify";
import cloudinary from "../../config/cloudinary.js";
import { notifySubscribersNewProduct } from "../../utils/emailService.js";
import { generateProductQrCode } from "../../utils/qrCodeGenerator.js";

/**
 * Standard Category Population Config including nested EquipmentType
 */
const categoryPopulateConfig = {
  path: "category",
  select: "name slug description howItWorks howItWorksSteps features applications filters equipmentType",
  populate: {
    path: "equipmentType",
    select: "name slug",
  },
};

/**
 * Helper: Upload buffer to Cloudinary with safe Data URI fallback
 */
const uploadBufferToCloudinary = async (fileBuffer, mimetype) => {
  try {
    const secureUrl = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: "products" },
        (error, result) => {
          if (error) return reject(error);
          resolve(result.secure_url);
        }
      );
      stream.end(fileBuffer);
    });

    return secureUrl;
  } catch (cloudErr) {
    console.warn(
      "Cloudinary upload failed/credentials issue, using Data URI fallback:",
      cloudErr.message
    );
    const base64 = fileBuffer.toString("base64");
    return `data:${mimetype || "image/jpeg"};base64,${base64}`;
  }
};

/**
 * Helper: Fallback to Category description, features, applications if product's own are empty
 * and ensure specifications is a clean plain JavaScript Object.
 */
const resolveProductInheritance = (prodDoc) => {
  if (!prodDoc) return null;
  const prod = prodDoc.toObject ? prodDoc.toObject({ flattenMaps: true }) : { ...prodDoc };

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

  // Ensure equipmentTypeName is attached directly
  if (prod.category?.equipmentType?.name) {
    prod.equipmentTypeName = prod.category.equipmentType.name;
    prod.equipmentTypeId = prod.category.equipmentType._id;
  }

  return prod;
};

/**
 * @desc    Create Product (Admin)
 * @route   POST /api/v1/admin/products
 * @access  Admin
 */
export const createProduct = async (req, res) => {
  try {
    let {
      name,
      productCode,
      hsnCode,
      description,
      specifications,
      applications,
      features,
      completeSetIncludes,
      category,
      isFeatured,
      isActive,
    } = req.body;

    // Field Validations
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Product name is required.",
      });
    }

    if (!category || !category.trim()) {
      return res.status(400).json({
        success: false,
        message: "Product category is required.",
      });
    }

    // Ensure category exists
    const categoryDoc = await Category.findById(category);
    if (!categoryDoc) {
      return res.status(404).json({
        success: false,
        message: "Selected category not found in database.",
      });
    }

    // Convert JSON strings → actual objects/arrays if stringified
    if (typeof specifications === "string" && specifications.trim()) {
      try {
        specifications = JSON.parse(specifications);
      } catch (e) {
        specifications = {};
      }
    }

    if (typeof applications === "string" && applications.trim()) {
      try {
        applications = JSON.parse(applications);
      } catch (e) {
        applications = [];
      }
    }

    if (typeof features === "string" && features.trim()) {
      try {
        features = JSON.parse(features);
      } catch (e) {
        features = [];
      }
    }

    if (typeof completeSetIncludes === "string" && completeSetIncludes.trim()) {
      try {
        completeSetIncludes = JSON.parse(completeSetIncludes);
      } catch (e) {
        completeSetIncludes = completeSetIncludes.split("\n").map((s) => s.trim()).filter(Boolean);
      }
    }

    let cleanFeatures = Array.isArray(features)
      ? features.filter((f) => f && String(f).trim().length > 0)
      : [];

    let cleanApplications = Array.isArray(applications)
      ? applications.filter((a) => a && String(a).trim().length > 0)
      : [];

    let cleanCompleteSetIncludes = Array.isArray(completeSetIncludes)
      ? completeSetIncludes.filter((item) => item && String(item).trim().length > 0)
      : [];

    // AUTO-INHERIT from Category if not provided for this specific product
    if (cleanFeatures.length === 0 && categoryDoc.features?.length > 0) {
      cleanFeatures = categoryDoc.features;
    }

    if (cleanApplications.length === 0 && categoryDoc.applications?.length > 0) {
      cleanApplications = categoryDoc.applications;
    }

    let finalDescription = description && description.trim()
      ? description.trim()
      : categoryDoc.description || "";

    // Convert strings → boolean
    isFeatured = isFeatured === true || isFeatured === "true";
    isActive =
      typeof isActive !== "undefined"
        ? isActive === true || isActive === "true"
        : true;

    // Slug generation
    let baseSlug =
      slugify(name, { lower: true, strict: true }) || `product-${Date.now()}`;
    let slug = baseSlug;

    // Auto-resolve unique slug
    const exists = await Product.findOne({ slug });
    if (exists) {
      slug = `${baseSlug}-${Date.now().toString().slice(-4)}`;
    }

    let imageUrl = "";

    // Upload image from memory buffer
    if (req.file && req.file.buffer) {
      imageUrl = await uploadBufferToCloudinary(
        req.file.buffer,
        req.file.mimetype
      );
    } else {
      imageUrl =
        "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&q=80&w=600";
    }

    // Auto-generate unique QR code for the product URL
    let qrCode = "";
    try {
      const qrData = await generateProductQrCode(slug);
      qrCode = qrData.qrCode;
    } catch (qrErr) {
      console.warn("QR code generation warning on create:", qrErr.message);
    }

    const product = await Product.create({
      name: name.trim(),
      slug,
      productCode: productCode ? String(productCode).trim().toUpperCase() : "",
      hsnCode: hsnCode ? String(hsnCode).trim().toUpperCase() : "",
      description: finalDescription,
      specifications: specifications || {},
      applications: cleanApplications,
      features: cleanFeatures,
      completeSetIncludes: cleanCompleteSetIncludes,
      category,
      images: imageUrl ? [imageUrl] : [],
      qrCode: qrCode || "",
      isFeatured,
      isActive,
    });

    await product.populate(categoryPopulateConfig);

    // Asynchronously broadcast email to all subscribers without blocking the HTTP response
    notifySubscribersNewProduct(product, categoryDoc?.name || "").catch((err) => {
      console.error("Async subscriber notification error:", err);
    });

    return res.status(201).json({
      success: true,
      message: "Product created successfully! 🎉",
      data: resolveProductInheritance(product),
    });
  } catch (error) {
    console.error("Create Product Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

/**
 * @desc    Get All Products (Admin - ALL active & inactive)
 * @route   GET /api/v1/admin/products
 * @access  Admin
 */
export const getProducts = async (req, res) => {
  try {
    const {
      category,
      search,
      isFeatured,
      isActive,
      sort = "createdAt",
      order = "desc",
    } = req.query;

    const filter = {};

    if (category) {
      filter.category = category;
    }

    if (typeof isActive !== "undefined" && isActive !== "") {
      filter.isActive = isActive === "true" || isActive === true;
    }

    if (typeof isFeatured !== "undefined" && isFeatured !== "") {
      filter.isFeatured = isFeatured === "true" || isFeatured === true;
    }

    if (search && search.trim()) {
      filter.$or = [
        { name: { $regex: search.trim(), $options: "i" } },
        { slug: { $regex: search.trim(), $options: "i" } },
        { productCode: { $regex: search.trim(), $options: "i" } },
        { hsnCode: { $regex: search.trim(), $options: "i" } },
        { description: { $regex: search.trim(), $options: "i" } },
      ];
    }

    const sortOptions = {};
    sortOptions[sort] = order === "asc" ? 1 : -1;

    const products = await Product.find(filter)
      .populate(categoryPopulateConfig)
      .sort(sortOptions);

    const resolvedProducts = products.map(resolveProductInheritance);

    return res.status(200).json({
      success: true,
      count: resolvedProducts.length,
      data: resolvedProducts,
    });
  } catch (error) {
    console.error("Get Admin Products Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch products",
    });
  }
};

/**
 * @desc    Get Single Product By ID (Admin)
 * @route   GET /api/v1/admin/products/id/:id
 * @access  Admin
 */
export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate(categoryPopulateConfig);

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
    console.error("Get Product By ID Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch product",
    });
  }
};

/**
 * @desc    Get Single Product By Slug (Admin/Public)
 * @route   GET /api/v1/admin/products/:slug
 * @access  Admin
 */
export const getProduct = async (req, res) => {
  try {
    const product = await Product.findOne({
      slug: req.params.slug,
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
 * @desc    Update Product (Admin)
 * @route   PUT /api/v1/admin/products/:id
 * @access  Admin
 */
export const updateProduct = async (req, res) => {
  try {
    let {
      name,
      productCode,
      hsnCode,
      description,
      specifications,
      applications,
      features,
      completeSetIncludes,
      category,
      images,
      isFeatured,
      isActive,
    } = req.body;

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Convert JSON strings → actual objects
    if (typeof specifications === "string" && specifications.trim()) {
      try {
        specifications = JSON.parse(specifications);
      } catch (e) {}
    }
    if (typeof applications === "string" && applications.trim()) {
      try {
        applications = JSON.parse(applications);
      } catch (e) {}
    }
    if (typeof features === "string" && features.trim()) {
      try {
        features = JSON.parse(features);
      } catch (e) {}
    }
    if (typeof completeSetIncludes === "string" && completeSetIncludes.trim()) {
      try {
        completeSetIncludes = JSON.parse(completeSetIncludes);
      } catch (e) {
        completeSetIncludes = completeSetIncludes.split("\n").map((s) => s.trim()).filter(Boolean);
      }
    }
    if (typeof images === "string" && images.trim()) {
      try {
        images = JSON.parse(images);
      } catch (e) {}
    }

    if (typeof isFeatured !== "undefined") {
      isFeatured = isFeatured === true || isFeatured === "true";
    }
    if (typeof isActive !== "undefined") {
      isActive = isActive === true || isActive === "true";
    }

    // New Image uploaded via memory buffer
    if (req.file && req.file.buffer) {
      const uploadedUrl = await uploadBufferToCloudinary(
        req.file.buffer,
        req.file.mimetype
      );
      images = [uploadedUrl];
    }

    if (name && name.trim() && name !== product.name) {
      product.name = name.trim();
      const baseSlug = slugify(name, { lower: true, strict: true });
      const slugExists = await Product.findOne({
        slug: baseSlug,
        _id: { $ne: product._id },
      });
      product.slug = slugExists
        ? `${baseSlug}-${Date.now().toString().slice(-4)}`
        : baseSlug;
    }

    if (typeof productCode !== "undefined")
      product.productCode = productCode ? String(productCode).trim().toUpperCase() : "";
    if (typeof hsnCode !== "undefined")
      product.hsnCode = hsnCode ? String(hsnCode).trim().toUpperCase() : "";

    if (typeof description !== "undefined") product.description = description;
    if (typeof specifications !== "undefined")
      product.specifications = specifications;
    if (Array.isArray(applications))
      product.applications = applications.filter(Boolean);
    if (Array.isArray(features)) product.features = features.filter(Boolean);
    if (typeof completeSetIncludes !== "undefined") {
      product.completeSetIncludes = Array.isArray(completeSetIncludes)
        ? completeSetIncludes.filter((item) => item && String(item).trim().length > 0)
        : [];
    }
    if (category) product.category = category;
    if (images && images.length > 0) product.images = images;
    if (typeof isFeatured !== "undefined") product.isFeatured = isFeatured;
    if (typeof isActive !== "undefined") product.isActive = isActive;

    // Ensure product has a valid QR code (generates if missing or if slug changed)
    if (!product.qrCode || (name && name.trim() && name !== product.name)) {
      try {
        const qrData = await generateProductQrCode(product.slug);
        product.qrCode = qrData.qrCode;
      } catch (qrErr) {
        console.warn("QR code update warning:", qrErr.message);
      }
    }

    await product.save();
    await product.populate(categoryPopulateConfig);

    return res.status(200).json({
      success: true,
      message: "Product updated successfully! 🎉",
      data: resolveProductInheritance(product),
    });
  } catch (error) {
    console.error("Update Product Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update product",
    });
  }
};

/**
 * @desc    Toggle Product Active Status
 * @route   PATCH /api/v1/admin/products/:id/toggle-active
 * @access  Admin
 */
export const toggleProductActive = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    product.isActive = !product.isActive;
    await product.save();

    return res.status(200).json({
      success: true,
      message: `Product ${
        product.isActive ? "activated" : "deactivated"
      } successfully`,
      data: product,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to toggle status",
    });
  }
};

/**
 * @desc    Toggle Product Featured Status
 * @route   PATCH /api/v1/admin/products/:id/toggle-featured
 * @access  Admin
 */
export const toggleProductFeatured = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    product.isFeatured = !product.isFeatured;
    await product.save();

    return res.status(200).json({
      success: true,
      message: `Product ${
        product.isFeatured ? "featured" : "unfeatured"
      } successfully`,
      data: product,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to toggle featured",
    });
  }
};

/**
 * @desc    Delete Product
 * @route   DELETE /api/v1/admin/products/:id
 * @access  Admin
 */
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    await Product.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Product deleted successfully! 🗑️",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to delete product",
    });
  }
};

/**
 * @desc    Get Products by Category ID
 * @route   GET /api/v1/admin/products/category/:categoryId
 * @access  Admin
 */
export const getProductsByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;

    const products = await Product.find({
      category: categoryId,
    }).populate(categoryPopulateConfig);

    const resolvedProducts = products.map(resolveProductInheritance);

    return res.status(200).json({
      success: true,
      count: resolvedProducts.length,
      data: resolvedProducts,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch products",
    });
  }
};

/**
 * @desc    Generate / Regenerate QR Code for a Specific Product (Admin)
 * @route   POST /api/v1/admin/products/:id/generate-qr
 * @access  Admin
 */
export const generateSingleProductQrCode = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const qrData = await generateProductQrCode(product.slug);
    product.qrCode = qrData.qrCode;
    await product.save();
    await product.populate(categoryPopulateConfig);

    return res.status(200).json({
      success: true,
      message: "QR Code generated successfully! 📱",
      data: resolveProductInheritance(product),
      qrCode: qrData.qrCode,
      productUrl: qrData.productUrl,
    });
  } catch (error) {
    console.error("Generate Product QR Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to generate QR Code",
    });
  }
};

/**
 * @desc    Generate QR Codes for All Existing Products (Admin Bulk Backfill)
 * @route   POST /api/v1/admin/products/generate-all-qr
 * @access  Admin
 */
export const generateAllMissingQrCodes = async (req, res) => {
  try {
    const { force = false } = req.body;
    const query = force
      ? {}
      : {
          $or: [
            { qrCode: { $exists: false } },
            { qrCode: "" },
            { qrCode: null },
          ],
        };

    const products = await Product.find(query);
    let updatedCount = 0;

    for (const prod of products) {
      try {
        const qrData = await generateProductQrCode(prod.slug);
        prod.qrCode = qrData.qrCode;
        await prod.save();
        updatedCount++;
      } catch (err) {
        console.error(`Failed to generate QR code for ${prod.name}:`, err.message);
      }
    }

    return res.status(200).json({
      success: true,
      message: `QR codes generated successfully for ${updatedCount} products! 🎉`,
      updatedCount,
      totalExamined: products.length,
    });
  } catch (error) {
    console.error("Bulk QR Code Generation Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to bulk generate QR codes",
    });
  }
};

