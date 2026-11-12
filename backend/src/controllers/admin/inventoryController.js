import mongoose from "mongoose";
import slugify from "slugify";
import Inventory from "../../models/Inventory.js";
import StockMovement from "../../models/StockMovement.js";
import Warehouse from "../../models/Warehouse.js";
import WarehouseTransfer from "../../models/WarehouseTransfer.js";
import Supplier from "../../models/Supplier.js";
import PurchaseOrder from "../../models/PurchaseOrder.js";
import InventoryAlert from "../../models/InventoryAlert.js";
import SalesOrder from "../../models/SalesOrder.js";
import Product from "../../models/product.js";
import Category from "../../models/category.js";
import asyncHandler from "../../utils/asyncHandler.js";
import ApiError from "../../utils/ApiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import { syncAllExistingRecords } from "../../services/inventorySyncService.js";

// ==========================================
// 1. WAREHOUSE CONTROLLERS
// ==========================================

// Seed default warehouses if none exist
export const ensureDefaultWarehouses = async () => {
  try {
    const count = await Warehouse.countDocuments();
    if (count === 0) {
      await Warehouse.create([
        {
          code: "WH-MUM-01",
          name: "ARCL Central Works & Testing Depot",
          address: "Plot No. R-852, TTC Industrial Area, MIDC Rabale",
          city: "Navi Mumbai",
          state: "Maharashtra",
          pincode: "400701",
          manager: "Abhinav Tripathi / Plant Head",
          contactPhone: "+91-8572995533",
          contactEmail: "inventory@arclinstruments.com",
          isDefault: true,
          isActive: true,
          notes: "Main manufacturing, precision assembly & calibration dispatch facility.",
        },
        {
          code: "WH-DEL-02",
          name: "ARCL North Regional Distribution Hub",
          address: "Okhla Industrial Area Phase-II",
          city: "New Delhi",
          state: "Delhi",
          pincode: "110020",
          manager: "Regional Warehouse Lead",
          contactPhone: "+91-9820000000",
          contactEmail: "delhi.hub@arclinstruments.com",
          isDefault: false,
          isActive: true,
          notes: "Northern India fast-dispatch and transit warehouse.",
        },
      ]);
    }
  } catch (err) {
    console.warn("ensureDefaultWarehouses check:", err.message);
  }
};

export const getWarehouses = asyncHandler(async (req, res) => {
  await ensureDefaultWarehouses();
  const { search, isActive } = req.query;
  const filter = {};
  if (isActive !== undefined && isActive !== "") {
    filter.isActive = isActive === "true";
  }
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { code: { $regex: search, $options: "i" } },
      { city: { $regex: search, $options: "i" } },
    ];
  }

  const warehouses = await Warehouse.find(filter).sort({ isDefault: -1, createdAt: 1 }).lean();

  // Attach live stock counts per warehouse
  const whIds = warehouses.map((w) => w._id);
  const stockStats = await Inventory.aggregate([
    { $match: { warehouse: { $in: whIds } } },
    {
      $group: {
        _id: "$warehouse",
        totalSkus: { $sum: 1 },
        totalOnHand: { $sum: "$onHand" },
        totalReserved: { $sum: "$reserved" },
        totalDamaged: { $sum: "$damaged" },
        lowStockCount: {
          $sum: {
            $cond: [
              { $and: [{ $gt: [{ $subtract: ["$onHand", "$reserved"] }, 0] }, { $lte: [{ $subtract: ["$onHand", "$reserved"] }, "$minThreshold"] }] },
              1,
              0,
            ],
          },
        },
        outOfStockCount: {
          $sum: {
            $cond: [{ $lte: [{ $subtract: ["$onHand", "$reserved"] }, 0] }, 1, 0],
          },
        },
      },
    },
  ]);

  const statsMap = {};
  stockStats.forEach((s) => {
    statsMap[String(s._id)] = s;
  });

  const enriched = warehouses.map((w) => ({
    ...w,
    stats: statsMap[String(w._id)] || {
      totalSkus: 0,
      totalOnHand: 0,
      totalReserved: 0,
      totalDamaged: 0,
      lowStockCount: 0,
      outOfStockCount: 0,
    },
  }));

  return res.status(200).json(new ApiResponse(200, enriched, "Warehouses fetched successfully"));
});

export const createWarehouse = asyncHandler(async (req, res) => {
  const { code, name, address, city, state, pincode, manager, contactPhone, contactEmail, isDefault, notes } = req.body;

  if (!code || !name) {
    throw new ApiError(400, "Warehouse code and name are required.");
  }

  const cleanCode = String(code).trim().toUpperCase();
  const existing = await Warehouse.findOne({ code: cleanCode });
  if (existing) {
    throw new ApiError(400, `Warehouse with code '${cleanCode}' already exists.`);
  }

  if (isDefault) {
    await Warehouse.updateMany({}, { $set: { isDefault: false } });
  }

  const warehouse = await Warehouse.create({
    code: cleanCode,
    name: name.trim(),
    address: address?.trim() || "",
    city: city?.trim() || "Navi Mumbai",
    state: state?.trim() || "Maharashtra",
    pincode: pincode?.trim() || "400701",
    manager: manager?.trim() || "ARCL Operations",
    contactPhone: contactPhone?.trim() || "",
    contactEmail: contactEmail?.trim() || "",
    isDefault: !!isDefault,
    isActive: true,
    notes: notes?.trim() || "",
  });

  return res.status(201).json(new ApiResponse(201, warehouse, "Warehouse created successfully"));
});

export const updateWarehouse = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, code, address, city, state, pincode, manager, contactPhone, contactEmail, isDefault, isActive, notes } = req.body;

  const warehouse = await Warehouse.findById(id);
  if (!warehouse) {
    throw new ApiError(404, "Warehouse not found.");
  }

  if (code && code.trim().toUpperCase() !== warehouse.code) {
    const cleanCode = code.trim().toUpperCase();
    const existingCode = await Warehouse.findOne({ code: cleanCode, _id: { $ne: id } });
    if (existingCode) {
      throw new ApiError(400, `Warehouse code '${cleanCode}' is already in use by another warehouse.`);
    }
    warehouse.code = cleanCode;
  }

  if (isDefault && !warehouse.isDefault) {
    await Warehouse.updateMany({ _id: { $ne: id } }, { $set: { isDefault: false } });
    warehouse.isDefault = true;
  } else if (isDefault !== undefined) {
    warehouse.isDefault = isDefault;
  }

  if (name) warehouse.name = name.trim();
  if (address !== undefined) warehouse.address = address.trim();
  if (city !== undefined) warehouse.city = city.trim();
  if (state !== undefined) warehouse.state = state.trim();
  if (pincode !== undefined) warehouse.pincode = pincode.trim();
  if (manager !== undefined) warehouse.manager = manager.trim();
  if (contactPhone !== undefined) warehouse.contactPhone = contactPhone.trim();
  if (contactEmail !== undefined) warehouse.contactEmail = contactEmail.trim();
  if (isActive !== undefined) warehouse.isActive = isActive;
  if (notes !== undefined) warehouse.notes = notes.trim();

  await warehouse.save();

  return res.status(200).json(new ApiResponse(200, warehouse, "Warehouse updated successfully"));
});

export const deleteWarehouse = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const warehouse = await Warehouse.findById(id);
  if (!warehouse) {
    throw new ApiError(404, "Warehouse not found.");
  }

  const totalWarehouses = await Warehouse.countDocuments();
  if (totalWarehouses <= 1) {
    throw new ApiError(400, "Cannot delete the only remaining warehouse in the system.");
  }

  // Check if warehouse has onHand or reserved inventory > 0
  const activeStock = await Inventory.aggregate([
    { $match: { warehouse: warehouse._id } },
    {
      $group: {
        _id: null,
        totalOnHand: { $sum: "$onHand" },
        totalReserved: { $sum: "$reserved" },
      },
    },
  ]);

  const onHand = activeStock[0]?.totalOnHand || 0;
  const reserved = activeStock[0]?.totalReserved || 0;

  if (onHand > 0 || reserved > 0) {
    throw new ApiError(
      400,
      `Cannot delete warehouse '${warehouse.name}' because it still holds ${onHand} physical unit(s) and ${reserved} reserved unit(s). Please transfer or adjust the inventory to 0 before deleting.`
    );
  }

  // Check if there are active in-transit transfers involving this warehouse
  const pendingTransfers = await WarehouseTransfer.countDocuments({
    $or: [{ sourceWarehouse: warehouse._id }, { destinationWarehouse: warehouse._id }],
    status: { $in: ["DRAFT", "DISPATCHED"] },
  });

  if (pendingTransfers > 0) {
    throw new ApiError(
      400,
      `Cannot delete warehouse '${warehouse.name}' because there are ${pendingTransfers} active or in-transit transfer(s) associated with it.`
    );
  }

  // Check if there are active purchase orders awaiting receipt at this warehouse
  const pendingPOs = await PurchaseOrder.countDocuments({
    destinationWarehouse: warehouse._id,
    status: { $in: ["PENDING_APPROVAL", "ORDERED", "PARTIALLY_RECEIVED"] },
  });

  if (pendingPOs > 0) {
    throw new ApiError(
      400,
      `Cannot delete warehouse '${warehouse.name}' because there are ${pendingPOs} pending purchase order(s) destined for it.`
    );
  }

  // If this warehouse was the default warehouse, assign another warehouse as default
  if (warehouse.isDefault) {
    const anotherWarehouse = await Warehouse.findOne({ _id: { $ne: warehouse._id } });
    if (anotherWarehouse) {
      anotherWarehouse.isDefault = true;
      await anotherWarehouse.save();
    }
  }

  // Clean up any 0-quantity Inventory stubs for this warehouse
  await Inventory.deleteMany({ warehouse: warehouse._id, onHand: 0, reserved: 0 });

  // Delete warehouse document
  await Warehouse.findByIdAndDelete(id);

  return res.status(200).json(
    new ApiResponse(200, { deletedId: id, name: warehouse.name }, `Warehouse '${warehouse.name}' deleted successfully`)
  );
});

// ==========================================
// 2. SUPPLIER CONTROLLERS
// ==========================================

export const getSuppliers = asyncHandler(async (req, res) => {
  const { search, category, isActive, page = 1, limit = 20 } = req.query;
  const filter = {};

  if (isActive !== undefined && isActive !== "") {
    filter.isActive = isActive === "true";
  }
  if (category) {
    filter.categories = category;
  }
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { code: { $regex: search, $options: "i" } },
      { contactPerson: { $regex: search, $options: "i" } },
      { gstin: { $regex: search, $options: "i" } },
      { city: { $regex: search, $options: "i" } },
    ];
  }

  const p = Math.max(1, parseInt(page, 10));
  const l = Math.min(100, Math.max(1, parseInt(limit, 10)));
  const skip = (p - 1) * l;

  const [suppliers, total] = await Promise.all([
    Supplier.find(filter).sort({ createdAt: -1 }).skip(skip).limit(l).lean(),
    Supplier.countDocuments(filter),
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      { suppliers, total, page: p, pages: Math.ceil(total / l) },
      "Suppliers fetched successfully"
    )
  );
});

