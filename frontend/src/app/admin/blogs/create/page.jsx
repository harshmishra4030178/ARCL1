import BlogForm from "../../../../views/admin/BlogForm.jsx";

export const metadata = {
  title: "Write Technical Article | ARCL Admin",
};

export default function AdminBlogCreateRoute() {
  return <BlogForm isEdit={false} />;
}
