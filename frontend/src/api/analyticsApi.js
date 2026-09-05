import axiosInstance from "./axios.js";

// Client: Track storefront page visit
export const trackVisitorApi = async (data) => {
  try {
    const res = await axiosInstance.post("/client/analytics/track", data);
    return res.data;
  } catch (error) {
    // Non-blocking catch for analytics tracking
    return null;
  }
};

// Admin: Get aggregated visitor & device analytics
export const getAdminVisitorAnalytics = async (days = 30) => {
  const res = await axiosInstance.get(`/admin/analytics/visitors?days=${days}`);
  return res.data;
};
