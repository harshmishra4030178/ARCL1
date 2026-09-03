const ProductSkeleton = ({ count = 8 }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="h-80 bg-white rounded-3xl border border-gray-100 p-4 animate-pulse space-y-4 shadow-xs"
        >
          <div className="h-44 bg-gray-100 rounded-2xl w-full"></div>
          <div className="h-4 bg-gray-100 rounded w-3/4"></div>
          <div className="h-3 bg-gray-50 rounded w-1/2"></div>
        </div>
      ))}
    </div>
  );
};

export default ProductSkeleton;
