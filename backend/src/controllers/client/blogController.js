import Blog from "../../models/blogModel.js";
import ApiResponse from "../../utils/ApiResponse.js";
import ApiError from "../../utils/ApiError.js";

// @desc    Get all published blogs with pagination, category filter & search
// @route   GET /api/v1/client/blogs
// @access  Public
export const getPublishedBlogs = async (req, res, next) => {
  try {
    const { page = 1, limit = 9, category, search, tag, featured } = req.query;

    const query = { isPublished: true };

    if (category && category !== "All") {
      const escaped = category.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      query.category = new RegExp(`^${escaped}$`, "i");
    }

    if (tag) {
      query.tags = { $in: [tag] };
    }

    if (featured === "true") {
      query.isFeatured = true;
    }

    if (search && search.trim() !== "") {
      const searchRegex = new RegExp(search.trim(), "i");
      query.$or = [
        { title: searchRegex },
        { excerpt: searchRegex },
        { tags: searchRegex },
        { relatedStandards: searchRegex },
        { category: searchRegex },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [blogs, total] = await Promise.all([
      Blog.find(query)
        .select("-content") // optimize payload for listing
        .populate("relatedProducts", "name slug productCode images")
        .sort({ publishedAt: -1, createdAt: -1 })
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
        "Blogs fetched successfully"
      )
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Get single blog by slug with views increment & related posts
// @route   GET /api/v1/client/blogs/:slug
// @access  Public
export const getBlogBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;

    const blog = await Blog.findOneAndUpdate(
      { slug, isPublished: true },
      { $inc: { viewsCount: 1 } },
      { new: true }
    ).populate("relatedProducts", "name slug productCode images price specifications category");

    if (!blog) {
      return next(new ApiError(404, `Blog post not found: ${slug}`));
    }

    // Fetch related blogs from same category or tags
    const relatedBlogs = await Blog.find({
      _id: { $ne: blog._id },
      category: blog.category,
      isPublished: true,
    })
      .select("title slug excerpt featuredImage category readTime publishedAt")
      .limit(3)
      .sort({ publishedAt: -1 });

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          blog,
          relatedBlogs,
        },
        "Blog details retrieved successfully"
      )
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Get blog categories summary with count
// @route   GET /api/v1/client/blogs/categories
// @access  Public
export const getBlogCategoriesSummary = async (req, res, next) => {
  try {
    const categories = await Blog.aggregate([
      { $match: { isPublished: true } },
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    return res.status(200).json(
      new ApiResponse(
        200,
        categories.map((c) => ({ name: c._id, count: c.count })),
        "Blog categories retrieved"
      )
    );
  } catch (error) {
    next(error);
  }
};
