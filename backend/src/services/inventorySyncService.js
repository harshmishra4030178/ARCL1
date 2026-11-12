import mongoose from "mongoose";
import slugify from "slugify";
import Inventory from "../models/Inventory.js";
import StockMovement from "../models/StockMovement.js";
import Warehouse from "../models/Warehouse.js";
import Product from "../models/product.js";
import Category from "../models/category.js";
import EquipmentType from "../models/equipmentType.js";
import InventoryAlert from "../models/InventoryAlert.js";
import PurchaseRecord from "../models/PurchaseRecord.js";
import SalesSrf from "../models/SalesSrf.js";

// Helper: Ensure default warehouses exist
const ensureDefaultWarehouse = async () => {
  let wh = await Warehouse.findOne({ isDefault: true, isActive: true });
  if (!wh) {
    wh = await Warehouse.findOne({ isActive: true });
  }
  if (!wh) {
    wh = await Warehouse.create({
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
      notes: "Main precision assembly & calibration dispatch facility.",
    });
  }
  return wh;
};

// Helper: Match warehouse name or string to a Warehouse document
export const resolveWarehouse = async (warehouseIdentifier) => {
  if (!warehouseIdentifier) return ensureDefaultWarehouse();

  if (mongoose.Types.ObjectId.isValid(warehouseIdentifier)) {
    const wh = await Warehouse.findById(warehouseIdentifier);
    if (wh) return wh;
  }

  const str = String(warehouseIdentifier).trim();
  const escaped = str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const found = await Warehouse.findOne({
    $or: [
      { name: { $regex: escaped, $options: "i" } },
      { code: { $regex: escaped, $options: "i" } },
      { city: { $regex: escaped, $options: "i" } },
    ],
  });

  return found || ensureDefaultWarehouse();
};

// Helper: Check and synchronize Inventory Alert
export const checkAndSyncAlert = async (invRecord) => {
  try {
    const avail = Math.max(0, (invRecord.onHand || 0) - (invRecord.reserved || 0));
    const minThresh = invRecord.minThreshold || 5;

    if (avail === 0) {
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
      await InventoryAlert.findOneAndUpdate(
        { product: invRecord.product, warehouse: invRecord.warehouse, alertType: "LOW_STOCK", status: "ACTIVE" },
        {
          $set: {
            inventory: invRecord._id,
            productName: invRecord.productName,
            sku: invRecord.sku,
            warehouseCode: invRecord.warehouseCode,
            severity: "MEDIUM",
            currentStock: avail,
            minThreshold: minThresh,
            message: `WARNING: Product '${invRecord.productName}' (${invRecord.sku}) stock is LOW (${avail} units available, threshold: ${minThresh}) at ${invRecord.warehouseCode}.`,
          },
        },
        { upsert: true }
      );
    } else {
      await InventoryAlert.updateMany(
        { product: invRecord.product, warehouse: invRecord.warehouse, status: "ACTIVE" },
        { $set: { status: "RESOLVED", resolutionNotes: "Stock replenished above threshold." } }
      );
    }
  } catch (err) {
    console.warn("checkAndSyncAlert warning:", err.message);
  }
};

/**
 * Ensures a Product and its corresponding Warehouse Inventory item exist.
 * If not present in catalog, auto-registers it seamlessly!
 */