export const createSupplier = asyncHandler(async (req, res) => {
  const { code, name, contactPerson, email, phone, address, city, state, pincode, gstin, paymentTerms, categories, notes } = req.body;

  if (!name) {
    throw new ApiError(400, "Supplier name is required.");
  }

  let finalCode = (code || "").trim().toUpperCase();
  if (!finalCode) {
    const count = await Supplier.countDocuments();
    finalCode = `SUP-${String(count + 1).padStart(3, "0")}`;
  }

  const existing = await Supplier.findOne({ code: finalCode });
  if (existing) {
    throw new ApiError(400, `Supplier with code '${finalCode}' already exists.`);
  }

  const supplier = await Supplier.create({
    code: finalCode,
    name: name.trim(),
    contactPerson: contactPerson?.trim() || "",
    email: email?.trim().toLowerCase() || "",
    phone: phone?.trim() || "",
    address: address?.trim() || "",
    city: city?.trim() || "",
    state: state?.trim() || "Maharashtra",
    pincode: pincode?.trim() || "",
    gstin: (gstin || "").trim().toUpperCase(),
    paymentTerms: paymentTerms?.trim() || "Net 30 Days",
    categories: Array.isArray(categories) ? categories : categories ? [categories] : ["Lab Equipment"],
    notes: notes?.trim() || "",
    isActive: true,
  });

  return res.status(201).json(new ApiResponse(201, supplier, "Supplier created successfully"));
});

export const updateSupplier = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = { ...req.body };
  if (updateData.gstin) updateData.gstin = updateData.gstin.trim().toUpperCase();

  const supplier = await Supplier.findByIdAndUpdate(id, { $set: updateData }, { new: true, runValidators: true });
  if (!supplier) {
    throw new ApiError(404, "Supplier not found.");
  }

  return res.status(200).json(new ApiResponse(200, supplier, "Supplier updated successfully"));
});

// ==========================================
// 3. INVENTORY & STOCK MANAGEMENT
// ==========================================

// Helper: Ensure default warehouse exists and returns it
const getDefaultWarehouse = async () => {
  await ensureDefaultWarehouses();
  let wh = await Warehouse.findOne({ isDefault: true, isActive: true });
  if (!wh) {
    wh = await Warehouse.findOne({ isActive: true });
  }
  return wh;
};

// Helper: Synchronize and create Inventory Alert if needed
export const checkAndSyncAlert = async (invRecord) => {
  try {
    const avail = Math.max(0, (invRecord.onHand || 0) - (invRecord.reserved || 0));
    const minThresh = invRecord.minThreshold || 5;

    if (avail === 0) {
      // Out of Stock Alert
      await InventoryAlert.findOneAndUpdate(
        { product: invRecord.product, warehouse: invRecord.warehouse, alertType: "OUT_OF_STOCK", status: "ACTIVE" },
        {
          $set: {
            inventory: invRecord._id,
            productName: invRecord.productName,
            sku: invRecord.sku,
            warehouseCode: invRecord.warehouseCode,
            severity: "CRITICAL",
            currentStock: avail,
            minThreshold: minThresh,
            message: `CRITICAL: Product '${invRecord.productName}' (${invRecord.sku}) is completely OUT OF STOCK at ${invRecord.warehouseCode}.`,
          },
        },
        { upsert: true }
      );
    } else if (avail <= minThresh) {
      // Low Stock Alert
      await InventoryAlert.findOneAndUpdate(
        { product: invRecord.product, warehouse: invRecord.warehouse, alertType: "LOW_STOCK", status: "ACTIVE" },
        {
          $set: {
            inventory: invRecord._id,
            productName: invRecord.productName,
            sku: invRecord.sku,
            warehouseCode: invRecord.warehouseCode,
            severity: "WARNING",
            currentStock: avail,
            minThreshold: minThresh,
            message: `WARNING: Product '${invRecord.productName}' (${invRecord.sku}) is running LOW ON STOCK (${avail} units available <= threshold of ${minThresh}) at ${invRecord.warehouseCode}.`,
          },
        },
        { upsert: true }
      );
    } else {
      // Stock is healthy -> auto-resolve active stock alerts
      await InventoryAlert.updateMany(
        { product: invRecord.product, warehouse: invRecord.warehouse, status: "ACTIVE", alertType: { $in: ["LOW_STOCK", "OUT_OF_STOCK"] } },
        {
          $set: {
            status: "RESOLVED",
            resolvedBy: "System (Stock Restocked)",
            resolvedAt: new Date(),
            resolutionNotes: `Stock replenished to ${avail} available units.`,
          },
        }
      );
    }
  } catch (err) {
    console.warn("checkAndSyncAlert error:", err.message);
  }
};

export const getInventoryList = asyncHandler(async (req, res) => {
  const { search, warehouse, category, status, page = 1, limit = 20, sortBy = "updatedAt", sortOrder = "desc" } = req.query;

  const filter = {};
  if (warehouse) {
    filter.warehouse = warehouse;
  }
  if (category) {
    filter.category = category;
  }
  if (status) {
    filter.status = status;
  }
  if (search) {
    filter.$or = [
      { productName: { $regex: search, $options: "i" } },
      { sku: { $regex: search, $options: "i" } },
      { warehouseCode: { $regex: search, $options: "i" } },
      { locationBin: { $regex: search, $options: "i" } },
    ];
  }

  const p = Math.max(1, parseInt(page, 10));
  const l = Math.min(100, Math.max(1, parseInt(limit, 10)));
  const skip = (p - 1) * l;
  const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

  const [items, total] = await Promise.all([
    Inventory.find(filter)
      .populate("product", "name slug images productCode hsnCode")
      .populate("warehouse", "name code city state")
      .populate("category", "name slug")
      .sort(sort)
      .skip(skip)
      .limit(l)
      .lean(),
    Inventory.countDocuments(filter),
  ]);

  // Compute virtual 'available' for lean documents
  const enriched = items.map((item) => ({
    ...item,
    available: Math.max(0, (item.onHand || 0) - (item.reserved || 0)),
  }));

  return res.status(200).json(
    new ApiResponse(
      200,
      { items: enriched, total, page: p, pages: Math.ceil(total / l) },
      "Inventory list fetched successfully"
    )
  );
});

export const getInventoryById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const item = await Inventory.findById(id)
    .populate("product")
    .populate("warehouse")
    .populate("category")
    .lean();

  if (!item) {
    throw new ApiError(404, "Inventory record not found.");
  }

  // Fetch recent stock movements for this inventory item
  const recentMovements = await StockMovement.find({ inventory: id })
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();

  // Fetch active alerts
  const activeAlerts = await InventoryAlert.find({
    product: item.product?._id || item.product,
    warehouse: item.warehouse?._id || item.warehouse,
    status: "ACTIVE",
  }).lean();

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        ...item,
        available: Math.max(0, (item.onHand || 0) - (item.reserved || 0)),
        recentMovements,
        activeAlerts,
      },
      "Inventory record fetched successfully"
    )
  );
});

// Initialize / Link Product to Inventory with Opening Stock
export const initializeProductStock = asyncHandler(async (req, res) => {
  const {
    productId,
    productName,
    sku,
    categoryName,
    warehouseId,
    openingQty = 0,
    minThreshold = 5,
    reorderQty = 10,
    unitCost = 0,
    locationBin = "BAY-1",
    notes,
  } = req.body;

  let product = null;

  // 1. Try finding existing product by ID
  if (productId && mongoose.Types.ObjectId.isValid(productId)) {
    product = await Product.findById(productId).populate("category");
  }

  // 2. If not found by ID or if creating custom/non-catalog product by name
  if (!product) {
    const rawName = (productName || "").trim();
    if (!rawName) {
      throw new ApiError(400, "Product selection or valid product name is required.");
    }

    const cleanEscaped = rawName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    product = await Product.findOne({
      $or: [
        { name: { $regex: `^${cleanEscaped}$`, $options: "i" } },
        ...(sku ? [{ productCode: sku.trim().toUpperCase() }] : []),
      ],
    }).populate("category");

    // If still not found, create new Product in the DB so it permanently exists and auto-suggests in future!
    if (!product) {
      let categoryDoc = null;
      if (categoryName && categoryName.trim()) {
        const cleanCat = categoryName.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        categoryDoc = await Category.findOne({ name: { $regex: cleanCat, $options: "i" } });
      }
      if (!categoryDoc) {
        categoryDoc = await Category.findOne();
      }

      const autoSku = sku && sku.trim()
        ? sku.trim().toUpperCase()
        : `ARCL-${rawName.replace(/[^a-zA-Z0-9]/g, "").substring(0, 6).toUpperCase() || "SKU"}-${Date.now().toString().slice(-4)}`;

      const baseSlug = slugify(rawName, { lower: true, strict: true }) || "product";
      let cleanSlug = baseSlug;
      const slugExists = await Product.findOne({ slug: cleanSlug });
      if (slugExists) {
        cleanSlug = `${baseSlug}-${Date.now().toString(36)}`;
      }

      product = await Product.create({
        name: rawName,
        slug: cleanSlug,
        productCode: autoSku,
        category: categoryDoc?._id,
        isActive: true,
        description: notes || `${rawName} - Registered into ARCL Inventory System.`,
      });
      product.category = categoryDoc;
    }
  }

  if (!product) {
    throw new ApiError(404, "Product not found and could not be registered.");
  }

  let wh;
  if (warehouseId) {
    wh = await Warehouse.findById(warehouseId);
  } else {
    wh = await getDefaultWarehouse();
  }
  if (!wh) {
    throw new ApiError(400, "Valid active warehouse is required.");
  }

  const cleanSku = (product.productCode || `ARCL-${String(product.slug).substring(0, 10).toUpperCase()}`).trim().toUpperCase();

  // Check if inventory record already exists
  let inventory = await Inventory.findOne({ product: product._id, warehouse: wh._id });

  const qtyToAdd = Math.max(0, parseInt(openingQty, 10) || 0);

  if (!inventory) {
    inventory = await Inventory.create({
      product: product._id,
      productName: product.name,
      sku: cleanSku,
      category: product.category?._id || null,
      categoryName: product.category?.name || "General Lab Equipment",
      warehouse: wh._id,
      warehouseCode: wh.code,
      warehouseName: wh.name,
      onHand: qtyToAdd,
      reserved: 0,
      incoming: 0,
      damaged: 0,
      minThreshold: Math.max(0, parseInt(minThreshold, 10) || 5),
      reorderQty: Math.max(1, parseInt(reorderQty, 10) || 10),
      unit: "NOS",
      unitCost: Math.max(0, parseFloat(unitCost) || 0),
      locationBin: locationBin?.trim() || "BAY-1",
      lastMovementDate: new Date(),
      isInitialized: true,
      notes: notes?.trim() || "Initial stock setup",
    });

    if (qtyToAdd > 0) {
      await StockMovement.create({
        inventory: inventory._id,
        product: product._id,
        productName: product.name,
        sku: cleanSku,
        warehouse: wh._id,
        warehouseCode: wh.code,
        movementType: "OPENING_STOCK",
        quantity: qtyToAdd,
        balanceBefore: 0,
        balanceAfter: qtyToAdd,
        reservedBefore: 0,
        reservedAfter: 0,
        referenceType: "OPENING_STOCK",
        referenceId: `INIT-${wh.code}-${Date.now().toString().slice(-6)}`,
        reason: "Initial Physical Stock Audit / Opening Balance",
        notes: notes || "Recorded during initial inventory onboarding.",
        performedBy: req.user?._id || null,
        performedByName: req.user?.name || "Authorized Inventory Officer",
        performedByEmail: req.user?.email || "",
      });
    }
  } else {
    // If existing, update thresholds and add delta if specified
    const prevBalance = inventory.onHand || 0;
    if (qtyToAdd > 0 && !inventory.isInitialized) {
      inventory.onHand = qtyToAdd;
      inventory.isInitialized = true;
      await StockMovement.create({
        inventory: inventory._id,
        product: product._id,
        productName: product.name,
        sku: cleanSku,
        warehouse: wh._id,
        warehouseCode: wh.code,
        movementType: "OPENING_STOCK",
        quantity: qtyToAdd,
        balanceBefore: prevBalance,
        balanceAfter: qtyToAdd,
        reservedBefore: inventory.reserved || 0,
        reservedAfter: inventory.reserved || 0,
        referenceType: "OPENING_STOCK",
        referenceId: `INIT-${wh.code}-${Date.now().toString().slice(-6)}`,
        reason: "Opening Stock Reconciliation",
        notes: notes || "Initial opening quantity confirmed by authorized staff.",
        performedBy: req.user?._id || null,
        performedByName: req.user?.name || "Authorized Inventory Officer",
        performedByEmail: req.user?.email || "",
      });
    }
    inventory.minThreshold = Math.max(0, parseInt(minThreshold, 10) || inventory.minThreshold);
    inventory.reorderQty = Math.max(1, parseInt(reorderQty, 10) || inventory.reorderQty);
    if (unitCost > 0) inventory.unitCost = parseFloat(unitCost);
    if (locationBin) inventory.locationBin = locationBin.trim();
    await inventory.save();
  }

  await checkAndSyncAlert(inventory);

  return res.status(200).json(new ApiResponse(200, inventory, "Product stock initialized successfully"));
});

