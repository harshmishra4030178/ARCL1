import { create } from "zustand";

import { contactService } from "../services/contactService.js";

export const useContactStore = create((set) => ({
  contacts: [],

  loading: false,

  error: null,

  // CREATE

  createContact: async (contactData) => {
    try {
      set({
        loading: true,
        error: null,
      });

      const data = await contactService.create(contactData);

      set({
        loading: false,
      });

      return data;
    } catch (err) {
      console.log(err);

      set({
        error: err.response?.data?.message || "Failed to send message",

        loading: false,
      });

      throw err;
    }
  },

  // FETCH CONTACTS

  fetchContacts: async () => {
    try {
      set({
        loading: true,
        error: null,
      });

      const data = await contactService.getAll();

      set({
        contacts: data.contacts,

        loading: false,
      });
    } catch (err) {
      console.log(err);

      set({
        error: err.response?.data?.message || "Failed to fetch contacts",

        loading: false,
      });
    }
  },

  // DELETE CONTACT

  deleteContact: async (id) => {
    try {
      await contactService.remove(id);

      set((state) => ({
        contacts: state.contacts.filter((item) => item._id !== id),
      }));
    } catch (err) {
      console.log(err);
    }
  },

  // UPDATE STATUS

  updateStatus: async (id, status) => {
    try {
      await contactService.updateStatus(id, status);
    } catch (err) {
      console.log(err);
    }
  },
}));