export const ensureProductAndInventory = async (item, warehouseDoc) => {
  const wh = warehouseDoc || (await ensureDefaultWarehouse());
  const rawName = (item.itemName || item.name || item.productName || "Lab Equipment Item").trim();
  const cleanEscaped = rawName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const providedSku = (item.sku || item.productCode || "").trim().toUpperCase();

  let product = null;

  // 1. Try match by product ID if passed
  if (item.product && mongoose.Types.ObjectId.isValid(item.product)) {
    product = await Product.findById(item.product).populate("category");
  } else if (item.productId && mongoose.Types.ObjectId.isValid(item.productId)) {
    product = await Product.findById(item.productId).populate("category");
  }

  // 2. Try match by name or SKU
  if (!product) {
    product = await Product.findOne({
      $or: [
        { name: { $regex: `^${cleanEscaped}$`, $options: "i" } },
        ...(providedSku ? [{ productCode: providedSku }] : []),
      ],
    }).populate("category");
  }

  // 3. Auto-create in Product Catalog if it's a new item
  if (!product) {
    let categoryDoc = null;
    const catName = item.category || "General Lab Equipment";
    const cleanCat = catName.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    categoryDoc = await Category.findOne({ name: { $regex: cleanCat, $options: "i" } });
    if (!categoryDoc) {
      categoryDoc = await Category.findOne();
    }
    if (!categoryDoc) {
      let eqType = await EquipmentType.findOne();
      if (!eqType) {
        eqType = await EquipmentType.create({
          name: "Laboratory Testing Instruments",
          slug: "laboratory-testing-instruments",
        });
      }
      categoryDoc = await Category.create({
        name: "General Lab Equipment",
        slug: "general-lab-equipment",
        equipmentType: eqType._id,
        description: "Standard laboratory testing instruments & consumables.",
      });
    }

    const autoSku = providedSku || `ARCL-${rawName.replace(/[^a-zA-Z0-9]/g, "").substring(0, 6).toUpperCase() || "SKU"}-${Date.now().toString().slice(-4)}`;
    const baseSlug = slugify(rawName, { lower: true, strict: true }) || "item";
    let cleanSlug = baseSlug;
    const slugExists = await Product.findOne({ slug: cleanSlug });
    if (slugExists) {
      cleanSlug = `${baseSlug}-${Date.now().toString(36)}`;
    }

    product = await Product.create({
      name: rawName,
      slug: cleanSlug,
      productCode: autoSku,
      category: categoryDoc._id,
      price: Number(item.rate) || 0,
      isActive: true,
      description: item.description || `${rawName} - Auto-synchronized ARCL Instrument.`,
    });
    product.category = categoryDoc;
  }

  const cleanSku = (product.productCode || `ARCL-${String(product.slug).substring(0, 10).toUpperCase()}`).trim().toUpperCase();

  // 4. Find or Create Inventory record
  let inventory = await Inventory.findOne({ product: product._id, warehouse: wh._id });
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
      onHand: 0,
      reserved: 0,
      incoming: 0,
      damaged: 0,
      minThreshold: 5,
      reorderQty: 10,
      unit: item.unit || "NOS",
      unitCost: Number(item.rate) || 0,
      sellingPrice: Number(item.rate) || 0,
      locationBin: "BAY-1",
      lastMovementDate: new Date(),
      isInitialized: true,
      notes: "Auto-initialized via Sales & Purchases Sync",
    });
  }

  return { product, inventory, warehouse: wh };
};

// ==========================================
// 1. PURCHASE -> INVENTORY SYNC (INWARD)
// ==========================================

/**
 * Called when a Purchase Record is created or marked received.
 * Increases stock in Inventory and logs a PURCHASE_RECEIPT StockMovement.
 */
