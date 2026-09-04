import Subscriber from "../models/subscriberModel.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

/**
 * @desc    Subscribe to new equipment email alerts (Client)
 * @route   POST /api/v1/client/subscribers
 * @access  Public
 */
export const subscribe = asyncHandler(async (req, res) => {
  const { email, source } = req.body;

  if (!email || !email.trim()) {
    throw new ApiError(400, "Email address is required.");
  }

  const normalizedEmail = email.trim().toLowerCase();

  // Check if subscriber exists
  let subscriber = await Subscriber.findOne({ email: normalizedEmail });

  if (subscriber) {
    if (!subscriber.isActive) {
      subscriber.isActive = true;
      await subscriber.save();
      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            subscriber,
            "Your subscription has been reactivated successfully! You will receive new equipment alerts."
          )
        );
    }

    throw new ApiError(
      400,
      "This email is already subscribed to equipment alerts. Duplicate registration is not allowed."
    );
  }

  // Create new subscriber
  subscriber = await Subscriber.create({
    email: normalizedEmail,
    source: source || "website_home_subscription",
    isActive: true,
  });

  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        subscriber,
        "Thank you for subscribing! You will receive alerts whenever new laboratory equipment is launched."
      )
    );
});

/**
 * @desc    Get all subscribers (Admin)
 * @route   GET /api/v1/admin/subscribers
 * @access  Admin
 */
export const getAllSubscribers = asyncHandler(async (req, res) => {
  const subscribers = await Subscriber.find().sort({ createdAt: -1 });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { count: subscribers.length, subscribers },
        "Subscribers retrieved successfully."
      )
    );
});

/**
 * @desc    Delete a subscriber (Admin)
 * @route   DELETE /api/v1/admin/subscribers/:id
 * @access  Admin
 */
export const deleteSubscriber = asyncHandler(async (req, res) => {
  const subscriber = await Subscriber.findByIdAndDelete(req.params.id);

  if (!subscriber) {
    throw new ApiError(404, "Subscriber not found.");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Subscriber deleted successfully."));
});
