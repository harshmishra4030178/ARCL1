import {
  createContact,
  getAllContacts,
  deleteContact,
  updateContactStatus,
} from "../api/contactApi.js";

export const contactService = {
  create: async (data) => {
    return await createContact(data);
  },

  getAll: async () => {
    return await getAllContacts();
  },

  remove: async (id) => {
    return await deleteContact(id);
  },

  updateStatus: async (id, status) => {
    return await updateContactStatus(id, status);
  },
};
