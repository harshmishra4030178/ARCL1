import EditCategoryClient from "../../../../../components/admin/category/EditCategoryForm.jsx";

export const metadata = {
  title: "Edit Category | ARCL Admin",
};

export default async function EditCategoryRoute({ params }) {
  const resolvedParams = await params;
  return <EditCategoryClient initialSlug={resolvedParams?.slug} />;
}