export const syncPurchaseInward = async (purchaseRecord) => {
  if (!purchaseRecord || !Array.isArray(purchaseRecord.items) || purchaseRecord.items.length === 0) {
    return;
  }

  const wh = await resolveWarehouse(purchaseRecord.warehouse);

  for (const it of purchaseRecord.items) {
    const qty = Math.max(1, Number(it.qty) || 1);
    const { product, inventory } = await ensureProductAndInventory(it, wh);

    const prevOnHand = inventory.onHand || 0;
    inventory.onHand = prevOnHand + qty;
    if (Number(it.rate) > 0) {
      inventory.unitCost = Number(it.rate);
    }
    inventory.lastMovementDate = new Date();
    await inventory.save();

    await StockMovement.create({
      inventory: inventory._id,
      product: product._id,
      productName: product.name,
      sku: inventory.sku,
      warehouse: wh._id,
      warehouseCode: wh.code,
      movementType: "PURCHASE_RECEIPT",
      quantity: qty,
      balanceBefore: prevOnHand,
      balanceAfter: inventory.onHand,
      reservedBefore: inventory.reserved || 0,
      reservedAfter: inventory.reserved || 0,
      referenceType: "PURCHASE_ORDER",
      referenceId: purchaseRecord.purchaseNo || purchaseRecord.billNo || String(purchaseRecord._id),
      reason: `Procurement / Purchase Inward: ${purchaseRecord.purchaseNo} from ${purchaseRecord.vendorName}`,
      performedByName: "Purchase Management Section",
    });

    await checkAndSyncAlert(inventory);
  }
};

/**
 * Called when a Purchase Record is deleted or cancelled.
 * Deducts the quantity and logs an audit reversal movement.
 */
export const syncPurchaseRevert = async (purchaseRecord) => {
  if (!purchaseRecord || !Array.isArray(purchaseRecord.items) || purchaseRecord.items.length === 0) {
    return;
  }

  const wh = await resolveWarehouse(purchaseRecord.warehouse);

  for (const it of purchaseRecord.items) {
    const qty = Math.max(1, Number(it.qty) || 1);
    const { product, inventory } = await ensureProductAndInventory(it, wh);

    const prevOnHand = inventory.onHand || 0;
    inventory.onHand = Math.max(0, prevOnHand - qty);
    inventory.lastMovementDate = new Date();
    await inventory.save();

    await StockMovement.create({
      inventory: inventory._id,
      product: product._id,
      productName: product.name,
      sku: inventory.sku,
      warehouse: wh._id,
      warehouseCode: wh.code,
      movementType: "AUDIT_RECONCILIATION",
      quantity: -qty,
      balanceBefore: prevOnHand,
      balanceAfter: inventory.onHand,
      reservedBefore: inventory.reserved || 0,
      reservedAfter: inventory.reserved || 0,
      referenceType: "PURCHASE_ORDER",
      referenceId: purchaseRecord.purchaseNo || purchaseRecord.billNo || String(purchaseRecord._id),
      reason: `Reversal of deleted purchase record: ${purchaseRecord.purchaseNo}`,
      performedByName: "Purchase Management Section",
    });

    await checkAndSyncAlert(inventory);
  }
};

/**
 * Called when a Purchase Record is updated.
 * Reverts old items and applies new items.
 */
export const syncPurchaseUpdate = async (oldPurchase, newPurchase) => {
  if (oldPurchase) {
    await syncPurchaseRevert(oldPurchase);
  }
  if (newPurchase) {
    await syncPurchaseInward(newPurchase);
  }
};

// ==========================================
// 2. SALES -> INVENTORY SYNC (OUTWARD / DISPATCH)
// ==========================================

/**
 * Called when a Sales SRF / Commercial Order is confirmed or created.
 * Deducts stock from Inventory and logs a SALES_DISPATCH StockMovement.
 */
