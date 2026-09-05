import { create } from "zustand";
import { getAllInquiries } from "../api/inquiryApi.js";
import { getAllContacts } from "../api/contactApi.js";

const READ_STORAGE_KEY = "arcl_admin_read_notification_ids";

function getStoredReadIds() {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(READ_STORAGE_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch (e) {
    return new Set();
  }
}

function saveStoredReadIds(idsSet) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(READ_STORAGE_KEY, JSON.stringify(Array.from(idsSet)));
  } catch (e) {}
}

export const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,
  readIds: new Set(),
  lastFetched: null,

  initialize: () => {
    const stored = getStoredReadIds();
    set({ readIds: stored });
    get().fetchNotifications();
  },

  fetchNotifications: async () => {
    try {
      set({ loading: true });

      const [inqRes, conRes] = await Promise.all([
        getAllInquiries().catch(() => ({ inquiries: [] })),
        getAllContacts().catch(() => ({ contacts: [] })),
      ]);

      const rawInquiries = inqRes.inquiries || inqRes.data || [];
      const rawContacts = conRes.contacts || conRes.data || [];
      const currentReadIds = get().readIds || getStoredReadIds();

      // Transform inquiries to notification format
      const inquiryItems = rawInquiries.map((item) => ({
        id: `inq_${item._id}`,
        rawId: item._id,
        type: "inquiry",
        title: item.productName || "Product Quotation Request",
        customerName: item.customerName,
        email: item.email,
        phone: item.phone,
        category: item.category,
        quantity: item.totalItems || item.quantity || 1,
        isBasket: item.isInquiryBasket || (item.items && item.items.length > 1),
        status: item.status || "pending",
        isUnread:
          !currentReadIds.has(`inq_${item._id}`) && item.status === "pending",
        createdAt: item.createdAt,
        link: "/admin/inquiry",
      }));

      // Transform contact messages to notification format
      const contactItems = rawContacts.map((item) => ({
        id: `con_${item._id}`,
        rawId: item._id,
        type: "contact",
        title: item.subject || "Contact Form Message",
        customerName: item.name || item.customerName,
        email: item.email,
        phone: item.phone,
        message: item.message,
        status: item.status || "unread",
        isUnread:
          !currentReadIds.has(`con_${item._id}`) && item.status === "unread",
        createdAt: item.createdAt,
        link: "/admin/contact-messages",
      }));

      // Merge and sort newest first
      const combined = [...inquiryItems, ...contactItems].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );

      const unreadCount = combined.filter((n) => n.isUnread).length;

      set({
        notifications: combined,
        unreadCount,
        readIds: currentReadIds,
        lastFetched: new Date(),
        loading: false,
      });
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
      set({ loading: false });
    }
  },

  markAsRead: (id) => {
    const { readIds, notifications } = get();
    const updatedSet = new Set(readIds);
    updatedSet.add(id);
    saveStoredReadIds(updatedSet);

    const updatedList = notifications.map((n) =>
      n.id === id ? { ...n, isUnread: false } : n
    );

    const unreadCount = updatedList.filter((n) => n.isUnread).length;

    set({
      readIds: updatedSet,
      notifications: updatedList,
      unreadCount,
    });
  },

  markAllAsRead: () => {
    const { notifications, readIds } = get();
    const updatedSet = new Set(readIds);

    notifications.forEach((n) => {
      updatedSet.add(n.id);
    });

    saveStoredReadIds(updatedSet);

    const updatedList = notifications.map((n) => ({ ...n, isUnread: false }));

    set({
      readIds: updatedSet,
      notifications: updatedList,
      unreadCount: 0,
    });
  },
}));
