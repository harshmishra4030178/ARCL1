import mongoose from "mongoose";
import Blog from "../../models/blogModel.js";
import ApiResponse from "../../utils/ApiResponse.js";
import ApiError from "../../utils/ApiError.js";

// Helper to create slug
const createSlug = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

// @desc    Get all blogs for admin (including drafts)
// @route   GET /api/v1/admin/blogs
// @access  Private/Admin
export const getAllBlogsAdmin = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, category, status } = req.query;

    const query = {};

    if (category && category !== "All") {
      const escaped = category.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      query.category = new RegExp(`^${escaped}$`, "i");
    }

    if (status === "published") query.isPublished = true;
    if (status === "draft") query.isPublished = false;

    if (search && search.trim() !== "") {
      const searchRegex = new RegExp(search.trim(), "i");
      query.$or = [
        { title: searchRegex },
        { excerpt: searchRegex },
        { category: searchRegex },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [blogs, total] = await Promise.all([
      Blog.find(query)
        .select("title slug category excerpt featuredImage author isPublished isFeatured viewsCount createdAt publishedAt")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Blog.countDocuments(query),
    ]);

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          blogs,
          pagination: {
            total,
            page: Number(page),
            pages: Math.ceil(total / Number(limit)),
            limit: Number(limit),
          },
        },
        "Admin blogs retrieved successfully"
      )
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Get single blog by ID or slug for admin edit
// @route   GET /api/v1/admin/blogs/:id
// @access  Private/Admin
export const getBlogByIdAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;
    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const blog = await Blog.findOne(isObjectId ? { _id: id } : { slug: id }).populate(
      "relatedProducts",
      "name slug productCode"
    );

    if (!blog) {
      return next(new ApiError(404, "Blog post not found"));
    }

    return res.status(200).json(new ApiResponse(200, blog, "Blog retrieved"));
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new blog post
// @route   POST /api/v1/admin/blogs
// @access  Private/Admin
export const createBlog = async (req, res, next) => {
  try {
    const {
      title,
      slug,
      excerpt,
      content,
      featuredImage,
      category,
      tags,
      author,
      readTime,
      relatedStandards,
      relatedProducts,
      metaTitle,
      metaDescription,
      isPublished,
      isFeatured,
    } = req.body;

    if (!title || !title.trim()) {
      return next(new ApiError(400, "Blog title is required"));
    }

    const trimmedTitle = title.trim();
    const trimmedContent = (content || "").trim() || `${trimmedTitle} - detailed procedural guide and testing apparatus specifications.`;
    const trimmedExcerpt = (excerpt || "").trim() || trimmedContent.slice(0, 200);

    const baseSlug = (slug ? createSlug(slug) : createSlug(trimmedTitle)) || `blog-${Date.now()}`;

    // Deduplicate slug automatically so user never gets 400 slug collision
    let finalSlug = baseSlug;
    let counter = 1;
    while (await Blog.findOne({ slug: finalSlug })) {
      finalSlug = `${baseSlug}-${counter}`;
      counter++;
    }

    const newBlog = await Blog.create({
      title: trimmedTitle,
      slug: finalSlug,
      excerpt: trimmedExcerpt,
      content: trimmedContent,
      featuredImage: featuredImage || undefined,
      category: category || "Concrete Testing Equipments",
      tags: Array.isArray(tags) ? tags : typeof tags === "string" ? tags.split(",").map((t) => t.trim()).filter(Boolean) : ["Civil Engineering", "Testing Equipment"],
      author: author || undefined,
      readTime: readTime || "5 min read",
      relatedStandards: Array.isArray(relatedStandards) ? relatedStandards : typeof relatedStandards === "string" ? relatedStandards.split(",").map((s) => s.trim()).filter(Boolean) : [],
      relatedProducts: Array.isArray(relatedProducts) ? relatedProducts : [],
      metaTitle: metaTitle || `${trimmedTitle} | ARCL Technical Guide`,
      metaDescription: metaDescription || trimmedExcerpt,
      isPublished: isPublished !== undefined ? isPublished : true,
      isFeatured: isFeatured !== undefined ? isFeatured : false,
      publishedAt: new Date(),
    });

    return res.status(201).json(new ApiResponse(201, newBlog, "Blog created successfully"));
  } catch (error) {
    next(error);
  }
};

// @desc    Update an existing blog post
// @route   PUT /api/v1/admin/blogs/:id
// @access  Private/Admin
export const updateBlog = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      title,
      slug,
      excerpt,
      content,
      featuredImage,
      category,
      tags,
      author,
      readTime,
      relatedStandards,
      relatedProducts,
      metaTitle,
      metaDescription,
      isPublished,
      isFeatured,
    } = req.body;

    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const blog = await Blog.findOne(isObjectId ? { _id: id } : { slug: id });
    if (!blog) {
      return next(new ApiError(404, "Blog post not found"));
    }

    if (title) blog.title = title.trim();
    if (slug) {
      const generatedSlug = createSlug(slug);
      let uniqueSlug = generatedSlug;
      let counter = 1;
      while (await Blog.findOne({ slug: uniqueSlug, _id: { $ne: blog._id } })) {
        uniqueSlug = `${generatedSlug}-${counter}`;
        counter++;
      }
      blog.slug = uniqueSlug;
    }
    if (excerpt !== undefined) blog.excerpt = excerpt.trim();
    if (content !== undefined) blog.content = content.trim();
    if (featuredImage !== undefined) blog.featuredImage = featuredImage;
    if (category) blog.category = category;
    if (tags !== undefined) {
      blog.tags = Array.isArray(tags) ? tags : typeof tags === "string" ? tags.split(",").map((t) => t.trim()).filter(Boolean) : [];
    }
    if (author) blog.author = { ...blog.author, ...author };
    if (readTime) blog.readTime = readTime;
    if (relatedStandards !== undefined) {
      blog.relatedStandards = Array.isArray(relatedStandards) ? relatedStandards : typeof relatedStandards === "string" ? relatedStandards.split(",").map((s) => s.trim()).filter(Boolean) : [];
    }
    if (relatedProducts !== undefined) blog.relatedProducts = relatedProducts;
    if (metaTitle) blog.metaTitle = metaTitle;
    if (metaDescription) blog.metaDescription = metaDescription;
    if (isPublished !== undefined) blog.isPublished = isPublished;
    if (isFeatured !== undefined) blog.isFeatured = isFeatured;

    await blog.save();

    return res.status(200).json(new ApiResponse(200, blog, "Blog updated successfully"));
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a blog post
// @route   DELETE /api/v1/admin/blogs/:id
// @access  Private/Admin
export const deleteBlog = async (req, res, next) => {
  try {
    const { id } = req.params;
    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const blog = await Blog.findOneAndDelete(isObjectId ? { _id: id } : { slug: id });

    if (!blog) {
      return next(new ApiError(404, "Blog post not found"));
    }

    return res.status(200).json(new ApiResponse(200, null, "Blog deleted successfully"));
  } catch (error) {
    next(error);
  }
};

// @desc    Quick toggle publish status
// @route   PATCH /api/v1/admin/blogs/:id/toggle-publish
// @access  Private/Admin
export const togglePublishStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const blog = await Blog.findOne(isObjectId ? { _id: id } : { slug: id });

    if (!blog) {
      return next(new ApiError(404, "Blog post not found"));
    }

    blog.isPublished = !blog.isPublished;
    await blog.save();

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { isPublished: blog.isPublished },
          `Blog is now ${blog.isPublished ? "Published" : "Draft"}`
        )
      );
  } catch (error) {
    next(error);
  }
};