// Authorized Stock Adjustment with Mandatory Reason Code & Audit Log
export const adjustStock = asyncHandler(async (req, res) => {
  const { inventoryId, type, quantity, reason, notes } = req.body;

  if (!inventoryId || !type || quantity === undefined) {
    throw new ApiError(400, "Inventory ID, adjustment type, and quantity are required.");
  }

  if (!reason || !String(reason).trim()) {
    throw new ApiError(400, "Mandatory reason code/explanation is required for all stock adjustments.");
  }

  const validTypes = [
    "OPENING_STOCK",
    "GOODS_RECEIPT",
    "CORRECTION_ADD",
    "CORRECTION_SUBTRACT",
    "DAMAGE_FOUND",
    "DAMAGE_RESTORE",
    "INTERNAL_USE",
    "RETURN_RESTOCK",
    "AUDIT_RECONCILIATION",
    "SCRAP",
  ];

  if (!validTypes.includes(type)) {
    throw new ApiError(400, `Invalid adjustment type. Must be one of: ${validTypes.join(", ")}`);
  }

  const parsedQty = parseInt(quantity, 10);
  if (isNaN(parsedQty) || parsedQty <= 0) {
    throw new ApiError(400, "Quantity must be a positive number.");
  }

  const inventory = await Inventory.findById(inventoryId);
  if (!inventory) {
    throw new ApiError(404, "Inventory record not found.");
  }

  const currentOnHand = inventory.onHand || 0;
  const currentReserved = inventory.reserved || 0;
  const currentDamaged = inventory.damaged || 0;
  const currentAvailable = Math.max(0, currentOnHand - currentReserved);

  let newOnHand = currentOnHand;
  let newDamaged = currentDamaged;
  let netQtyChange = 0;
  let movementType = "MANUAL_ADJUSTMENT";

  switch (type) {
    case "OPENING_STOCK":
    case "GOODS_RECEIPT":
    case "CORRECTION_ADD":
    case "RETURN_RESTOCK":
      newOnHand = currentOnHand + parsedQty;
      netQtyChange = parsedQty;
      movementType = type === "OPENING_STOCK" ? "OPENING_STOCK" : type === "RETURN_RESTOCK" ? "RETURN_RESTOCK" : "MANUAL_ADJUSTMENT";
      break;

    case "CORRECTION_SUBTRACT":
    case "INTERNAL_USE":
    case "SCRAP":
      if (currentAvailable < parsedQty) {
        throw new ApiError(
          400,
          `Cannot deduct ${parsedQty} units. Only ${currentAvailable} units are available for reduction (${currentReserved} units are reserved for active orders).`
        );
      }
      newOnHand = currentOnHand - parsedQty;
      netQtyChange = -parsedQty;
      movementType = "MANUAL_ADJUSTMENT";
      break;

    case "DAMAGE_FOUND":
      // Moves quantity from On-Hand to Damaged / Quarantined
      if (currentAvailable < parsedQty) {
        throw new ApiError(
          400,
          `Cannot quarantine ${parsedQty} units. Only ${currentAvailable} available units on hand.`
        );
      }
      newOnHand = currentOnHand - parsedQty;
      newDamaged = currentDamaged + parsedQty;
      netQtyChange = -parsedQty;
      movementType = "DAMAGE_QUARANTINE";
      break;

    case "DAMAGE_RESTORE":
      // Restores inspected/repaired items from damaged back to On-Hand
      if (currentDamaged < parsedQty) {
        throw new ApiError(
          400,
          `Cannot restore ${parsedQty} units. Only ${currentDamaged} units currently in quarantine.`
        );
      }
      newDamaged = currentDamaged - parsedQty;
      newOnHand = currentOnHand + parsedQty;
      netQtyChange = parsedQty;
      movementType = "DAMAGE_RESTORE";
      break;

    case "AUDIT_RECONCILIATION":
      // 'parsedQty' is treated as the new actual physical count
      const diff = parsedQty - currentOnHand;
      if (diff < 0 && currentOnHand - Math.abs(diff) < currentReserved) {
        throw new ApiError(
          400,
          `Physical count of ${parsedQty} is less than currently reserved units (${currentReserved}). Resolve order reservations first.`
        );
      }
      newOnHand = parsedQty;
      netQtyChange = diff;
      movementType = "AUDIT_RECONCILIATION";
      break;

    default:
      throw new ApiError(400, "Unsupported adjustment type.");
  }

  // Atomic conditional update to prevent concurrent overselling/race condition
  const updatedInv = await Inventory.findOneAndUpdate(
    {
      _id: inventory._id,
      onHand: currentOnHand, // Concurrency check
    },
    {
      $set: {
        onHand: newOnHand,
        damaged: newDamaged,
        lastMovementDate: new Date(),
        status:
          Math.max(0, newOnHand - currentReserved) === 0
            ? "OUT_OF_STOCK"
            : Math.max(0, newOnHand - currentReserved) <= inventory.minThreshold
            ? "LOW_STOCK"
            : "IN_STOCK",
      },
    },
    { new: true }
  );

  if (!updatedInv) {
    throw new ApiError(409, "Concurrent stock change detected. Please refresh and try again.");
  }

  // Record Immutable Stock Movement
  const movement = await StockMovement.create({
    inventory: inventory._id,
    product: inventory.product,
    productName: inventory.productName,
    sku: inventory.sku,
    warehouse: inventory.warehouse,
    warehouseCode: inventory.warehouseCode,
    movementType,
    quantity: netQtyChange,
    balanceBefore: currentOnHand,
    balanceAfter: newOnHand,
    reservedBefore: currentReserved,
    reservedAfter: currentReserved,
    referenceType: "MANUAL_ADJUSTMENT",
    referenceId: `ADJ-${Date.now().toString().slice(-8)}`,
    reason: String(reason).trim(),
    notes: notes?.trim() || "",
    performedBy: req.user?._id || null,
    performedByName: req.user?.name || "Authorized Inventory Admin",
    performedByEmail: req.user?.email || "",
  });

  // Re-sync alerts
  await checkAndSyncAlert(updatedInv);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        inventory: updatedInv,
        movement,
      },
      "Stock adjusted successfully with permanent audit trail."
    )
  );
});

// Update Thresholds and Bin Location
export const updateInventorySettings = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { minThreshold, reorderQty, locationBin, unitCost, sellingPrice, status } = req.body;

  const inventory = await Inventory.findById(id);
  if (!inventory) {
    throw new ApiError(404, "Inventory record not found.");
  }

  if (minThreshold !== undefined) inventory.minThreshold = Math.max(0, parseInt(minThreshold, 10));
  if (reorderQty !== undefined) inventory.reorderQty = Math.max(1, parseInt(reorderQty, 10));
  if (locationBin !== undefined) inventory.locationBin = locationBin.trim();
  if (unitCost !== undefined) inventory.unitCost = Math.max(0, parseFloat(unitCost));
  if (sellingPrice !== undefined) inventory.sellingPrice = Math.max(0, parseFloat(sellingPrice));
  if (status && ["IN_STOCK", "LOW_STOCK", "OUT_OF_STOCK", "DISCONTINUED"].includes(status)) {
    inventory.status = status;
  }

  await inventory.save();
  await checkAndSyncAlert(inventory);

  return res.status(200).json(new ApiResponse(200, inventory, "Inventory settings updated successfully"));
});

// ==========================================
// 4. STOCK MOVEMENTS AUDIT LOG
// ==========================================

export const getStockMovements = asyncHandler(async (req, res) => {
  const {
    productId,
    warehouseId,
    movementType,
    referenceType,
    search,
    startDate,
    endDate,
    page = 1,
    limit = 25,
  } = req.query;

  const filter = {};
  if (productId) filter.product = productId;
  if (warehouseId) filter.warehouse = warehouseId;
  if (movementType) filter.movementType = movementType;
  if (referenceType) filter.referenceType = referenceType;

  if (search) {
    filter.$or = [
      { productName: { $regex: search, $options: "i" } },
      { sku: { $regex: search, $options: "i" } },
      { referenceId: { $regex: search, $options: "i" } },
      { reason: { $regex: search, $options: "i" } },
      { performedByName: { $regex: search, $options: "i" } },
    ];
  }

  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) {
      const e = new Date(endDate);
      e.setHours(23, 59, 59, 999);
      filter.createdAt.$lte = e;
    }
  }

  const p = Math.max(1, parseInt(page, 10));
  const l = Math.min(100, Math.max(1, parseInt(limit, 10)));
  const skip = (p - 1) * l;

  const [movements, total] = await Promise.all([
    StockMovement.find(filter).sort({ createdAt: -1 }).skip(skip).limit(l).lean(),
    StockMovement.countDocuments(filter),
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      { movements, total, page: p, pages: Math.ceil(total / l) },
      "Stock movements fetched successfully"
    )
  );
});

export const updateStockMovement = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason, notes, referenceId, movementType, quantity, syncInventory = true } = req.body;

  const movement = await StockMovement.findById(id);
  if (!movement) {
    throw new ApiError(404, "Stock movement audit record not found.");
  }

  // If quantity is modified and syncInventory is enabled, adjust the corresponding live inventory
  if (quantity !== undefined && Number(quantity) !== movement.quantity) {
    const newQty = Number(quantity);
    const qtyDiff = newQty - movement.quantity;

    if (syncInventory && movement.inventory) {
      const inventory = await Inventory.findById(movement.inventory);
      if (inventory) {
        if (inventory.onHand + qtyDiff < 0) {
          throw new ApiError(
            400,
            `Cannot update movement quantity to ${newQty}. It would result in negative physical stock (${inventory.onHand + qtyDiff} units).`
          );
        }
        inventory.onHand += qtyDiff;
        inventory.available = Math.max(0, inventory.onHand - inventory.reserved);
        if (inventory.onHand === 0) {
          inventory.status = "OUT_OF_STOCK";
        } else if (inventory.onHand <= inventory.minThreshold) {
          inventory.status = "LOW_STOCK";
        } else {
          inventory.status = "IN_STOCK";
        }
        await inventory.save();
      }
    }

    movement.quantity = newQty;
    movement.balanceAfter = movement.balanceBefore + newQty;
  }

  if (reason !== undefined) movement.reason = reason.trim();
  if (notes !== undefined) movement.notes = notes.trim();
  if (referenceId !== undefined) movement.referenceId = referenceId.trim();
  if (movementType !== undefined) movement.movementType = movementType;

  await movement.save();

  return res.status(200).json(
    new ApiResponse(200, movement, "Stock movement audit record updated successfully")
  );
});

