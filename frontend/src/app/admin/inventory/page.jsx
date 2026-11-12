import InventoryPageView from "../../../views/admin/InventoryPage.jsx";

export const metadata = {
  title: "Inventory & Stock Management | ARCL Admin",
  description: "Enterprise Inventory, Stock Movements, Warehouses, Purchase Orders & Supplier Hub for ARCL Instruments Private Limited.",
};

export default function AdminInventoryRoute() {
  return <InventoryPageView />;
}
