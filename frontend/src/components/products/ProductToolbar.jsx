import { Search, X, SlidersHorizontal } from "lucide-react";

const ProductToolbar = ({
  search,
  setSearch,
  sort,
  setSort,
  totalProducts,
  onReset,
  hasActiveFilters,
}) => {
  return (
    <div className="bg-white border border-gray-100 rounded-3xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-sm">
      
      {/* SEARCH BAR */}
      <div className="relative w-full md:max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />

        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by instrument name or model..."
          className="w-full border border-gray-200 rounded-2xl pl-11 pr-10 py-3 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition"
        />

        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* RIGHT: COUNT & SORT */}
      <div className="flex items-center gap-4 flex-wrap justify-between md:justify-end">
        <p className="text-xs sm:text-sm font-semibold text-gray-600 bg-gray-50 px-3.5 py-2 rounded-xl border border-gray-100">
          <span className="text-[#021C57] font-bold">{totalProducts}</span> Products Available
        </p>

        <div className="flex items-center gap-2">
          <SlidersHorizontal size={14} className="text-gray-400 hidden sm:block" />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="border border-gray-200 rounded-2xl px-4 py-2.5 text-xs sm:text-sm outline-none bg-white text-gray-700 font-medium cursor-pointer focus:border-blue-500 transition"
          >
            <option value="latest">Sort: Latest Additions</option>
            <option value="popular">Sort: Featured First</option>
            <option value="a-z">Sort: Name (A to Z)</option>
            <option value="z-a">Sort: Name (Z to A)</option>
          </select>
        </div>
      </div>

    </div>
  );
};

export default ProductToolbar;