export const syncSalesOutward = async (salesRecord) => {
  if (!salesRecord || !Array.isArray(salesRecord.items) || salesRecord.items.length === 0) {
    return;
  }

  const wh = await ensureDefaultWarehouse();

  for (const it of salesRecord.items) {
    const qty = Math.max(1, Number(it.qty) || 1);
    const { product, inventory } = await ensureProductAndInventory(it, wh);

    const prevOnHand = inventory.onHand || 0;
    inventory.onHand = Math.max(0, prevOnHand - qty);
    if (Number(it.rate) > 0) {
      inventory.sellingPrice = Number(it.rate);
    }
    inventory.lastMovementDate = new Date();
    await inventory.save();

    const clientLabel = salesRecord.clientCompany || salesRecord.clientContactPerson || "Client";
    const refCode = salesRecord.srfNo || salesRecord.dcNo || String(salesRecord._id);

    await StockMovement.create({
      inventory: inventory._id,
      product: product._id,
      productName: product.name,
      sku: inventory.sku,
      warehouse: wh._id,
      warehouseCode: wh.code,
      movementType: "SALES_DISPATCH",
      quantity: -qty,
      balanceBefore: prevOnHand,
      balanceAfter: inventory.onHand,
      reservedBefore: inventory.reserved || 0,
      reservedAfter: inventory.reserved || 0,
      referenceType: "SALES_ORDER",
      referenceId: refCode,
      reason: `Sales Order Outward / Sold: ${refCode} to ${clientLabel}`,
      performedByName: "Sales Module",
    });

    await checkAndSyncAlert(inventory);
  }
};

/**
 * Called when a Sales SRF / Commercial Order is cancelled or deleted.
 * Restores stock back to Inventory and logs a RETURN_RESTOCK StockMovement.
 */
export const syncSalesRevert = async (salesRecord) => {
  if (!salesRecord || !Array.isArray(salesRecord.items) || salesRecord.items.length === 0) {
    return;
  }

  const wh = await ensureDefaultWarehouse();

  for (const it of salesRecord.items) {
    const qty = Math.max(1, Number(it.qty) || 1);
    const { product, inventory } = await ensureProductAndInventory(it, wh);

    const prevOnHand = inventory.onHand || 0;
    inventory.onHand = prevOnHand + qty;
    inventory.lastMovementDate = new Date();
    await inventory.save();

    const refCode = salesRecord.srfNo || salesRecord.dcNo || String(salesRecord._id);

    await StockMovement.create({
      inventory: inventory._id,
      product: product._id,
      productName: product.name,
      sku: inventory.sku,
      warehouse: wh._id,
      warehouseCode: wh.code,
      movementType: "RETURN_RESTOCK",
      quantity: qty,
      balanceBefore: prevOnHand,
      balanceAfter: inventory.onHand,
      reservedBefore: inventory.reserved || 0,
      reservedAfter: inventory.reserved || 0,
      referenceType: "SALES_ORDER",
      referenceId: refCode,
      reason: `Sales Order Cancelled / Restocked: ${refCode}`,
      performedByName: "Sales Module",
    });

    await checkAndSyncAlert(inventory);
  }
};

/**
 * Called when a Sales SRF is updated.
 */
export const syncSalesUpdate = async (oldSales, newSales) => {
  if (oldSales) {
    await syncSalesRevert(oldSales);
  }
  if (newSales) {
    await syncSalesOutward(newSales);
  }
};

// ==========================================
// 3. BULK / HISTORICAL AUTO-SYNC UTILITY
// ==========================================

/**
 * Scans all existing Purchases & Sales and ensures they are safely synced
 * into Inventory without double counting.
 */
export const syncAllExistingRecords = async () => {
  const defaultWh = await ensureDefaultWarehouse();

  // 1. Purchases
  const purchases = await PurchaseRecord.find().lean();
  let purchasesSynced = 0;
  for (const p of purchases) {
    const ref = p.purchaseNo || p.billNo || String(p._id);
    const exists = await StockMovement.findOne({
      referenceType: "PURCHASE_ORDER",
      referenceId: ref,
    });
    if (!exists) {
      await syncPurchaseInward(p);
      purchasesSynced++;
    }
  }

  // 2. Sales SRFs
  const srfs = await SalesSrf.find().lean();
  let salesSynced = 0;
  for (const s of srfs) {
    const ref = s.srfNo || s.dcNo || String(s._id);
    const exists = await StockMovement.findOne({
      referenceType: "SALES_ORDER",
      referenceId: ref,
    });
    if (!exists) {
      await syncSalesOutward(s);
      salesSynced++;
    }
  }

  return { purchasesSynced, salesSynced };
};