export const deleteStockMovement = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { revertStock = true } = req.body || {};

  const movement = await StockMovement.findById(id);
  if (!movement) {
    throw new ApiError(404, "Stock movement audit record not found.");
  }

  // If revertStock is enabled, reverse this movement's effect on live inventory
  if (revertStock && movement.inventory && movement.quantity !== 0) {
    const inventory = await Inventory.findById(movement.inventory);
    if (inventory) {
      // Reverting a movement means: onHand = onHand - movement.quantity
      if (inventory.onHand - movement.quantity < 0) {
        throw new ApiError(
          400,
          `Cannot revert stock movement because it would cause negative physical on-hand stock (${inventory.onHand - movement.quantity} units). Please adjust stock manually or uncheck 'Revert Stock Impact'.`
        );
      }
      inventory.onHand -= movement.quantity;
      inventory.available = Math.max(0, inventory.onHand - inventory.reserved);
      if (inventory.onHand === 0) {
        inventory.status = "OUT_OF_STOCK";
      } else if (inventory.onHand <= inventory.minThreshold) {
        inventory.status = "LOW_STOCK";
      } else {
        inventory.status = "IN_STOCK";
      }
      await inventory.save();
    }
  }

  await StockMovement.findByIdAndDelete(id);

  return res.status(200).json(
    new ApiResponse(200, { deletedId: id }, "Stock movement audit record deleted successfully")
  );
});

// ==========================================
// 5. PURCHASE ORDERS & PROCUREMENT
// ==========================================

export const getPurchaseOrders = asyncHandler(async (req, res) => {
  const { status, supplier, warehouse, search, fromDate, toDate, page = 1, limit = 50 } = req.query;
  const filter = {};

  if (status) filter.status = status;
  if (supplier) filter.supplier = supplier;
  if (warehouse) filter.destinationWarehouse = warehouse;
  if (search) {
    filter.$or = [
      { poNumber: { $regex: search, $options: "i" } },
      { supplierName: { $regex: search, $options: "i" } },
      { "items.productName": { $regex: search, $options: "i" } },
      { "items.sku": { $regex: search, $options: "i" } },
    ];
  }

  if (fromDate || toDate) {
    filter.orderDate = {};
    if (fromDate) {
      const start = new Date(fromDate);
      start.setHours(0, 0, 0, 0);
      filter.orderDate.$gte = start;
    }
    if (toDate) {
      const end = new Date(toDate);
      end.setHours(23, 59, 59, 999);
      filter.orderDate.$lte = end;
    }
  }

  const p = Math.max(1, parseInt(page, 10));
  const l = Math.min(100, Math.max(1, parseInt(limit, 10)));
  const skip = (p - 1) * l;

  const [orders, total] = await Promise.all([
    PurchaseOrder.find(filter)
      .populate("supplier", "name code email phone gstin")
      .populate("destinationWarehouse", "name code city state")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(l)
      .lean(),
    PurchaseOrder.countDocuments(filter),
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      { orders, total, page: p, pages: Math.ceil(total / l) },
      "Purchase orders fetched successfully"
    )
  );
});

export const getPurchaseOrderById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const po = await PurchaseOrder.findById(id)
    .populate("supplier")
    .populate("destinationWarehouse")
    .populate("items.product")
    .lean();

  if (!po) {
    throw new ApiError(404, "Purchase order not found.");
  }

  return res.status(200).json(new ApiResponse(200, po, "Purchase order fetched successfully"));
});

export const createPurchaseOrder = asyncHandler(async (req, res) => {
  const { supplierId, destinationWarehouseId, expectedDeliveryDate, items, notes } = req.body;

  if (!supplierId || !destinationWarehouseId || !Array.isArray(items) || items.length === 0) {
    throw new ApiError(400, "Supplier, destination warehouse, and at least one item are required.");
  }

  const [supplier, warehouse] = await Promise.all([
    Supplier.findById(supplierId),
    Warehouse.findById(destinationWarehouseId),
  ]);

  if (!supplier) throw new ApiError(404, "Supplier not found.");
  if (!warehouse) throw new ApiError(404, "Warehouse not found.");

  // Generate unique collision-resistant PO number
  const year = new Date().getFullYear();
  const count = await PurchaseOrder.countDocuments();
  const poNumber = `PO-${year}-${String(count + 1).padStart(4, "0")}`;

  let subtotal = 0;
  let taxAmount = 0;

  const formattedItems = [];
  for (const item of items) {
    if (!item.orderedQty || item.orderedQty <= 0) {
      throw new ApiError(400, "Each item must have an ordered quantity > 0.");
    }

    let product = null;
    if (item.productId && mongoose.Types.ObjectId.isValid(item.productId)) {
      product = await Product.findById(item.productId);
    }

    if (!product) {
      const rawName = (item.productName || "").trim();
      if (!rawName) {
        throw new ApiError(400, "Each line item must have a valid product selected or entered.");
      }
      const cleanEscaped = rawName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      product = await Product.findOne({
        $or: [
          { name: { $regex: `^${cleanEscaped}$`, $options: "i" } },
          ...(item.sku ? [{ productCode: item.sku.trim().toUpperCase() }] : []),
        ],
      });

      if (!product) {
        const cat = await Category.findOne();
        const autoCode = item.sku && item.sku.trim()
          ? item.sku.trim().toUpperCase()
          : `ARCL-${rawName.replace(/[^a-zA-Z0-9]/g, "").substring(0, 6).toUpperCase() || "SKU"}-${Date.now().toString().slice(-4)}`;

        const baseSlug = slugify(rawName, { lower: true, strict: true }) || "product";
        let uniqueSlug = baseSlug;
        const slugExists = await Product.findOne({ slug: uniqueSlug });
        if (slugExists) uniqueSlug = `${baseSlug}-${Date.now().toString(36)}`;

        product = await Product.create({
          name: rawName,
          slug: uniqueSlug,
          productCode: autoCode,
          category: cat?._id,
          isActive: true,
          description: `Added via Purchase Order: ${poNumber}`,
        });
      }
    }

    const cleanSku = (item.sku || product.productCode || `ARCL-${String(product.slug).toUpperCase()}`).trim().toUpperCase();
    const unitPrice = Math.max(0, parseFloat(item.unitPrice) || 0);
    const taxRate = item.taxRate !== undefined ? parseFloat(item.taxRate) : 18;
    const itemSub = unitPrice * item.orderedQty;
    const itemTax = (itemSub * taxRate) / 100;
    const itemTotal = itemSub + itemTax;

    subtotal += itemSub;
    taxAmount += itemTax;

    formattedItems.push({
      product: product._id,
      productName: product.name,
      sku: cleanSku,
      orderedQty: parseInt(item.orderedQty, 10),
      receivedQty: 0,
      damagedQty: 0,
      unitPrice,
      taxRate,
      taxAmount: itemTax,
      totalAmount: itemTotal,
      notes: item.notes || "",
    });
  }

  const totalAmount = subtotal + taxAmount;

  const po = await PurchaseOrder.create({
    poNumber,
    supplier: supplier._id,
    supplierName: supplier.name,
    supplierGstin: supplier.gstin || "",
    destinationWarehouse: warehouse._id,
    warehouseCode: warehouse.code,
    warehouseName: warehouse.name,
    orderDate: new Date(),
    expectedDeliveryDate: expectedDeliveryDate ? new Date(expectedDeliveryDate) : null,
    status: "DRAFT",
    items: formattedItems,
    subtotal,
    taxAmount,
    totalAmount,
    currency: "INR",
    notes: notes?.trim() || "",
    createdBy: req.user?.name || "Authorized Admin",
  });

  return res.status(201).json(new ApiResponse(201, po, `Purchase Order ${poNumber} created successfully in Draft status.`));
});

// Approve Purchase Order -> Moves to ORDERED and marks incoming stock
export const approvePurchaseOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { notes } = req.body;

  const po = await PurchaseOrder.findById(id);
  if (!po) throw new ApiError(404, "Purchase Order not found.");

  if (po.status !== "DRAFT" && po.status !== "PENDING_APPROVAL") {
    throw new ApiError(400, `Cannot approve PO in '${po.status}' status.`);
  }

  po.status = "ORDERED";
  po.approval = {
    isApproved: true,
    approvedBy: req.user?.name || "Super Administrator",
    approvedAt: new Date(),
    notes: notes || "Approved for supplier dispatch.",
  };

  await po.save();

  // Atomically increment incoming quantities on inventory records
  for (const item of po.items) {
    await Inventory.findOneAndUpdate(
      { product: item.product, warehouse: po.destinationWarehouse },
      {
        $inc: { incoming: item.orderedQty },
        $setOnInsert: {
          productName: item.productName,
          sku: item.sku,
          warehouseCode: po.warehouseCode,
          warehouseName: po.warehouseName,
          onHand: 0,
          reserved: 0,
          damaged: 0,
          minThreshold: 5,
          reorderQty: 10,
          unit: "NOS",
          unitCost: item.unitPrice,
          status: "OUT_OF_STOCK",
        },
      },
      { upsert: true }
    );
  }

  return res.status(200).json(new ApiResponse(200, po, `Purchase Order ${po.poNumber} approved and marked ORDERED.`));
});

