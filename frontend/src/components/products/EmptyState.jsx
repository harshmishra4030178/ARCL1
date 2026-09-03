import { PackageOpen } from "lucide-react";

const EmptyState = ({
  title = "No Products Found",
  description = "Try adjusting your filters or search keywords.",
  actionText,
  onAction,
}) => {
  return (
    <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center space-y-4 shadow-xs max-w-lg mx-auto">
      <div className="w-16 h-16 bg-blue-50 text-[#021C57] rounded-full flex items-center justify-center mx-auto">
        <PackageOpen size={32} />
      </div>
      <h3 className="text-xl font-bold text-gray-800">{title}</h3>
      <p className="text-gray-500 text-sm">{description}</p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="bg-[#021C57] hover:bg-[#03308f] text-white text-xs font-semibold px-6 py-2.5 rounded-xl transition cursor-pointer"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
