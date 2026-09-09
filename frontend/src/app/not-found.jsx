import Link from "next/link";
import { FaSearch, FaArrowRight, FaHome, FaBoxes, FaEnvelope } from "react-icons/fa";

export const metadata = {
  title: "404 - Page Not Found | ARCL Instruments",
  description: "The civil engineering laboratory testing machine or page you are looking for does not exist or has been moved.",
  robots: {
    index: false,
    follow: true,
  },
};

const popularCategories = [
  { name: "Concrete Testing Equipment", href: "/categories/concrete-testing-equipment" },
  { name: "Soil Testing Equipment", href: "/categories/soil-testing-equipment" },
  { name: "Aggregate Testing Equipment", href: "/categories/aggregate-testing-equipment" },
  { name: "Bitumen Testing Equipment", href: "/categories/bitumen-testing-equipment" },
  { name: "Cement Testing Equipment", href: "/categories/cement-testing-equipment" },
  { name: "NDT Testing Instruments", href: "/categories/non-destructive-testing-ndt-equipment" },
];

export default function NotFound() {
  return (
    <main className="min-h-[75vh] flex items-center justify-center bg-gradient-to-b from-slate-50 to-white px-4 py-16">
      <div className="max-w-2xl w-full text-center space-y-8">
        
        {/* Error Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-900 text-xs font-bold uppercase tracking-wider">
          <span>Error 404 • Page Not Found</span>
        </div>

        {/* Heading */}
        <div className="space-y-3">
          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">
            Looking for Testing Equipment?
          </h1>
          <p className="text-slate-600 text-sm sm:text-base max-w-lg mx-auto leading-relaxed">
            The instrument or page you requested could not be found. It may have been renamed, updated, or temporarily moved.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-[#021C57] hover:bg-[#032c85] text-white font-bold px-6 py-3 rounded-xl transition shadow-md text-sm"
          >
            <FaHome /> Back to Homepage
          </Link>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 font-bold px-6 py-3 rounded-xl transition shadow-xs text-sm"
          >
            <FaBoxes /> Browse All Products
          </Link>
        </div>

        {/* Quick Category Directory */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm text-left space-y-4">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <FaSearch className="text-blue-600" /> Explore Popular Equipment Categories
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {popularCategories.map((cat) => (
              <Link
                key={cat.href}
                href={cat.href}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-blue-50/70 border border-slate-100 hover:border-blue-200 text-slate-800 hover:text-blue-900 text-xs font-semibold transition group"
              >
                <span>{cat.name}</span>
                <FaArrowRight className="text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all text-[11px]" />
              </Link>
            ))}
          </div>
        </div>

        {/* Support Link */}
        <p className="text-xs text-slate-500">
          Need immediate assistance?{" "}
          <Link href="/contact" className="text-blue-600 hover:underline font-bold inline-flex items-center gap-1">
            <FaEnvelope size={11} /> Contact Technical Support
          </Link>
        </p>

      </div>
    </main>
  );
}