// Receive Goods Against Purchase Order (Partial or Full)
export const receivePurchaseOrderGoods = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { challanNo, invoiceNo, itemsReceived, notes } = req.body;

  if (!Array.isArray(itemsReceived) || itemsReceived.length === 0) {
    throw new ApiError(400, "Items received details are required.");
  }

  const po = await PurchaseOrder.findById(id);
  if (!po) throw new ApiError(404, "Purchase Order not found.");

  if (po.status !== "ORDERED" && po.status !== "PARTIALLY_RECEIVED") {
    throw new ApiError(400, `Cannot receive goods for PO in '${po.status}' status.`);
  }

  const receivingLog = {
    receivedAt: new Date(),
    receivedBy: req.user?.name || "Authorized Goods Inward Officer",
    challanNo: challanNo?.trim() || "",
    invoiceNo: invoiceNo?.trim() || "",
    itemsReceived: [],
    notes: notes?.trim() || "",
  };

  let allCompleted = true;

  for (const rec of itemsReceived) {
    const poItem = po.items.id(rec.itemId) || po.items.find((i) => String(i.product) === String(rec.productId));
    if (!poItem) continue;

    const accepted = Math.max(0, parseInt(rec.acceptedQty, 10) || 0);
    const damaged = Math.max(0, parseInt(rec.damagedQty, 10) || 0);
    const totalRec = accepted + damaged;

    if (totalRec <= 0) continue;

    const remainingPending = poItem.orderedQty - poItem.receivedQty;
    if (totalRec > remainingPending) {
      throw new ApiError(
        400,
        `Cannot receive ${totalRec} units for '${poItem.productName}'. Only ${remainingPending} units pending.`
      );
    }

    poItem.receivedQty += totalRec;
    poItem.damagedQty += damaged;

    receivingLog.itemsReceived.push({
      product: poItem.product,
      sku: poItem.sku,
      acceptedQty: accepted,
      damagedQty: damaged,
    });

    // Update Inventory Record Atomically
    let inv = await Inventory.findOne({ product: poItem.product, warehouse: po.destinationWarehouse });
    if (!inv) {
      inv = await Inventory.create({
        product: poItem.product,
        productName: poItem.productName,
        sku: poItem.sku,
        warehouse: po.destinationWarehouse,
        warehouseCode: po.warehouseCode,
        warehouseName: po.warehouseName,
        onHand: 0,
        reserved: 0,
        incoming: 0,
        damaged: 0,
        unitCost: poItem.unitPrice,
      });
    }

    const prevOnHand = inv.onHand || 0;
    const currentCost = inv.unitCost || poItem.unitPrice;

    // Calculate Weighted Average Cost for Accepted Items
    let newUnitCost = currentCost;
    if (accepted > 0 && prevOnHand + accepted > 0) {
      newUnitCost = Math.round((prevOnHand * currentCost + accepted * poItem.unitPrice) / (prevOnHand + accepted));
    }

    // Decrement incoming by totalRec, increment onHand by accepted, increment damaged by damaged
    const updatedInv = await Inventory.findOneAndUpdate(
      { _id: inv._id },
      {
        $inc: {
          onHand: accepted,
          incoming: -totalRec,
          damaged: damaged,
        },
        $set: {
          unitCost: newUnitCost,
          lastMovementDate: new Date(),
        },
      },
      { new: true }
    );

    // Record Stock Movement for Accepted Goods
    if (accepted > 0) {
      await StockMovement.create({
        inventory: inv._id,
        product: poItem.product,
        productName: poItem.productName,
        sku: poItem.sku,
        warehouse: po.destinationWarehouse,
        warehouseCode: po.warehouseCode,
        movementType: "PURCHASE_RECEIPT",
        quantity: accepted,
        balanceBefore: prevOnHand,
        balanceAfter: prevOnHand + accepted,
        reservedBefore: inv.reserved || 0,
        reservedAfter: inv.reserved || 0,
        referenceType: "PURCHASE_ORDER",
        referenceId: po.poNumber,
        reason: `PO Inward Receipt (Challan: ${challanNo || "N/A"})`,
        notes: `Received from ${po.supplierName}. Accepted: ${accepted} units.`,
        performedBy: req.user?._id || null,
        performedByName: req.user?.name || "Goods Inward Officer",
      });
    }

    // Record Stock Movement for Damaged Goods if any
    if (damaged > 0) {
      await StockMovement.create({
        inventory: inv._id,
        product: poItem.product,
        productName: poItem.productName,
        sku: poItem.sku,
        warehouse: po.destinationWarehouse,
        warehouseCode: po.warehouseCode,
        movementType: "DAMAGE_QUARANTINE",
        quantity: damaged,
        balanceBefore: prevOnHand + accepted,
        balanceAfter: prevOnHand + accepted,
        referenceType: "PURCHASE_ORDER",
        referenceId: po.poNumber,
        reason: "Damaged / Rejected on Inward Delivery",
        notes: `Damaged incoming stock placed in quarantine. Units: ${damaged}`,
        performedBy: req.user?._id || null,
        performedByName: req.user?.name || "Goods Inward Officer",
      });
    }

    await checkAndSyncAlert(updatedInv);

    if (poItem.receivedQty < poItem.orderedQty) {
      allCompleted = false;
    }
  }

  po.receivingHistory.push(receivingLog);
  po.status = allCompleted ? "RECEIVED" : "PARTIALLY_RECEIVED";

  await po.save();

  return res.status(200).json(
    new ApiResponse(
      200,
      po,
      `Goods inward successfully logged. PO status updated to ${po.status}.`
    )
  );
});

// Cancel Purchase Order -> Releases incoming reservation
export const cancelPurchaseOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  const po = await PurchaseOrder.findById(id);
  if (!po) throw new ApiError(404, "Purchase Order not found.");

  if (po.status === "RECEIVED" || po.status === "CANCELLED") {
    throw new ApiError(400, `Cannot cancel PO in '${po.status}' status.`);
  }

  // Release pending incoming quantities
  for (const item of po.items) {
    const pending = item.orderedQty - item.receivedQty;
    if (pending > 0 && po.status === "ORDERED") {
      await Inventory.findOneAndUpdate(
        { product: item.product, warehouse: po.destinationWarehouse },
        { $inc: { incoming: -pending } }
      );
    }
  }

  po.status = "CANCELLED";
  po.notes = `${po.notes ? po.notes + " | " : ""}Cancelled: ${reason || "Supplier cancelled order."}`;
  await po.save();

  return res.status(200).json(new ApiResponse(200, po, `Purchase Order ${po.poNumber} cancelled.`));
});

// ==========================================
// 6. WAREHOUSE TRANSFERS
// ==========================================

export const getWarehouseTransfers = asyncHandler(async (req, res) => {
  const { status, sourceWarehouse, destinationWarehouse, page = 1, limit = 20 } = req.query;
  const filter = {};

  if (status) filter.status = status;
  if (sourceWarehouse) filter.sourceWarehouse = sourceWarehouse;
  if (destinationWarehouse) filter.destinationWarehouse = destinationWarehouse;

  const p = Math.max(1, parseInt(page, 10));
  const l = Math.min(100, Math.max(1, parseInt(limit, 10)));
  const skip = (p - 1) * l;

  const [transfers, total] = await Promise.all([
    WarehouseTransfer.find(filter)
      .populate("sourceWarehouse", "name code city state")
      .populate("destinationWarehouse", "name code city state")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(l)
      .lean(),
    WarehouseTransfer.countDocuments(filter),
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      { transfers, total, page: p, pages: Math.ceil(total / l) },
      "Warehouse transfers fetched successfully"
    )
  );
});

export const createWarehouseTransfer = asyncHandler(async (req, res) => {
  const { sourceWarehouseId, destinationWarehouseId, items, notes, trackingRef, vehicleNumber } = req.body;

  if (!sourceWarehouseId || !destinationWarehouseId || !Array.isArray(items) || items.length === 0) {
    throw new ApiError(400, "Source warehouse, destination warehouse, and items are required.");
  }

  if (String(sourceWarehouseId) === String(destinationWarehouseId)) {
    throw new ApiError(400, "Source and destination warehouses cannot be the same.");
  }

  const [sourceWh, destWh] = await Promise.all([
    Warehouse.findById(sourceWarehouseId),
    Warehouse.findById(destinationWarehouseId),
  ]);

  if (!sourceWh) throw new ApiError(404, "Source warehouse not found.");
  if (!destWh) throw new ApiError(404, "Destination warehouse not found.");

  const formattedItems = [];
  for (const item of items) {
    const qty = parseInt(item.requestedQty, 10);
    if (!item.productId || isNaN(qty) || qty <= 0) {
      throw new ApiError(400, "Each item must have a valid productId and requestedQty > 0.");
    }

    const [product, srcInv] = await Promise.all([
      Product.findById(item.productId),
      Inventory.findOne({ product: item.productId, warehouse: sourceWh._id }),
    ]);

    if (!product) throw new ApiError(404, `Product not found: ${item.productId}`);

    const avail = srcInv ? Math.max(0, (srcInv.onHand || 0) - (srcInv.reserved || 0)) : 0;
    if (avail < qty) {
      throw new ApiError(
        400,
        `Cannot transfer ${qty} units of '${product.name}'. Only ${avail} units available at ${sourceWh.code}.`
      );
    }

    formattedItems.push({
      product: product._id,
      productName: product.name,
      sku: srcInv?.sku || product.productCode || `ARCL-${String(product.slug).toUpperCase()}`,
      requestedQty: qty,
      dispatchedQty: 0,
      receivedQty: 0,
      damagedQty: 0,
      notes: item.notes || "",
    });
  }

  const count = await WarehouseTransfer.countDocuments();
  const year = new Date().getFullYear();
  const transferNumber = `TR-${year}-${String(count + 1).padStart(4, "0")}`;

  const transfer = await WarehouseTransfer.create({
    transferNumber,
    sourceWarehouse: sourceWh._id,
    sourceWarehouseCode: sourceWh.code,
    sourceWarehouseName: sourceWh.name,
    destinationWarehouse: destWh._id,
    destinationWarehouseCode: destWh.code,
    destinationWarehouseName: destWh.name,
    items: formattedItems,
    status: "DRAFT",
    trackingRef: trackingRef?.trim() || "",
    vehicleNumber: vehicleNumber?.trim() || "",
    notes: notes?.trim() || "",
    createdBy: req.user?.name || "Authorized Admin",
  });

  return res.status(201).json(new ApiResponse(201, transfer, `Transfer order ${transferNumber} created in Draft status.`));
});

// Dispatch Transfer: Deducts from source warehouse and puts into in-transit
export const dispatchWarehouseTransfer = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { trackingRef, vehicleNumber, dispatchNotes } = req.body;

  const transfer = await WarehouseTransfer.findById(id);
  if (!transfer) throw new ApiError(404, "Warehouse transfer not found.");

  if (transfer.status !== "DRAFT" && transfer.status !== "APPROVED") {
    throw new ApiError(400, `Cannot dispatch transfer in '${transfer.status}' status.`);
  }

  // Deduct dispatched quantities from source warehouse onHand atomically
  for (const item of transfer.items) {
    const qty = item.requestedQty;
    const inv = await Inventory.findOne({ product: item.product, warehouse: transfer.sourceWarehouse });

    const avail = inv ? Math.max(0, (inv.onHand || 0) - (inv.reserved || 0)) : 0;
    if (avail < qty) {
      throw new ApiError(
        400,
        `Insufficient available stock for '${item.productName}' at source warehouse. Available: ${avail}, Requested: ${qty}`
      );
    }

    const prevOnHand = inv.onHand || 0;
    const updated = await Inventory.findOneAndUpdate(
      { _id: inv._id, onHand: { $gte: qty } },
      { $inc: { onHand: -qty }, $set: { lastMovementDate: new Date() } },
      { new: true }
    );

    if (!updated) {
      throw new ApiError(409, `Stock conflict while dispatching '${item.productName}'. Please retry.`);
    }

    item.dispatchedQty = qty;

    await StockMovement.create({
      inventory: inv._id,
      product: item.product,
      productName: item.productName,
      sku: item.sku,
      warehouse: transfer.sourceWarehouse,
      warehouseCode: transfer.sourceWarehouseCode,
      movementType: "TRANSFER_DISPATCH",
      quantity: -qty,
      balanceBefore: prevOnHand,
      balanceAfter: prevOnHand - qty,
      referenceType: "WAREHOUSE_TRANSFER",
      referenceId: transfer.transferNumber,
      reason: `Inter-warehouse transfer dispatch to ${transfer.destinationWarehouseCode}`,
      notes: dispatchNotes || `Tracking: ${trackingRef || "N/A"}`,
      performedBy: req.user?._id || null,
      performedByName: req.user?.name || "Dispatch Officer",
    });

    await checkAndSyncAlert(updated);
  }

  transfer.status = "DISPATCHED";
  transfer.dispatchedAt = new Date();
  transfer.dispatchedBy = req.user?.name || "Authorized Dispatcher";
  if (trackingRef) transfer.trackingRef = trackingRef.trim();
  if (vehicleNumber) transfer.vehicleNumber = vehicleNumber.trim();
  if (dispatchNotes) transfer.dispatchNotes = dispatchNotes.trim();

  await transfer.save();

  return res.status(200).json(
    new ApiResponse(
      200,
      transfer,
      `Transfer ${transfer.transferNumber} marked DISPATCHED. Goods are now in transit.`
    )
  );
});

