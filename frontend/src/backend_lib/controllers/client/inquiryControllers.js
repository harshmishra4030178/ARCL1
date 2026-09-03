import Inquiry from "../../models/inquiryModel.js";
import Product from "../../models/product.js";

/**
 * @desc    Submit Quotation Inquiry / Multi-Product Quote Basket (Client)
 * @route   POST /api/v1/client/inquiries
 * @access  Public
 */
export const createInquiry = async (req, res) => {
  try {
    const {
      product: productId,
      productName,
      productSlug,
      category,
      items,
      customerName,
      email,
      phone,
      company,
      city,
      state,
      quantity,
      message,
    } = req.body;

    if (!customerName || !email || !phone) {
      return res.status(400).json({
        success: false,
        message: "Customer Name, Email, and Phone number are required.",
      });
    }

    let inquiryData = {
      customerName: customerName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      company: company ? company.trim() : "",
      city: city ? city.trim() : "",
      state: state ? state.trim() : "",
      message: message ? message.trim() : "",
      status: "pending",
    };

    // Case A: Multi-Product Basket Inquiry
    if (Array.isArray(items) && items.length > 0) {
      const cleanItems = items.map((item) => ({
        product: item.productId || item.product?._id || item.product || null,
        productName: item.productName || item.product?.name || "Equipment Item",
        productCode: item.productCode || item.product?.productCode || "",
        productSlug: item.productSlug || item.product?.slug || "",
        category: item.category || item.product?.category?.name || item.product?.category || "",
        quantity: item.quantity ? Math.max(1, parseInt(item.quantity)) : 1,
      }));

      inquiryData.items = cleanItems;
      inquiryData.isInquiryBasket = true;
      inquiryData.totalItems = cleanItems.reduce((sum, it) => sum + it.quantity, 0);

      // Primary product reference fields for quick table summaries
      inquiryData.product = cleanItems[0].product;
      inquiryData.productName =
        cleanItems.length === 1
          ? cleanItems[0].productName
          : `${cleanItems[0].productName} (+${cleanItems.length - 1} other instrument${cleanItems.length > 2 ? "s" : ""})`;
      inquiryData.productSlug = cleanItems[0].productSlug;
      inquiryData.category = cleanItems[0].category;
      inquiryData.quantity = inquiryData.totalItems;
    } else {
      // Case B: Single Product Direct Inquiry
      if (!productId && !productName) {
        return res.status(400).json({
          success: false,
          message: "Please select a product or add items to your Quote Basket.",
        });
      }

      inquiryData.product = productId || null;
      inquiryData.productName = productName || "Product";
      inquiryData.productSlug = productSlug || "";
      inquiryData.category = category || "";
      inquiryData.quantity = quantity ? parseInt(quantity) : 1;
      inquiryData.isInquiryBasket = false;
      inquiryData.totalItems = inquiryData.quantity;
      inquiryData.items = [
        {
          product: productId || null,
          productName: inquiryData.productName,
          productSlug: inquiryData.productSlug,
          category: inquiryData.category,
          quantity: inquiryData.quantity,
        },
      ];
    }

    const inquiry = await Inquiry.create(inquiryData);

    return res.status(201).json({
      success: true,
      message: "Quotation request submitted successfully! 🎉",
      inquiry,
    });
  } catch (error) {
    console.error("Create Inquiry Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to submit quotation inquiry",
      error: error.message,
    });
  }
};
