import { create } from "zustand";

import { inquiryService } from "../services/inquiryService.js";

export const useInquiryStore = create((set) => ({
  inquiries: [],

  inquiry: null,

  loading: false,

  error: null,

  // CREATE INQUIRY

  createInquiry: async (inquiryData) => {
    try {
      set({
        loading: true,
        error: null,
      });

      const data = await inquiryService.create(inquiryData);

      set({
        loading: false,
      });

      return data;
    } catch (err) {
      console.log(err);

      set({
        error: err.response?.data?.message || "Failed to create inquiry",

        loading: false,
      });

      throw err;
    }
  },

  // GET ALL INQUIRIES

  fetchInquiries: async () => {
    try {
      set({
        loading: true,
        error: null,
      });

      const data = await inquiryService.getAll();

      set({
        inquiries: data.inquiries,

        loading: false,
      });
    } catch (err) {
      console.log(err);

      set({
        error: err.response?.data?.message || "Failed to fetch inquiries",

        loading: false,
      });
    }
  },

  // GET SINGLE INQUIRY

  fetchSingleInquiry: async (id) => {
    try {
      set({
        loading: true,
        error: null,
      });

      const data = await inquiryService.getOne(id);

      set({
        inquiry: data.inquiry,

        loading: false,
      });
    } catch (err) {
      console.log(err);

      set({
        error: err.response?.data?.message || "Failed to fetch inquiry",

        loading: false,
      });
    }
  },

  // UPDATE STATUS

  updateStatus: async (id, status) => {
    try {
      set({
        loading: true,
        error: null,
      });

      const data = await inquiryService.updateStatus(id, status);

      set({
        loading: false,
      });

      return data;
    } catch (err) {
      console.log(err);

      set({
        error: err.response?.data?.message || "Failed to update inquiry",

        loading: false,
      });

      throw err;
    }
  },

  // DELETE INQUIRY

  deleteInquiry: async (id) => {
    try {
      set({
        loading: true,
        error: null,
      });

      await inquiryService.remove(id);

      set((state) => ({
        inquiries: state.inquiries.filter((item) => item._id !== id),

        loading: false,
      }));
    } catch (err) {
      console.log(err);

      set({
        error: err.response?.data?.message || "Failed to delete inquiry",

        loading: false,
      });
    }
  },
}));
