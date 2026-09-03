import ProductFormClient from "../../../../../views/admin/ProductForm.jsx";

export const metadata = {
  title: "Edit Product | ARCL Admin",
};

export default async function EditProductRoute({ params }) {
  const resolvedParams = await params;
  return <ProductFormClient initialId={resolvedParams?.id} />;
}