// Receive Transfer: Adds accepted goods into destination warehouse stock
export const receiveWarehouseTransfer = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { itemsReceived, receivingNotes } = req.body;

  if (!Array.isArray(itemsReceived) || itemsReceived.length === 0) {
    throw new ApiError(400, "Items received details are required.");
  }

  const transfer = await WarehouseTransfer.findById(id);
  if (!transfer) throw new ApiError(404, "Warehouse transfer not found.");

  if (transfer.status !== "DISPATCHED" && transfer.status !== "PARTIALLY_RECEIVED") {
    throw new ApiError(400, `Cannot receive transfer in '${transfer.status}' status.`);
  }

  let allCompleted = true;

  for (const rec of itemsReceived) {
    const item = transfer.items.id(rec.itemId) || transfer.items.find((i) => String(i.product) === String(rec.productId));
    if (!item) continue;

    const accepted = Math.max(0, parseInt(rec.acceptedQty, 10) || 0);
    const damaged = Math.max(0, parseInt(rec.damagedQty, 10) || 0);
    const total = accepted + damaged;

    if (total <= 0) continue;

    const remaining = item.dispatchedQty - item.receivedQty;
    if (total > remaining) {
      throw new ApiError(
        400,
        `Cannot receive ${total} units for '${item.productName}'. Remaining in-transit: ${remaining}.`
      );
    }

    item.receivedQty += accepted;
    item.damagedQty += damaged;

    // Destination Inventory update
    let destInv = await Inventory.findOne({ product: item.product, warehouse: transfer.destinationWarehouse });
    if (!destInv) {
      destInv = await Inventory.create({
        product: item.product,
        productName: item.productName,
        sku: item.sku,
        warehouse: transfer.destinationWarehouse,
        warehouseCode: transfer.destinationWarehouseCode,
        warehouseName: transfer.destinationWarehouseName,
        onHand: 0,
        reserved: 0,
        incoming: 0,
        damaged: 0,
        unitCost: 0,
      });
    }

    const prevOnHand = destInv.onHand || 0;
    const updatedDest = await Inventory.findOneAndUpdate(
      { _id: destInv._id },
      {
        $inc: { onHand: accepted, damaged: damaged },
        $set: { lastMovementDate: new Date() },
      },
      { new: true }
    );

    if (accepted > 0) {
      await StockMovement.create({
        inventory: destInv._id,
        product: item.product,
        productName: item.productName,
        sku: item.sku,
        warehouse: transfer.destinationWarehouse,
        warehouseCode: transfer.destinationWarehouseCode,
        movementType: "TRANSFER_RECEIPT",
        quantity: accepted,
        balanceBefore: prevOnHand,
        balanceAfter: prevOnHand + accepted,
        referenceType: "WAREHOUSE_TRANSFER",
        referenceId: transfer.transferNumber,
        reason: `Transfer received from ${transfer.sourceWarehouseCode}`,
        notes: receivingNotes || "Goods accepted into destination stock.",
        performedBy: req.user?._id || null,
        performedByName: req.user?.name || "Receiving Officer",
      });
    }

    if (damaged > 0) {
      await StockMovement.create({
        inventory: destInv._id,
        product: item.product,
        productName: item.productName,
        sku: item.sku,
        warehouse: transfer.destinationWarehouse,
        warehouseCode: transfer.destinationWarehouseCode,
        movementType: "DAMAGE_QUARANTINE",
        quantity: damaged,
        balanceBefore: prevOnHand + accepted,
        balanceAfter: prevOnHand + accepted,
        referenceType: "WAREHOUSE_TRANSFER",
        referenceId: transfer.transferNumber,
        reason: "In-Transit Damage on Transfer",
        notes: `Damaged during transfer. Placed in quarantine: ${damaged} units.`,
        performedBy: req.user?._id || null,
        performedByName: req.user?.name || "Receiving Officer",
      });
    }

    await checkAndSyncAlert(updatedDest);

    if (item.receivedQty < item.dispatchedQty) {
      allCompleted = false;
    }
  }

  transfer.status = allCompleted ? "RECEIVED" : "PARTIALLY_RECEIVED";
  transfer.receivedAt = new Date();
  transfer.receivedBy = req.user?.name || "Authorized Receiving Officer";
  if (receivingNotes) transfer.receivingNotes = receivingNotes.trim();

  await transfer.save();

  return res.status(200).json(
    new ApiResponse(
      200,
      transfer,
      `Transfer ${transfer.transferNumber} received. Status: ${transfer.status}.`
    )
  );
});

// ==========================================
// 7. SALES ORDERS & INTEGRATION WORKFLOW
// ==========================================

export const getSalesOrders = asyncHandler(async (req, res) => {
  const { status, warehouse, search, page = 1, limit = 20 } = req.query;
  const filter = {};

  if (status) filter.status = status;
  if (warehouse) filter.warehouse = warehouse;
  if (search) {
    filter.$or = [
      { orderNumber: { $regex: search, $options: "i" } },
      { customerName: { $regex: search, $options: "i" } },
      { company: { $regex: search, $options: "i" } },
      { gstin: { $regex: search, $options: "i" } },
    ];
  }

  const p = Math.max(1, parseInt(page, 10));
  const l = Math.min(100, Math.max(1, parseInt(limit, 10)));
  const skip = (p - 1) * l;

  const [orders, total] = await Promise.all([
    SalesOrder.find(filter)
      .populate("warehouse", "name code city state")
      .populate("inquiry", "customerName email phone")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(l)
      .lean(),
    SalesOrder.countDocuments(filter),
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      { orders, total, page: p, pages: Math.ceil(total / l) },
      "Sales orders fetched successfully"
    )
  );
});

export const createSalesOrder = asyncHandler(async (req, res) => {
  const { inquiryId, customerName, customerEmail, customerPhone, company, shippingAddress, city, state, pincode, gstin, warehouseId, items, notes } = req.body;

  if (!customerName || !Array.isArray(items) || items.length === 0) {
    throw new ApiError(400, "Customer name and order items are required.");
  }

  let wh;
  if (warehouseId) {
    wh = await Warehouse.findById(warehouseId);
  } else {
    wh = await getDefaultWarehouse();
  }
  if (!wh) throw new ApiError(400, "Valid active warehouse is required.");

  const year = new Date().getFullYear();
  const count = await SalesOrder.countDocuments();
  const orderNumber = `SO-${year}-${String(count + 1).padStart(4, "0")}`;

  let subtotal = 0;
  let taxAmount = 0;
  const formattedItems = [];

  for (const item of items) {
    const qty = parseInt(item.qty, 10);
    if (!item.productId || isNaN(qty) || qty <= 0) {
      throw new ApiError(400, "Each item must have a valid productId and quantity > 0.");
    }
    const product = await Product.findById(item.productId);
    if (!product) throw new ApiError(404, `Product not found: ${item.productId}`);

    const unitPrice = Math.max(0, parseFloat(item.unitPrice) || 0);
    const taxRate = item.taxRate !== undefined ? parseFloat(item.taxRate) : 18;
    const itemSub = unitPrice * qty;
    const itemTax = (itemSub * taxRate) / 100;

    subtotal += itemSub;
    taxAmount += itemTax;

    formattedItems.push({
      product: product._id,
      productName: product.name,
      sku: product.productCode || `ARCL-${String(product.slug).toUpperCase()}`,
      qty,
      unitPrice,
      taxRate,
      totalAmount: itemSub + itemTax,
      dispatchedQty: 0,
      returnedQty: 0,
      damagedReturnQty: 0,
    });
  }

  const order = await SalesOrder.create({
    orderNumber,
    inquiry: inquiryId || null,
    customerName: customerName.trim(),
    customerEmail: customerEmail?.trim().toLowerCase() || "",
    customerPhone: customerPhone?.trim() || "",
    company: company?.trim() || "",
    shippingAddress: shippingAddress?.trim() || "",
    city: city?.trim() || "",
    state: state?.trim() || "Maharashtra",
    pincode: pincode?.trim() || "",
    gstin: (gstin || "").trim().toUpperCase(),
    warehouse: wh._id,
    items: formattedItems,
    subtotal,
    taxAmount,
    totalAmount: subtotal + taxAmount,
    status: "PENDING",
    isStockReserved: false,
    isStockDeducted: false,
    notes: notes?.trim() || "",
    createdBy: req.user?.name || "Sales Admin",
  });

  return res.status(201).json(new ApiResponse(201, order, `Sales Order ${orderNumber} created in Pending status.`));
});

// Confirm Sales Order: Reserves Stock Idempotently
export const confirmSalesOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const order = await SalesOrder.findById(id);
  if (!order) throw new ApiError(404, "Sales Order not found.");

  if (order.isStockReserved) {
    return res.status(200).json(new ApiResponse(200, order, "Order is already confirmed and stock reserved."));
  }

  // Check stock availability and reserve
  for (const item of order.items) {
    const inv = await Inventory.findOne({ product: item.product, warehouse: order.warehouse });
    const avail = inv ? Math.max(0, (inv.onHand || 0) - (inv.reserved || 0)) : 0;

    if (avail < item.qty) {
      throw new ApiError(
        400,
        `Cannot confirm order: Insufficient stock for '${item.productName}'. Available: ${avail}, Required: ${item.qty}.`
      );
    }

    const prevReserved = inv.reserved || 0;
    const updated = await Inventory.findOneAndUpdate(
      { _id: inv._id },
      {
        $inc: { reserved: item.qty },
        $set: { lastMovementDate: new Date() },
      },
      { new: true }
    );

    await StockMovement.create({
      inventory: inv._id,
      product: item.product,
      productName: item.productName,
      sku: item.sku,
      warehouse: order.warehouse,
      warehouseCode: inv.warehouseCode,
      movementType: "SALES_RESERVATION",
      quantity: 0,
      balanceBefore: inv.onHand || 0,
      balanceAfter: inv.onHand || 0,
      reservedBefore: prevReserved,
      reservedAfter: prevReserved + item.qty,
      referenceType: "SALES_ORDER",
      referenceId: order.orderNumber,
      reason: `Order Confirmation Stock Hold for ${order.customerName}`,
      performedBy: req.user?._id || null,
      performedByName: req.user?.name || "Sales Admin",
    });

    await checkAndSyncAlert(updated);
  }

  order.status = "CONFIRMED";
  order.isStockReserved = true;
  await order.save();

  return res.status(200).json(new ApiResponse(200, order, `Sales Order ${order.orderNumber} confirmed. Stock reserved.`));
});

