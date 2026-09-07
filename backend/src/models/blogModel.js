import mongoose, { Schema } from "mongoose";

const blogSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, "Blog title is required"],
      trim: true,
      maxlength: [500, "Title cannot exceed 500 characters"],
    },
    slug: {
      type: String,
      required: [true, "Blog slug is required"],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    excerpt: {
      type: String,
      required: [true, "Blog excerpt/summary is required"],
      trim: true,
      maxlength: [2000, "Excerpt cannot exceed 2000 characters"],
    },
    content: {
      type: String,
      required: [true, "Blog content is required"],
    },
    featuredImage: {
      type: String,
      default: "https://res.cloudinary.com/domeeznqa/image/upload/v1788261941/products/rwv9chfcohdlnj0zvsgk.jpg",
    },
    category: {
      type: String,
      required: [true, "Category or Equipment Type is required"],
      trim: true,
      default: "Concrete Testing Equipment",
      index: true,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    author: {
      name: {
        type: String,
        default: "ARCL Technical Editorial Team",
      },
      role: {
        type: String,
        default: "Senior Civil Testing Specialist",
      },
      avatar: {
        type: String,
        default: "/assets/LOGO.png",
      },
    },
    readTime: {
      type: String,
      default: "5 min read",
    },
    relatedStandards: [
      {
        type: String,
        trim: true,
      },
    ],
    relatedProducts: [
      {
        type: Schema.Types.ObjectId,
        ref: "Product",
      },
    ],
    metaTitle: {
      type: String,
      trim: true,
    },
    metaDescription: {
      type: String,
      trim: true,
    },
    isPublished: {
      type: Boolean,
      default: true,
      index: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },
    viewsCount: {
      type: Number,
      default: 0,
    },
    publishedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Auto-generate metaTitle & metaDescription if missing
blogSchema.pre("save", function () {
  if (!this.metaTitle) {
    this.metaTitle = `${this.title} | ARCL Technical Blog`;
  }
  if (!this.metaDescription) {
    this.metaDescription = this.excerpt;
  }
});

const Blog = mongoose.models.Blog || mongoose.model("Blog", blogSchema);

export default Blog;
