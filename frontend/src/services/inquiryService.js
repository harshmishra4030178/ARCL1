import {
  createInquiry,
  getAllInquiries,
  getSingleInquiry,
  updateInquiryStatus,
  deleteInquiry,
} from "../api/inquiryApi.js";

export const inquiryService = {
  // CREATE

  create: async (data) => {
    return await createInquiry(data);
  },

  // GET ALL

  getAll: async () => {
    return await getAllInquiries();
  },

  // GET ONE

  getOne: async (id) => {
    return await getSingleInquiry(id);
  },

  // UPDATE STATUS

  updateStatus: async (id, status) => {
    return await updateInquiryStatus(id, status);
  },

  // DELETE

  remove: async (id) => {
    return await deleteInquiry(id);
  },
};
