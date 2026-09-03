import API from "./axios";

// Public client submission
export const createInquiry = async (inquiryData) => {
  const response = await API.post("/client/inquiries", inquiryData);
  return response.data;
};

// Admin management
export const getAllInquiries = async () => {
  const response = await API.get("/admin/inquiries");
  return response.data;
};

export const getSingleInquiry = async (id) => {
  const response = await API.get(`/admin/inquiries/${id}`);
  return response.data;
};

export const updateInquiryStatus = async (id, status) => {
  const response = await API.put(`/admin/inquiries/${id}`, { status });
  return response.data;
};

export const deleteInquiry = async (id) => {
  const response = await API.delete(`/admin/inquiries/${id}`);
  return response.data;
};
