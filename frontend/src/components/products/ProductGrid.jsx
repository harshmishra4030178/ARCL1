import ProductCard from "./ProductCard.jsx";

const ProductGrid = ({ products = [], loading }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="h-80 bg-white rounded-3xl border border-gray-100 p-4 animate-pulse space-y-4"
          >
            <div className="h-44 bg-gray-100 rounded-2xl w-full"></div>
            <div className="h-4 bg-gray-100 rounded w-3/4"></div>
            <div className="h-3 bg-gray-50 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-gray-100 p-16 text-center space-y-3 shadow-xs">
        <h2 className="text-xl font-bold text-gray-700">
          No Products Found
        </h2>
        <p className="text-gray-500 text-sm max-w-md mx-auto">
          We couldn't find any instruments matching your active filter criteria. Try adjusting your filters or search keywords.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-stretch">
      {products.map((product) => (
        <ProductCard key={product._id} product={product} />
      ))}
    </div>
  );
};

export default ProductGrid;