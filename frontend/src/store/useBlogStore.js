import { create } from "zustand";
import API from "../api/axios";
import { INITIAL_BLOGS } from "../data/blogData";

export const useBlogStore = create((set, get) => ({
  blogs: INITIAL_BLOGS,
  currentBlog: null,
  relatedBlogs: [],
  selectedCategory: "All",
  searchQuery: "",
  isLoading: false,
  error: null,
  pagination: {
    total: INITIAL_BLOGS.length,
    page: 1,
    pages: 1,
    limit: 9,
  },

  setSelectedCategory: (category) => {
    set({ selectedCategory: category });
  },

  setSearchQuery: (query) => {
    set({ searchQuery: query });
  },

  fetchBlogs: async (params = {}) => {
    set({ isLoading: true, error: null });
    const { category = get().selectedCategory, search = get().searchQuery, page = 1 } = params;

    try {
      const res = await API.get("/client/blogs", {
        params: {
          ...(category && category !== "All" ? { category } : {}),
          ...(search && search.trim() ? { search: search.trim() } : {}),
          page,
        },
      });

      const data = res.data;
      if (data?.data?.blogs) {
        const serverBlogs = data.data.blogs;
        set({
          blogs: serverBlogs,
          pagination: {
            ...data.data.pagination,
            total: data.data.pagination?.total || serverBlogs.length,
          },
          isLoading: false,
        });
        return serverBlogs;
      }
    } catch (err) {
      console.warn("Client blog fetch error, using local fallback:", err?.message);
    }

    // Fallback filter over initial blogs
    let filtered = [...INITIAL_BLOGS];
    if (category && category !== "All") {
      const catLower = category.toLowerCase();
      filtered = filtered.filter((b) => (b.category || "").toLowerCase() === catLower);
    }
    if (search && search.trim()) {
      const s = search.toLowerCase();
      filtered = filtered.filter(
        (b) =>
          b.title.toLowerCase().includes(s) ||
          b.excerpt.toLowerCase().includes(s) ||
          (b.tags && b.tags.some((t) => t.toLowerCase().includes(s)))
      );
    }

    set({
      blogs: filtered,
      pagination: {
        total: filtered.length,
        page: 1,
        pages: Math.ceil(filtered.length / 9),
        limit: 9,
      },
      isLoading: false,
    });
  },

  fetchBlogBySlug: async (slug) => {
    set({ isLoading: true, error: null, currentBlog: null });

    try {
      const res = await API.get(`/client/blogs/${slug}`);
      if (res.data?.data?.blog) {
        const blog = res.data.data.blog;
        set({
          currentBlog: blog,
          relatedBlogs: res.data.data.relatedBlogs || [],
          isLoading: false,
        });
        return blog;
      }
    } catch (err) {
      console.warn("Fetch blog by slug error, using local dataset:", err?.message);
    }

    // Local dataset fallback
    const found = INITIAL_BLOGS.find((b) => b.slug === slug);
    if (found) {
      const related = INITIAL_BLOGS.filter(
        (b) => b.slug !== slug && b.category === found.category
      ).slice(0, 3);

      set({
        currentBlog: found,
        relatedBlogs: related.length > 0 ? related : INITIAL_BLOGS.filter((b) => b.slug !== slug).slice(0, 3),
        isLoading: false,
      });
      return found;
    }

    set({ isLoading: false, error: "Blog post not found" });
    return null;
  },

  addBlog: async (newBlogData) => {
    set({ isLoading: true, error: null });

    try {
      const res = await API.post("/admin/blogs", newBlogData);
      if (res.data?.data) {
        const saved = res.data.data;
        set((state) => ({
          blogs: [saved, ...state.blogs.filter((b) => b.slug !== saved.slug && b._id !== saved._id)],
          isLoading: false,
        }));
        return saved;
      }
    } catch (err) {
      console.error("Backend save blog error:", err);
      // Optimistic fallback
      const tempId = `blog-${Date.now()}`;
      const localBlog = {
        ...newBlogData,
        _id: tempId,
        id: tempId,
        slug:
          newBlogData.slug ||
          newBlogData.title
            .toString()
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, "")
            .replace(/[\s_-]+/g, "-"),
        publishedAt: new Date().toISOString(),
        viewsCount: 0,
      };
      set((state) => ({
        blogs: [localBlog, ...state.blogs],
        isLoading: false,
      }));
      throw err;
    }
  },

  updateBlog: async (idOrSlug, updatedData) => {
    set({ isLoading: true, error: null });

    try {
      const res = await API.put(`/admin/blogs/${idOrSlug}`, updatedData);
      if (res.data?.data) {
        const saved = res.data.data;
        set((state) => ({
          blogs: state.blogs.map((b) =>
            b._id === saved._id || b.slug === saved.slug || b._id === idOrSlug || b.slug === idOrSlug
              ? saved
              : b
          ),
          currentBlog: saved,
          isLoading: false,
        }));
        return saved;
      }
    } catch (err) {
      console.error("Backend update blog error:", err);
      // Optimistic fallback
      set((state) => ({
        blogs: state.blogs.map((b) =>
          b._id === idOrSlug || b.slug === idOrSlug ? { ...b, ...updatedData } : b
        ),
        isLoading: false,
      }));
      throw err;
    }
  },

  deleteBlog: async (idOrSlug) => {
    set((state) => ({
      blogs: state.blogs.filter((b) => b._id !== idOrSlug && b.slug !== idOrSlug),
    }));

    try {
      await API.delete(`/admin/blogs/${idOrSlug}`);
    } catch (err) {
      console.error("Delete blog API error:", err);
    }
  },
}));
