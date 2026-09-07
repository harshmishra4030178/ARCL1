import BlogForm from "../../../../../views/admin/BlogForm.jsx";

export const metadata = {
  title: "Edit Technical Article | ARCL Admin",
};

export default async function AdminBlogEditRoute({ params }) {
  const resolvedParams = await params;
  const id = resolvedParams?.id;
  return <BlogForm blogId={id} isEdit={true} />;
}
