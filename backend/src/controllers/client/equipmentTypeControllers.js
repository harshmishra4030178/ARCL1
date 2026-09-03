import EquipmentType from "../../models/equipmentType.js";

/**
 * @desc    Get All Active Equipment Types (Client)
 * @route   GET /api/v1/client/equipment-types
 * @access  Public
 */
export const getEquipmentTypes = async (req, res) => {
  try {
    const equipmentTypes = await EquipmentType.find({ isActive: true })
      .select("name slug isFeatured createdAt")
      .sort({ isFeatured: -1, name: 1 });

    return res.status(200).json({
      success: true,
      count: equipmentTypes.length,
      data: equipmentTypes,
    });
  } catch (error) {
    console.error("Client Get Equipment Types Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch equipment types.",
    });
  }
};

/**
 * @desc    Get Single Equipment Type by Slug (Client)
 * @route   GET /api/v1/client/equipment-types/:slug
 * @access  Public
 */
export const getEquipmentType = async (req, res) => {
  try {
    const equipmentType = await EquipmentType.findOne({
      slug: req.params.slug,
      isActive: true,
    });

    if (!equipmentType) {
      return res.status(404).json({
        success: false,
        message: "Equipment type not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: equipmentType,
    });
  } catch (error) {
    console.error("Client Get Equipment Type Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch equipment type.",
    });
  }
};