// Dispatch Sales Order: Deducts onHand and Releases Reservation in one atomic operation
export const dispatchSalesOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { courier, trackingNo, notes } = req.body;

  const order = await SalesOrder.findById(id);
  if (!order) throw new ApiError(404, "Sales Order not found.");

  if (order.isStockDeducted) {
    return res.status(200).json(new ApiResponse(200, order, "Order has already been dispatched."));
  }

  for (const item of order.items) {
    const inv = await Inventory.findOne({ product: item.product, warehouse: order.warehouse });
    if (!inv) throw new ApiError(404, `Inventory record missing for ${item.productName}`);

    const prevOnHand = inv.onHand || 0;
    const prevReserved = inv.reserved || 0;
    const reservedToRelease = order.isStockReserved ? item.qty : 0;

    const updated = await Inventory.findOneAndUpdate(
      { _id: inv._id, onHand: { $gte: item.qty } },
      {
        $inc: {
          onHand: -item.qty,
          reserved: -reservedToRelease,
        },
        $set: { lastMovementDate: new Date() },
      },
      { new: true }
    );

    if (!updated) {
      throw new ApiError(409, `Insufficient on-hand stock to dispatch '${item.productName}'.`);
    }

    item.dispatchedQty = item.qty;

    await StockMovement.create({
      inventory: inv._id,
      product: item.product,
      productName: item.productName,
      sku: item.sku,
      warehouse: order.warehouse,
      warehouseCode: inv.warehouseCode,
      movementType: "SALES_DISPATCH",
      quantity: -item.qty,
      balanceBefore: prevOnHand,
      balanceAfter: prevOnHand - item.qty,
      reservedBefore: prevReserved,
      reservedAfter: Math.max(0, prevReserved - reservedToRelease),
      referenceType: "SALES_ORDER",
      referenceId: order.orderNumber,
      reason: `Customer Dispatch to ${order.customerName}`,
      notes: notes || `Courier: ${courier || "Direct Dispatch"}, AWB: ${trackingNo || "N/A"}`,
      performedBy: req.user?._id || null,
      performedByName: req.user?.name || "Dispatch Officer",
    });

    await checkAndSyncAlert(updated);
  }

  order.status = "DISPATCHED";
  order.isStockDeducted = true;
  order.isStockReserved = false;
  order.dispatchDetails = {
    dispatchedAt: new Date(),
    dispatchedBy: req.user?.name || "Authorized Dispatcher",
    courier: courier || "",
    trackingNo: trackingNo || "",
    notes: notes || "",
  };

  await order.save();

  return res.status(200).json(new ApiResponse(200, order, `Sales Order ${order.orderNumber} dispatched successfully.`));
});

// Cancel Sales Order: Releases Reservation
export const cancelSalesOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  const order = await SalesOrder.findById(id);
  if (!order) throw new ApiError(404, "Sales Order not found.");

  if (order.status === "DISPATCHED") {
    throw new ApiError(400, "Cannot cancel an already dispatched order. Use Return process instead.");
  }

  if (order.isStockReserved) {
    for (const item of order.items) {
      const inv = await Inventory.findOne({ product: item.product, warehouse: order.warehouse });
      if (inv) {
        const prevReserved = inv.reserved || 0;
        const updated = await Inventory.findOneAndUpdate(
          { _id: inv._id },
          {
            $inc: { reserved: -item.qty },
            $set: { lastMovementDate: new Date() },
          },
          { new: true }
        );

        await StockMovement.create({
          inventory: inv._id,
          product: item.product,
          productName: item.productName,
          sku: item.sku,
          warehouse: order.warehouse,
          warehouseCode: inv.warehouseCode,
          movementType: "SALES_CANCEL_RELEASE",
          quantity: 0,
          balanceBefore: inv.onHand || 0,
          balanceAfter: inv.onHand || 0,
          reservedBefore: prevReserved,
          reservedAfter: Math.max(0, prevReserved - item.qty),
          referenceType: "SALES_ORDER",
          referenceId: order.orderNumber,
          reason: `Order Cancellation: ${reason || "Customer cancelled"}`,
          performedBy: req.user?._id || null,
          performedByName: req.user?.name || "Sales Admin",
        });

        await checkAndSyncAlert(updated);
      }
    }
  }

  order.status = "CANCELLED";
  order.isStockReserved = false;
  order.notes = `${order.notes ? order.notes + " | " : ""}Cancelled: ${reason || "Cancelled by user"}`;
  await order.save();

  return res.status(200).json(new ApiResponse(200, order, `Sales Order ${order.orderNumber} cancelled and reservations released.`));
});

// Process Sales Return
export const processSalesReturn = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { returnedItems, reason, notes } = req.body;

  if (!Array.isArray(returnedItems) || returnedItems.length === 0) {
    throw new ApiError(400, "Returned items details are required.");
  }

  const order = await SalesOrder.findById(id);
  if (!order) throw new ApiError(404, "Sales Order not found.");

  if (!order.isStockDeducted) {
    throw new ApiError(400, "Returns can only be processed on dispatched orders.");
  }

  for (const ret of returnedItems) {
    const item = order.items.id(ret.itemId) || order.items.find((i) => String(i.product) === String(ret.productId));
    if (!item) continue;

    const restock = Math.max(0, parseInt(ret.restockQty, 10) || 0);
    const damaged = Math.max(0, parseInt(ret.damagedQty, 10) || 0);
    const totalRet = restock + damaged;

    if (totalRet <= 0) continue;

    item.returnedQty += restock;
    item.damagedReturnQty += damaged;

    const inv = await Inventory.findOne({ product: item.product, warehouse: order.warehouse });
    if (inv) {
      const prevOnHand = inv.onHand || 0;
      const updated = await Inventory.findOneAndUpdate(
        { _id: inv._id },
        {
          $inc: { onHand: restock, damaged: damaged },
          $set: { lastMovementDate: new Date() },
        },
        { new: true }
      );

      if (restock > 0) {
        await StockMovement.create({
          inventory: inv._id,
          product: item.product,
          productName: item.productName,
          sku: item.sku,
          warehouse: order.warehouse,
          warehouseCode: inv.warehouseCode,
          movementType: "RETURN_RESTOCK",
          quantity: restock,
          balanceBefore: prevOnHand,
          balanceAfter: prevOnHand + restock,
          referenceType: "SALES_ORDER",
          referenceId: order.orderNumber,
          reason: `Customer Return Restock: ${reason || "Verified intact"}`,
          notes: notes || "",
          performedBy: req.user?._id || null,
          performedByName: req.user?.name || "Quality Inspection Officer",
        });
      }

      if (damaged > 0) {
        await StockMovement.create({
          inventory: inv._id,
          product: item.product,
          productName: item.productName,
          sku: item.sku,
          warehouse: order.warehouse,
          warehouseCode: inv.warehouseCode,
          movementType: "DAMAGE_QUARANTINE",
          quantity: damaged,
          balanceBefore: prevOnHand + restock,
          balanceAfter: prevOnHand + restock,
          referenceType: "SALES_ORDER",
          referenceId: order.orderNumber,
          reason: `Customer Return Damaged: ${reason || "Transit damage reported"}`,
          notes: notes || "Quarantined in damaged stock bay.",
          performedBy: req.user?._id || null,
          performedByName: req.user?.name || "Quality Inspection Officer",
        });
      }

      await checkAndSyncAlert(updated);
    }
  }

  order.status = "RETURNED";
  order.returnDetails = {
    returnedAt: new Date(),
    reason: reason || "Customer return",
    inspectedBy: req.user?.name || "Quality Inspector",
    notes: notes || "",
  };

  await order.save();

  return res.status(200).json(new ApiResponse(200, order, `Return for order ${order.orderNumber} successfully processed.`));
});

// ==========================================
// 8. LOW-STOCK & OUT-OF-STOCK ALERTS
// ==========================================

export const getAlerts = asyncHandler(async (req, res) => {
  const { status = "ACTIVE", alertType, severity, warehouseId, page = 1, limit = 25 } = req.query;
  const filter = {};

  if (status && status !== "ALL") filter.status = status;
  if (alertType) filter.alertType = alertType;
  if (severity) filter.severity = severity;
  if (warehouseId) filter.warehouse = warehouseId;

  const p = Math.max(1, parseInt(page, 10));
  const l = Math.min(100, Math.max(1, parseInt(limit, 10)));
  const skip = (p - 1) * l;

  const [alerts, total] = await Promise.all([
    InventoryAlert.find(filter)
      .populate("product", "name slug images productCode")
      .populate("warehouse", "name code city state")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(l)
      .lean(),
    InventoryAlert.countDocuments(filter),
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      { alerts, total, page: p, pages: Math.ceil(total / l) },
      "Alerts fetched successfully"
    )
  );
});

export const acknowledgeAlert = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const alert = await InventoryAlert.findById(id);
  if (!alert) throw new ApiError(404, "Alert not found.");

  alert.status = "ACKNOWLEDGED";
  alert.acknowledgedBy = req.user?.name || "Authorized Inventory Officer";
  alert.acknowledgedAt = new Date();
  await alert.save();

  return res.status(200).json(new ApiResponse(200, alert, "Alert acknowledged successfully"));
});

export const resolveAlert = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { resolutionNotes } = req.body;

  const alert = await InventoryAlert.findById(id);
  if (!alert) throw new ApiError(404, "Alert not found.");

  alert.status = "RESOLVED";
  alert.resolvedBy = req.user?.name || "Authorized Inventory Officer";
  alert.resolvedAt = new Date();
  alert.resolutionNotes = resolutionNotes?.trim() || "Manually resolved by administrator.";
  await alert.save();

  return res.status(200).json(new ApiResponse(200, alert, "Alert resolved successfully"));
});

// One-click Reorder: Generate Draft PO from Alert
export const generateReorderPOFromAlert = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const alert = await InventoryAlert.findById(id).populate("product");
  if (!alert) throw new ApiError(404, "Alert not found.");

  const inventory = await Inventory.findOne({ product: alert.product, warehouse: alert.warehouse });
  const reorderQty = inventory?.reorderQty || 10;
  const estimatedCost = inventory?.unitCost || 0;

  // Find default or first active supplier
  let supplier = await Supplier.findOne({ isActive: true });
  if (!supplier) {
    supplier = await Supplier.create({
      code: "SUP-DEFAULT",
      name: "Primary Equipment & Components Supplier",
      contactPerson: "Vendor Representative",
      email: "supplier@arclinstruments.com",
      phone: "+91-9820000000",
      city: "Navi Mumbai",
      state: "Maharashtra",
      notes: "Auto-created supplier for reorder generation.",
    });
  }

  const year = new Date().getFullYear();
  const count = await PurchaseOrder.countDocuments();
  const poNumber = `PO-${year}-${String(count + 1).padStart(4, "0")}`;

  const subtotal = reorderQty * estimatedCost;
  const taxAmount = (subtotal * 18) / 100;

  const po = await PurchaseOrder.create({
    poNumber,
    supplier: supplier._id,
    supplierName: supplier.name,
    supplierGstin: supplier.gstin || "",
    destinationWarehouse: alert.warehouse,
    warehouseCode: alert.warehouseCode,
    orderDate: new Date(),
    expectedDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days ahead
    status: "DRAFT",
    items: [
      {
        product: alert.product._id,
        productName: alert.productName,
        sku: alert.sku,
        orderedQty: reorderQty,
        receivedQty: 0,
        damagedQty: 0,
        unitPrice: estimatedCost,
        taxRate: 18,
        taxAmount,
        totalAmount: subtotal + taxAmount,
        notes: `Generated from ${alert.alertType} alert.`,
      },
    ],
    subtotal,
    taxAmount,
    totalAmount: subtotal + taxAmount,
    notes: `Auto-generated Draft Reorder from Alert ID: ${alert._id}`,
    createdBy: req.user?.name || "System Reorder Workflow",
  });

  alert.status = "ACKNOWLEDGED";
  alert.acknowledgedBy = req.user?.name || "Auto-Reorder Engine";
  alert.acknowledgedAt = new Date();
  await alert.save();

  return res.status(201).json(new ApiResponse(201, po, `Draft PO ${poNumber} generated successfully for ${reorderQty} units.`));
});

