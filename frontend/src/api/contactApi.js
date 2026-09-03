import API from "./axios";

// Public client submission
export const createContact = async (contactData) => {
  const response = await API.post("/client/contacts", contactData);
  return response.data;
};

// Admin management
export const getAllContacts = async () => {
  const response = await API.get("/admin/contacts");
  return response.data;
};

export const getSingleContact = async (id) => {
  const response = await API.get(`/admin/contacts/${id}`);
  return response.data;
};

export const deleteContact = async (id) => {
  const response = await API.delete(`/admin/contacts/${id}`);
  return response.data;
};

export const updateContactStatus = async (id, status) => {
  const response = await API.put(`/admin/contacts/${id}`, { status });
  return response.data;
};