// ==========================================
// 9. DASHBOARD STATS & REALTIME KPIs
// ==========================================

export const getInventoryDashboardStats = asyncHandler(async (req, res) => {
  await ensureDefaultWarehouses();

  // Parallel database queries for real persisted values
  const [
    totalProducts,
    totalWarehouses,
    totalSuppliers,
    activeAlertsCount,
    pendingPOsCount,
    pendingTransfersCount,
    stockAgg,
  ] = await Promise.all([
    Product.countDocuments({ isActive: true }),
    Warehouse.countDocuments({ isActive: true }),
    Supplier.countDocuments({ isActive: true }),
    InventoryAlert.countDocuments({ status: "ACTIVE" }),
    PurchaseOrder.countDocuments({ status: { $in: ["ORDERED", "PARTIALLY_RECEIVED", "PENDING_APPROVAL"] } }),
    WarehouseTransfer.countDocuments({ status: "DISPATCHED" }),
    Inventory.aggregate([
      {
        $group: {
          _id: null,
          totalSkus: { $sum: 1 },
          totalOnHand: { $sum: "$onHand" },
          totalReserved: { $sum: "$reserved" },
          totalIncoming: { $sum: "$incoming" },
          totalDamaged: { $sum: "$damaged" },
          totalValuation: { $sum: { $multiply: ["$onHand", "$unitCost"] } },
          lowStockCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $gt: [{ $subtract: ["$onHand", "$reserved"] }, 0] },
                    { $lte: [{ $subtract: ["$onHand", "$reserved"] }, "$minThreshold"] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          outOfStockCount: {
            $sum: {
              $cond: [{ $lte: [{ $subtract: ["$onHand", "$reserved"] }, 0] }, 1, 0],
            },
          },
        },
      },
    ]),
  ]);

  const stockData = stockAgg[0] || {
    totalSkus: 0,
    totalOnHand: 0,
    totalReserved: 0,
    totalIncoming: 0,
    totalDamaged: 0,
    totalValuation: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
  };

  const totalAvailable = Math.max(0, stockData.totalOnHand - stockData.totalReserved);

  // Recent 10 movements for quick audit panel
  const recentMovements = await StockMovement.find()
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();

  // Top critical alerts
  const criticalAlerts = await InventoryAlert.find({ status: "ACTIVE" })
    .sort({ severity: 1, createdAt: -1 })
    .limit(5)
    .lean();

  const stats = {
    totalCatalogProducts: totalProducts,
    totalInventorySkus: stockData.totalSkus,
    totalOnHandUnits: stockData.totalOnHand,
    totalAvailableUnits: totalAvailable,
    totalReservedUnits: stockData.totalReserved,
    totalIncomingUnits: stockData.totalIncoming,
    totalDamagedUnits: stockData.totalDamaged,
    totalInventoryValuation: Math.round(stockData.totalValuation),
    lowStockProductsCount: stockData.lowStockCount,
    outOfStockProductsCount: stockData.outOfStockCount,
    activeAlertsCount,
    pendingPurchaseOrdersCount: pendingPOsCount,
    pendingTransfersInTransitCount: pendingTransfersCount,
    totalActiveWarehouses: totalWarehouses,
    totalActiveSuppliers: totalSuppliers,
    recentMovements,
    criticalAlerts,
  };

  return res.status(200).json(new ApiResponse(200, stats, "Dashboard statistics calculated from persisted records."));
});

// ==========================================
// 10. INVENTORY REPORTS & DATASET
// ==========================================

export const getInventoryReport = asyncHandler(async (req, res) => {
  const { reportType = "STOCK_VALUATION", warehouseId, categoryId, startDate, endDate } = req.query;

  const filter = {};
  if (warehouseId) filter.warehouse = warehouseId;
  if (categoryId) filter.category = categoryId;

  let reportData = [];

  switch (reportType) {
    case "COMBINED_STOCK_REGISTER":
    case "SALES_PURCHASE_STOCK_SUMMARY": {
      const items = await Inventory.find(filter)
        .populate("product", "name productCode slug price")
        .populate("warehouse", "name code city")
        .populate("category", "name")
        .sort({ onHand: -1 })
        .lean();

      // Aggregate all StockMovement for all these inventory IDs
      const invIds = items.map((i) => i._id);
      const movementStats = await StockMovement.aggregate([
        { $match: { inventory: { $in: invIds } } },
        {
          $group: {
            _id: { inventory: "$inventory", type: "$movementType" },
            totalQty: { $sum: "$quantity" },
            lastDate: { $max: "$createdAt" },
            count: { $sum: 1 },
          },
        },
      ]);

      const statMap = {};
      movementStats.forEach((st) => {
        const invIdStr = String(st._id.inventory);
        if (!statMap[invIdStr]) {
          statMap[invIdStr] = {
            purchasedQty: 0,
            soldQty: 0,
            openingQty: 0,
            lastPurchaseDate: null,
            lastSaleDate: null,
          };
        }
        if (st._id.type === "PURCHASE_RECEIPT") {
          statMap[invIdStr].purchasedQty += Math.abs(st.totalQty || 0);
          if (!statMap[invIdStr].lastPurchaseDate || st.lastDate > statMap[invIdStr].lastPurchaseDate) {
            statMap[invIdStr].lastPurchaseDate = st.lastDate;
          }
        } else if (st._id.type === "SALES_DISPATCH") {
          statMap[invIdStr].soldQty += Math.abs(st.totalQty || 0);
          if (!statMap[invIdStr].lastSaleDate || st.lastDate > statMap[invIdStr].lastSaleDate) {
            statMap[invIdStr].lastSaleDate = st.lastDate;
          }
        } else if (st._id.type === "OPENING_STOCK") {
          statMap[invIdStr].openingQty += Math.abs(st.totalQty || 0);
        }
      });

      reportData = items.map((i) => {
        const invIdStr = String(i._id);
        const st = statMap[invIdStr] || { purchasedQty: 0, soldQty: 0, openingQty: 0, lastPurchaseDate: null, lastSaleDate: null };
        const avail = Math.max(0, (i.onHand || 0) - (i.reserved || 0));
        const cost = i.unitCost || 0;
        const sellPrice = i.sellingPrice || i.product?.price || 0;
        const val = (i.onHand || 0) * cost;

        return {
          inventoryId: i._id,
          sku: i.sku,
          productName: i.productName,
          category: i.categoryName || i.category?.name || "General Lab Equipment",
          warehouse: i.warehouseCode || i.warehouse?.code,
          warehouseName: i.warehouseName || i.warehouse?.name,
          openingStock: st.openingQty,
          purchasedQty: st.purchasedQty,
          soldQty: st.soldQty,
          onHand: i.onHand || 0,
          reserved: i.reserved || 0,
          available: avail,
          damaged: i.damaged || 0,
          unitCost: cost,
          sellingPrice: sellPrice,
          totalValuation: val,
          status: i.status,
          bin: i.locationBin || "BAY-1",
          lastPurchaseDate: st.lastPurchaseDate,
          lastSaleDate: st.lastSaleDate,
          lastMovementDate: i.lastMovementDate,
        };
      });
      break;
    }

    case "STOCK_VALUATION": {
      const items = await Inventory.find(filter)
        .populate("product", "name productCode slug")
        .populate("warehouse", "name code city")
        .populate("category", "name")
        .sort({ onHand: -1 })
        .lean();

      reportData = items.map((i) => {
        const avail = Math.max(0, (i.onHand || 0) - (i.reserved || 0));
        const cost = i.unitCost || 0;
        const val = (i.onHand || 0) * cost;
        return {
          sku: i.sku,
          productName: i.productName,
          category: i.categoryName || i.category?.name || "General",
          warehouse: i.warehouseCode || i.warehouse?.code,
          onHand: i.onHand || 0,
          reserved: i.reserved || 0,
          available: avail,
          damaged: i.damaged || 0,
          unitCost: cost,
          totalValuation: val,
          status: i.status,
          bin: i.locationBin || "BAY-1",
        };
      });
      break;
    }

    case "LOW_STOCK": {
      const items = await Inventory.find({
        ...filter,
        $expr: { $lte: [{ $subtract: ["$onHand", "$reserved"] }, "$minThreshold"] },
      })
        .populate("warehouse", "name code")
        .sort({ onHand: 1 })
        .lean();

      reportData = items.map((i) => ({
        sku: i.sku,
        productName: i.productName,
        warehouse: i.warehouseCode || i.warehouse?.code,
        onHand: i.onHand,
        reserved: i.reserved,
        available: Math.max(0, i.onHand - i.reserved),
        minThreshold: i.minThreshold,
        reorderQty: i.reorderQty,
        deficit: Math.max(0, i.minThreshold - Math.max(0, i.onHand - i.reserved)),
        status: i.status,
      }));
      break;
    }

    case "MOVEMENTS_HISTORY": {
      const movFilter = {};
      if (warehouseId) movFilter.warehouse = warehouseId;
      if (startDate || endDate) {
        movFilter.createdAt = {};
        if (startDate) movFilter.createdAt.$gte = new Date(startDate);
        if (endDate) {
          const e = new Date(endDate);
          e.setHours(23, 59, 59, 999);
          movFilter.createdAt.$lte = e;
        }
      }

      const movements = await StockMovement.find(movFilter)
        .sort({ createdAt: -1 })
        .limit(500)
        .lean();

      reportData = movements.map((m) => ({
        date: m.createdAt,
        sku: m.sku,
        productName: m.productName,
        warehouse: m.warehouseCode,
        type: m.movementType,
        quantity: m.quantity,
        balanceBefore: m.balanceBefore,
        balanceAfter: m.balanceAfter,
        referenceId: m.referenceId,
        reason: m.reason,
        performedBy: m.performedByName,
      }));
      break;
    }

    default:
      throw new ApiError(400, "Invalid report type.");
  }

  // Calculate high-level summary metrics
  const summary = {
    totalSkus: reportData.length,
    totalOnHandUnits: reportData.reduce((s, r) => s + (Number(r.onHand) || 0), 0),
    totalAvailableUnits: reportData.reduce((s, r) => s + (Number(r.available) || 0), 0),
    totalPurchasedUnits: reportData.reduce((s, r) => s + (Number(r.purchasedQty) || 0), 0),
    totalSoldUnits: reportData.reduce((s, r) => s + (Number(r.soldQty) || 0), 0),
    totalValuation: reportData.reduce((s, r) => s + (Number(r.totalValuation) || 0), 0),
    lowStockCount: reportData.filter((r) => r.status === "LOW_STOCK").length,
    outOfStockCount: reportData.filter((r) => r.status === "OUT_OF_STOCK").length,
  };

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        reportType,
        generatedAt: new Date(),
        totalRows: reportData.length,
        summary,
        data: reportData,
      },
      "Report generated successfully"
    )
  );
});

// One-click Auto-Sync all existing Purchases and Sales into Inventory
export const syncAllInventory = asyncHandler(async (req, res) => {
  const result = await syncAllExistingRecords();
  return res.status(200).json(
    new ApiResponse(
      200,
      result,
      `Inventory synchronized successfully! (Purchases inwarded: ${result.purchasesSynced}, Sales dispatched: ${result.salesSynced})`
    )
  );
});
