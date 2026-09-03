"use client";

import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "../utils/navigation.jsx";
import {
  Check,
  Package,
  FileText,
  MessageCircle,
  X,
  Share2,
  ShieldCheck,
  Award,
  ChevronRight,
  ArrowLeft,
  Download,
  Building2,
  Layers,
  Sparkles,
  PhoneCall,
  CheckCircle2,
  Plus,
  Minus,
  Maximize2,
  Info,
  Clock,
  Send,
  Truck,
  BadgeCheck,
  Cog,
  ShoppingBag,
} from "lucide-react";
import { useProductStore } from "../store/useProductStore.js";
import { useInquiryStore } from "../store/useInquiryStore.js";
import { useQuoteCartStore } from "../store/useQuoteCartStore.js";
import { productService } from "../services/productService.js";
import { toast } from "react-toastify";
import { formatTitleCase } from "../utils/stringUtils.js";

const ProductDetailsPage = ({ initialSlug }) => {
  const { addItem, openCart, isInCart } = useQuoteCartStore();
  const routeParams = useParams();
  const slug = initialSlug || routeParams.slug;
  const navigate = useNavigate();

  // Stores
  const {
    product,
    loading,
    error,
    fetchSingleProduct,
    categoryProducts,
    fetchProductsByCategory,
  } = useProductStore();
  const { createInquiry, loading: inquiryLoading } = useInquiryStore();

  // State
  const [activeTab, setActiveTab] = useState("specs"); // 'specs' | 'features' | 'applications' | 'howItWorks' | 'compliance'
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [openQuoteModal, setOpenQuoteModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [relatedEquipment, setRelatedEquipment] = useState([]);

  // Form State
  const [formData, setFormData] = useState({
    customerName: "",
    email: "",
    phone: "",
    company: "",
    quantity: 1,
    message: "",
  });

  // Fetch product on slug change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    fetchSingleProduct(slug);
    setSelectedImageIndex(0);
    setActiveTab("specs");
  }, [slug]);

  // Fetch true related products in the same Equipment Type group
  useEffect(() => {
    if (product?._id) {
      productService
        .getRelated(product._id)
        .then((items) => {
          setRelatedEquipment(Array.isArray(items) ? items : []);
        })
        .catch(() => {
          setRelatedEquipment([]);
        });
    }
  }, [product?._id]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (openQuoteModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [openQuoteModal]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleShare = () => {
    try {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      toast.success("Product URL copied to clipboard!");
      setTimeout(() => setCopiedLink(false), 3000);
    } catch {
      toast.info("Share URL: " + window.location.href);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.customerName.trim() || !formData.email.trim() || !formData.phone.trim()) {
      toast.error("Please fill in Name, Email and Phone Number.");
      return;
    }

    try {
      await createInquiry({
        product: product._id,
        productName: formatTitleCase(product.name),
        productSlug: product.slug,
        category: formatTitleCase(product.category?.name || "General"),
        ...formData,
      });

      toast.success("Quotation inquiry submitted! Our engineering team will contact you shortly.");
      setOpenQuoteModal(false);

      setFormData({
        customerName: "",
        email: "",
        phone: "",
        company: "",
        quantity: 1,
        message: "",
      });
    } catch (err) {
      console.error("Inquiry submission error:", err);
      toast.error("Failed to submit inquiry. Please try again.");
    }
  };

  // SKELETON / LOADING
  if (loading) {
    return (
      <div className="bg-slate-50 min-h-screen py-12 px-4 sm:px-6 lg:px-12">
        <div className="max-w-7xl mx-auto space-y-8 animate-pulse">
          <div className="h-6 bg-gray-200 rounded-lg w-72"></div>
          <div className="grid lg:grid-cols-12 gap-10">
            <div className="lg:col-span-6 h-[480px] bg-gray-200 rounded-3xl"></div>
            <div className="lg:col-span-6 space-y-4">
              <div className="h-8 bg-gray-200 rounded-lg w-40"></div>
              <div className="h-12 bg-gray-200 rounded-xl w-full"></div>
              <div className="h-24 bg-gray-200 rounded-xl w-full"></div>
              <div className="h-12 bg-gray-200 rounded-xl w-60"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ERROR
  if (!loading && (!product || error)) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 sm:p-12 rounded-3xl border border-gray-200 shadow-xl max-w-lg text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto text-2xl font-bold">
            ✕
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Equipment Not Found</h2>
          <p className="text-gray-500 text-sm">
            {error || "The requested instrument could not be located or may have been archived."}
          </p>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 bg-[#021C57] text-white px-6 py-3 rounded-xl font-bold text-sm shadow-md hover:bg-blue-900 transition"
          >
            <ArrowLeft size={16} /> Back to Product Catalogue
          </Link>
        </div>
      </div>
    );
  }

  const imagesList =
    product.images && product.images.length > 0
      ? product.images
      : ["https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&q=80&w=800"];

  const relatedProducts = (relatedEquipment || [])
    .filter((p) => p._id !== product._id)
    .slice(0, 4);

  const categoryHowItWorks = product.category?.howItWorks || product.howItWorks;
  const categoryHowItWorksSteps = product.category?.howItWorksSteps || product.howItWorksSteps;
  const hasHowItWorks = Boolean(
    categoryHowItWorks || (categoryHowItWorksSteps && categoryHowItWorksSteps.length > 0)
  );

  const hasCompleteSet = Boolean(
    product.completeSetIncludes && product.completeSetIncludes.length > 0
  );

  // Tabs configuration
  const tabsList = [
    { id: "specs", label: "Technical Specifications", count: Object.keys(product.specifications || {}).length },
    ...(hasCompleteSet
      ? [{ id: "completeSet", label: "Complete Set Includes", count: product.completeSetIncludes.length }]
      : []),
    { id: "features", label: "Key Features", count: product.features?.length || 0 },
    { id: "applications", label: "Lab Applications", count: product.applications?.length || 0 },
    ...(hasHowItWorks ? [{ id: "howItWorks", label: "How It Works / Principle" }] : []),
    { id: "compliance", label: "Testing Standards & Compliance" },
  ];

  const equipmentTypeName = product?.category?.equipmentType?.name
    ? formatTitleCase(product.category.equipmentType.name)
    : product?.equipmentTypeName
    ? formatTitleCase(product.equipmentTypeName)
    : "";

  return (
    <div className="bg-slate-50 min-h-screen pb-20 selection:bg-blue-100 selection:text-blue-900">
      
      {/* =====================================================
          1. BREADCRUMBS BAR
      ===================================================== */}
      <nav className="bg-white border-b border-gray-200/80 py-3.5 px-4 sm:px-6 lg:px-12 sticky top-0 z-30 shadow-2xs backdrop-blur-md bg-white/90">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 text-xs font-medium text-gray-500">
          <div className="flex items-center gap-2 truncate">
            <Link to="/" className="hover:text-[#021C57] transition">
              Home
            </Link>
            <ChevronRight size={13} className="text-gray-400 shrink-0" />
            <Link to="/products" className="hover:text-[#021C57] transition">
              Laboratory Equipments
            </Link>
            
            {/* Equipment Type */}
            {equipmentTypeName && (
              <>
                <ChevronRight size={13} className="text-gray-400 shrink-0" />
                <Link
                  to={`/products?search=${encodeURIComponent(equipmentTypeName)}`}
                  className="hover:text-[#021C57] text-slate-600 font-medium truncate transition"
                >
                  {equipmentTypeName}
                </Link>
              </>
            )}

            {/* Category (Only if distinct from Equipment Type & Product Name) */}
            {product.category?.name &&
              product.category.name.trim().toLowerCase() !== (equipmentTypeName || "").trim().toLowerCase() &&
              product.category.name.trim().toLowerCase() !== (product.name || "").trim().toLowerCase() && (
                <>
                  <ChevronRight size={13} className="text-gray-400 shrink-0" />
                  <Link
                    to={`/categories/${product.category.slug}`}
                    className="hover:text-[#021C57] text-blue-700 font-semibold truncate transition"
                  >
                    {formatTitleCase(product.category.name)}
                  </Link>
                </>
              )}

            <ChevronRight size={13} className="text-gray-400 shrink-0" />
            <span className="text-gray-900 font-bold truncate max-w-[200px] sm:max-w-xs">
              {formatTitleCase(product.name)}
            </span>
          </div>

          <button
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium transition cursor-pointer text-xs shrink-0"
            title="Copy link"
          >
            <Share2 size={13} />
            <span className="hidden sm:inline">{copiedLink ? "Link Copied!" : "Share"}</span>
          </button>
        </div>
      </nav>

      {/* =====================================================
          2. MAIN PRODUCT HERO SECTION
      ===================================================== */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 pt-8 sm:pt-10">
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* ================= LEFT: IMAGE GALLERY ================= */}
          <div className="lg:col-span-6 space-y-4">
            
            {/* MAIN IMAGE CONTAINER */}
            <div className="relative bg-white rounded-3xl border border-gray-200/80 p-6 sm:p-8 shadow-sm group overflow-hidden flex items-center justify-center min-h-[380px] sm:min-h-[460px]">
              
              {/* ACCREDITATION BADGES OVERLAY */}
              <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#021C57] text-white text-[10px] font-bold tracking-wider shadow-md">
                  <Award size={12} className="text-cyan-300" /> ISO 9001:2015
                </span>
                {product.isFeatured && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500 text-white text-[10px] font-bold tracking-wider shadow-md">
                    <Sparkles size={12} /> Featured Lab Grade
                  </span>
                )}
              </div>

              {/* MAIN IMAGE */}
              <img
                src={currentImage}
                alt={product.name}
                className="max-h-[360px] sm:max-h-[420px] w-auto object-contain transition duration-500 group-hover:scale-105"
              />

            </div>

            {/* THUMBNAIL SELECTOR (IF MULTIPLE) */}
            {imagesList.length > 1 && (
              <div className="flex items-center gap-3 overflow-x-auto pb-2">
                {imagesList.map((imgUrl, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`w-20 h-20 rounded-2xl border-2 p-1.5 bg-white transition shrink-0 cursor-pointer overflow-hidden ${
                      selectedImageIndex === idx
                        ? "border-[#021C57] shadow-md scale-95"
                        : "border-gray-200 opacity-70 hover:opacity-100"
                    }`}
                  >
                    <img
                      src={imgUrl}
                      alt={`Thumbnail ${idx + 1}`}
                      className="w-full h-full object-contain"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* PRODUCT IDENTIFIERS: PRODUCT CODE & HSN CODE BADGE BOXES (BELOW IMAGE) */}
            {(product.productCode || product.hsnCode) && (
              <div className="grid grid-cols-2 gap-3 pt-1">
                {product.productCode && (
                  <div className="bg-white border border-blue-200 rounded-2xl p-3.5 shadow-2xs flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                        Product Code / SKU
                      </span>
                      <span className="text-xs sm:text-sm font-mono font-extrabold text-[#021C57]">
                        {product.productCode.toUpperCase()}
                      </span>
                    </div>
                    <span className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-mono text-[11px] font-black shrink-0">
                      SKU
                    </span>
                  </div>
                )}

                {product.hsnCode && (
                  <div className="bg-white border border-emerald-200 rounded-2xl p-3.5 shadow-2xs flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                        HSN Code
                      </span>
                      <span className="text-xs sm:text-sm font-mono font-extrabold text-emerald-800">
                        {product.hsnCode.toUpperCase()}
                      </span>
                    </div>
                    <span className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-mono text-[11px] font-black shrink-0">
                      HSN
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* INDUSTRIAL SERVICE PROMISES */}
            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="bg-white border border-gray-200/70 p-3.5 rounded-2xl text-center space-y-1">
                <Truck className="w-5 h-5 text-blue-600 mx-auto" />
                <div className="text-[11px] font-bold text-gray-800">Fast Delivery</div>
                <div className="text-[10px] text-gray-400">Safe & reliable dispatch</div>
              </div>

              <div className="bg-white border border-gray-200/70 p-3.5 rounded-2xl text-center space-y-1">
                <BadgeCheck className="w-5 h-5 text-emerald-600 mx-auto" />
                <div className="text-[11px] font-bold text-gray-800">Quality Tested</div>
                <div className="text-[10px] text-gray-400">Tested before dispatch</div>
              </div>

              <div className="bg-white border border-gray-200/70 p-3.5 rounded-2xl text-center space-y-1">
                <Building2 className="w-5 h-5 text-amber-600 mx-auto" />
                <div className="text-[11px] font-bold text-gray-800">Pan-India Support</div>
                <div className="text-[10px] text-gray-400">On-site engineer setup</div>
              </div>
            </div>

          </div>

          {/* ================= RIGHT: PRODUCT DETAILS & ACTIONS ================= */}
          <div className="lg:col-span-6 space-y-6">
            
            {/* CATEGORY & CODE */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Link
                to={`/categories/${product.category?.slug}`}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-blue-50 text-[#021C57] text-xs font-bold border border-blue-100 hover:bg-blue-100 transition"
              >
                <Layers size={13} /> {formatTitleCase(product.category?.equipmentType?.name || "Laboratory Instrument")}
              </Link>
            </div>

            {/* TITLE */}
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#021C57] leading-tight tracking-tight">
              {formatTitleCase(product.name)}
            </h1>

            {/* QUICK HIGHLIGHT BADGES */}
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1 rounded-lg font-semibold flex items-center gap-1">
                <CheckCircle2 size={13} className="text-emerald-600" /> Commercial Availability: Ready for Dispatch
              </span>
            </div>

            {/* DESCRIPTION */}
            <div className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-2xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                Operational Overview
              </h3>
              <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
                {product.description}
              </p>
            </div>

            

            {/* SPECIFICATIONS TEASER (FIRST 4 SPECS) */}
            {product.specifications && Object.keys(product.specifications).length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-gray-500 uppercase tracking-wide">
                  <span>Key Specifications</span>
                  <button
                    onClick={() => {
                      setActiveTab("specs");
                      const elem = document.getElementById("product-tabs");
                      if (elem) elem.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="text-blue-600 hover:underline cursor-pointer lowercase"
                  >
                    view all {Object.keys(product.specifications).length} specs →
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  {Object.entries(product.specifications)
                    .slice(0, 4)
                    .map(([key, val]) => (
                      <div
                        key={key}
                        className="bg-white border border-gray-200/80 p-3 rounded-xl shadow-2xs"
                      >
                        <div className="text-[11px] font-bold text-gray-400 truncate uppercase">
                          {formatTitleCase(key)}
                        </div>
                        <div className="text-xs font-bold text-[#021C57] truncate mt-0.5">
                          {val}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* ACTION BUTTONS ROW */}
            <div className="bg-white border border-gray-200/80 rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between text-xs font-semibold text-gray-500">
                <span>Enterprise Inquiries & Tender Supply</span>
                <span className="text-emerald-600 font-bold flex items-center gap-1">
                  ● Direct Manufacturer Pricing
                </span>
              </div>

              <div className="grid sm:grid-cols-3 gap-3">
                {/* 1. REQUEST QUOTE BUTTON */}
                <button
                  onClick={() => setOpenQuoteModal(true)}
                  className="w-full bg-[#021C57] hover:bg-[#03308f] text-white py-3.5 px-4 rounded-2xl font-bold transition shadow-md hover:shadow-lg flex items-center justify-center gap-2 text-xs sm:text-sm cursor-pointer active:scale-95"
                >
                  <Send size={15} /> Single Quote
                </button>

                {/* 2. ADD TO QUOTE BASKET */}
                <button
                  onClick={() => {
                    addItem(product, 1);
                    openCart();
                  }}
                  className={`w-full py-3.5 px-4 rounded-2xl font-bold transition shadow-xs flex items-center justify-center gap-2 text-xs sm:text-sm cursor-pointer active:scale-95 border ${
                    isInCart(product._id)
                      ? "bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100"
                      : "bg-blue-50 text-[#021C57] border-blue-200 hover:bg-blue-100"
                  }`}
                >
                  <ShoppingBag size={15} className={isInCart(product._id) ? "text-amber-600" : "text-blue-600"} />
                  <span>{isInCart(product._id) ? "In Basket (View)" : "Add to Basket"}</span>
                </button>

                {/* 3. DOWNLOAD PDF CATALOG */}
                <Link
                  to={`/products/${product.slug}/catalog`}
                  className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold py-3.5 px-4 rounded-2xl flex items-center justify-center gap-2 transition shadow-md hover:shadow-lg text-xs sm:text-sm cursor-pointer active:scale-95"
                >
                  <Download size={15} /> PDF Specsheet
                </Link>
              </div>

              {/* 3. WHATSAPP & PHONE CONTACT */}
              <div className="flex items-center gap-3 pt-2">
                <a
                  href={`https://wa.me/918169695728?text=Hello%20ARCL%20Team,%20I%20am%20interested%20in%20obtaining%20a%20technical%20quote%20for%20${encodeURIComponent(
                    formatTitleCase(product.name)
                  )}%20(SKU:%20${product.slug})`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition cursor-pointer"
                >
                  <MessageCircle size={15} className="text-emerald-600" />
                  Chat on WhatsApp
                </a>

                <a
                  href="tel:+918169695728"
                  className="flex-1 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition cursor-pointer"
                >
                  <PhoneCall size={15} className="text-[#021C57]" />
                  Call Engineering Desk
                </a>
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* =====================================================
          3. TABBED TECHNICAL SECTIONS
      ===================================================== */}
      <div id="product-tabs" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 mt-16 sm:mt-20">
        
        <div className="bg-white rounded-3xl border border-gray-200/80 shadow-sm overflow-hidden">
          
          {/* TAB HEADERS */}
          <div className="flex border-b border-gray-200 overflow-x-auto bg-gray-50/60 p-2 gap-2">
            {tabsList.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold transition cursor-pointer shrink-0 flex items-center gap-2 ${
                  activeTab === tab.id
                    ? "bg-white text-[#021C57] shadow-sm border border-gray-200/80"
                    : "text-gray-500 hover:text-gray-800 hover:bg-white/60"
                }`}
              >
                <span>{tab.label}</span>
                {typeof tab.count === "number" && tab.count > 0 && (
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded-full font-extrabold ${
                      activeTab === tab.id
                        ? "bg-blue-100 text-[#021C57]"
                        : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* TAB CONTENT BODY */}
          <div className="p-6 sm:p-10">
            
            {/* TAB 1: SPECIFICATIONS */}
            {activeTab === "specs" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-[#021C57]">
                    Technical Specifications Table
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Custom technical parameters and testing boundaries for this instrument.
                  </p>
                </div>

                {product.specifications && Object.keys(product.specifications).length > 0 ? (
                  <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-2xs">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-gray-50 border-b border-gray-200 text-xs font-bold uppercase tracking-wider text-gray-600">
                        <tr>
                          <th className="p-4 w-1/2">Technical Parameter</th>
                          <th className="p-4 w-1/2">Engineered Value / Range</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {Object.entries(product.specifications).map(([key, val], idx) => (
                          <tr
                            key={key}
                            className={`hover:bg-blue-50/30 transition ${
                              idx % 2 === 0 ? "bg-white" : "bg-gray-50/30"
                            }`}
                          >
                            <td className="p-4 font-semibold text-gray-800 flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                              {formatTitleCase(key)}
                            </td>
                            <td className="p-4 text-gray-700 font-mono text-xs sm:text-sm font-bold">
                              {val}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-8 text-center text-gray-400 bg-gray-50 rounded-2xl">
                    Standard laboratory specifications apply. Contact our engineering desk or request a quote for customized parameters.
                  </div>
                )}
              </div>
            )}

            {/* TAB: COMPLETE SET INCLUDES (STANDARD SUPPLY OUTFIT) */}
            {activeTab === "completeSet" && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <h3 className="text-xl font-bold text-[#021C57] flex items-center gap-2">
                    <span className="w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-sm font-black shadow-md">
                      ✓
                    </span>
                    Complete Set Includes (Standard Supply Outfit)
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Standard components, accessories, cables, and calibration documentation provided when purchasing this instrument.
                  </p>
                </div>

                {product.completeSetIncludes && product.completeSetIncludes.length > 0 ? (
                  <div className="bg-gradient-to-br from-emerald-50/60 to-teal-50/40 p-6 rounded-3xl border border-emerald-200/80 shadow-xs space-y-5">
                    <div className="grid sm:grid-cols-2 gap-3.5">
                      {product.completeSetIncludes.map((item, idx) => (
                        <div
                          key={idx}
                          className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-2xs hover:shadow-md hover:border-emerald-300 transition flex items-start gap-3.5"
                        >
                          <span className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-800 font-extrabold text-xs flex items-center justify-center shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <div>
                            <p className="text-sm font-bold text-gray-800 leading-snug">
                              {item}
                            </p>
                            <span className="inline-block mt-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                              Included in Standard Outfit
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="pt-3 border-t border-emerald-200/60 flex items-center justify-between flex-wrap gap-3 text-xs text-emerald-900 font-medium">
                      <span className="flex items-center gap-1.5 font-bold">
                        <CheckCircle2 size={15} className="text-emerald-600" />
                        All listed standard accessories are included in dispatch.
                      </span>
                      <span className="text-emerald-700">
                        Optional / customized accessories available on request.
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center text-gray-400 bg-gray-50 rounded-2xl">
                    Standard laboratory complete outfit details available on request.
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: FEATURES */}
            {activeTab === "features" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-[#021C57]">
                    Key Features & Design Advantages
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Purpose-built features designed for high-stress daily laboratory workflows.
                  </p>
                </div>

                {product.features && product.features.length > 0 ? (
                  <div className="grid sm:grid-cols-2 gap-4">
                    {product.features.map((feature, idx) => (
                      <div
                        key={idx}
                        className="bg-slate-50 border border-gray-200/80 p-4.5 rounded-2xl flex items-start gap-3.5 hover:bg-blue-50/40 hover:border-blue-200 transition"
                      >
                        <span className="w-7 h-7 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">
                          {idx + 1}
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-gray-800 leading-snug">
                            {feature}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 text-sm">No specific feature highlights listed.</p>
                )}
              </div>
            )}

            {/* TAB 3: APPLICATIONS */}
            {activeTab === "applications" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-[#021C57]">
                    Industrial & Laboratory Application Scope
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Verified for use across diverse civil and quality control applications.
                  </p>
                </div>

                {product.applications && product.applications.length > 0 ? (
                  <div className="grid sm:grid-cols-2 gap-4">
                    {product.applications.map((app, idx) => (
                      <div
                        key={idx}
                        className="bg-white border border-gray-200 p-4.5 rounded-2xl flex items-start gap-3 shadow-2xs hover:border-emerald-300 transition"
                      >
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                        <span className="text-sm font-medium text-gray-700 leading-relaxed">
                          {app}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 text-sm">General laboratory testing scope.</p>
                )}
              </div>
            )}

            {/* TAB 4: HOW IT WORKS */}
            {activeTab === "howItWorks" && hasHowItWorks && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-[#021C57] flex items-center gap-2">
                    <Cog className="w-5 h-5 text-amber-600" />
                    How It Works & Operating Mechanism
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Operating mechanism and procedural steps for the {formatTitleCase(product.category?.name)} category.
                  </p>
                </div>

                {categoryHowItWorks && (
                  <div className="bg-amber-50/50 border border-amber-200 p-5 rounded-2xl">
                    <p className="text-sm sm:text-base text-gray-800 leading-relaxed font-medium">
                      {categoryHowItWorks}
                    </p>
                  </div>
                )}

                {categoryHowItWorksSteps && categoryHowItWorksSteps.length > 0 && (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                    {categoryHowItWorksSteps.map((step, idx) => (
                      <div
                        key={idx}
                        className="bg-white p-5 rounded-2xl border border-amber-200/80 shadow-2xs hover:shadow-md transition space-y-2 relative overflow-hidden"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="w-7 h-7 rounded-xl bg-amber-500 text-white font-bold text-xs flex items-center justify-center shrink-0">
                            {step.stepNumber || idx + 1}
                          </span>
                          <h4 className="font-bold text-sm text-[#021C57] line-clamp-1">
                            {step.title || `Step ${idx + 1}`}
                          </h4>
                        </div>

                        {step.description && (
                          <p className="text-xs text-gray-600 leading-relaxed pl-9">
                            {step.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 5: COMPLIANCE */}
            {activeTab === "compliance" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-[#021C57]">
                    Testing Standards & Quality Certifications
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Accredited and calibrated to conform to leading national and international test methods.
                  </p>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { code: "ISO 9001:2015", desc: "Certified Quality Management System in Manufacturing" },
                    { code: "ISO/IEC 17025", desc: "Competence of Testing & Calibration Laboratories" },
                    { code: "IS Standard Alignment", desc: "Built to match Bureau of Indian Standards (BIS) specifications" },
                    { code: "ASTM / BS / EN", desc: "Compliant with Global International Material Testing Standards" },
                  ].map((std) => (
                    <div
                      key={std.code}
                      className="bg-blue-50/50 border border-blue-100 p-5 rounded-2xl space-y-2"
                    >
                      <div className="inline-block px-2.5 py-1 rounded-md bg-[#021C57] text-white font-bold text-xs">
                        {std.code}
                      </div>
                      <p className="text-xs text-gray-600 leading-relaxed">{std.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

        </div>
      </div>

      {/* =====================================================
          4. RELATED EQUIPMENT IN THIS CATEGORY
      ===================================================== */}
      {relatedProducts.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 mt-16 sm:mt-20 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-extrabold text-[#021C57]">
                Related {equipmentTypeName || formatTitleCase(product.category?.name)} Equipment
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Explore complementary testing instruments for your laboratory setup.
              </p>
            </div>

            <Link
              to={`/categories/${product.category?.slug}`}
              className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition cursor-pointer"
            >
              View Category <ChevronRight size={14} />
            </Link>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {relatedProducts.map((rel) => (
              <div
                key={rel._id}
                className="bg-white border border-gray-200/80 rounded-3xl p-5 shadow-2xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
              >
                <div className="space-y-3">
                  <div className="h-44 bg-gray-50 rounded-2xl overflow-hidden p-3 flex items-center justify-center">
                    <img
                      src={rel.images?.[0] || "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&q=80&w=400"}
                      alt={rel.name}
                      className="max-h-full max-w-full object-contain group-hover:scale-105 transition duration-500"
                    />
                  </div>

                  <h3 className="font-bold text-[#021C57] text-base line-clamp-1 group-hover:text-blue-600 transition">
                    {formatTitleCase(rel.name)}
                  </h3>

                  <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                    {rel.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-gray-100 flex items-center gap-2 mt-4">
                  <Link
                    to={`/products/${rel.slug}`}
                    className="flex-1 text-center py-2 px-3 rounded-xl bg-[#021C57] text-white text-xs font-bold hover:bg-blue-900 transition"
                  >
                    View Details
                  </Link>

                  <Link
                    to={`/products/${rel.slug}/catalog`}
                    className="p-2 rounded-xl border border-gray-200 text-gray-600 hover:text-[#021C57] hover:bg-gray-50 transition"
                    title="PDF Catalog"
                  >
                    <FileText size={15} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* =====================================================
          5. REQUEST QUOTATION MODAL
      ===================================================== */}
      {openQuoteModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative bg-white rounded-3xl w-full max-w-4xl max-h-[92vh] overflow-y-auto shadow-2xl border border-gray-100 animate-fade-in">
            
            {/* CLOSE BUTTON */}
            <button
              onClick={() => setOpenQuoteModal(false)}
              className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-gray-100 hover:bg-red-50 text-gray-500 hover:text-red-600 flex items-center justify-center transition cursor-pointer shadow-xs"
            >
              <X size={18} />
            </button>

            <div className="grid lg:grid-cols-12">
              
              {/* LEFT SUMMARY PANEL */}
              <div className="lg:col-span-5 bg-gradient-to-br from-[#021C57] to-[#042878] text-white p-6 sm:p-8 flex flex-col justify-between">
                <div className="space-y-5">
                  
                  <div className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-cyan-300 bg-white/10 px-3 py-1 rounded-full">
                    <Package size={12} /> Official Quotation Request
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-white leading-snug">
                      {formatTitleCase(product.name)}
                    </h3>
                    <p className="text-xs text-blue-200 mt-1">
                      Category: {formatTitleCase(product.category?.name)}
                    </p>
                  </div>

                  <div className="bg-white/10 rounded-2xl p-4 border border-white/15 flex items-center justify-center h-44 overflow-hidden">
                    <img
                      src={currentImage}
                      alt={product.name}
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>

                  <div className="space-y-2 text-xs text-blue-100">
                    <div className="flex items-center gap-2">
                      <ShieldCheck size={14} className="text-cyan-300 shrink-0" />
                      <span>Formal GST quotation with full HSN code</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-cyan-300 shrink-0" />
                      <span>NABL-traceable calibration certificate</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock size={14} className="text-cyan-300 shrink-0" />
                      <span>Response within 2 - 4 business hours</span>
                    </div>
                  </div>

                </div>

                <div className="pt-6 border-t border-white/10 text-[11px] text-blue-200">
                  Direct Desk: <strong className="text-white">+91 81696 95728</strong>
                </div>
              </div>

              {/* RIGHT FORM PANEL */}
              <div className="lg:col-span-7 p-6 sm:p-8 space-y-5">
                
                <div>
                  <h3 className="text-xl font-bold text-[#021C57]">
                    Fill in Your Details
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Our sales engineers will prepare and send the official quotation to your email.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-gray-700">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="customerName"
                        required
                        value={formData.customerName}
                        onChange={handleChange}
                        placeholder="e.g. Dr. Rajesh Sharma"
                        className="w-full mt-1 border border-gray-200 rounded-xl p-3 text-xs outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 transition"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-gray-700">
                        Email Address <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="name@organization.com"
                        className="w-full mt-1 border border-gray-200 rounded-xl p-3 text-xs outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 transition"
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-gray-700">
                        Phone / WhatsApp <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        required
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="+91 98765 43210"
                        className="w-full mt-1 border border-gray-200 rounded-xl p-3 text-xs outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 transition"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-gray-700">
                        Company / Institute
                      </label>
                      <input
                        type="text"
                        name="company"
                        value={formData.company}
                        onChange={handleChange}
                        placeholder="e.g. IIT Bombay / L&T Labs"
                        className="w-full mt-1 border border-gray-200 rounded-xl p-3 text-xs outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-700">
                      Quantity Required
                    </label>
                    <div className="flex items-center gap-3 mt-1">
                      <button
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            quantity: Math.max(1, (parseInt(prev.quantity) || 1) - 1),
                          }))
                        }
                        className="w-10 h-10 rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-center font-bold text-gray-700 hover:bg-gray-100 transition cursor-pointer"
                      >
                        <Minus size={14} />
                      </button>

                      <input
                        type="number"
                        name="quantity"
                        min="1"
                        value={formData.quantity}
                        onChange={handleChange}
                        className="w-20 border border-gray-200 rounded-xl p-2.5 text-center text-xs font-bold outline-none"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            quantity: (parseInt(prev.quantity) || 1) + 1,
                          }))
                        }
                        className="w-10 h-10 rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-center font-bold text-gray-700 hover:bg-gray-100 transition cursor-pointer"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-700">
                      Project Notes / Technical Specifications
                    </label>
                    <textarea
                      name="message"
                      rows="3"
                      value={formData.message}
                      onChange={handleChange}
                      placeholder="Specify test capacity, calibration requirements or delivery timeframe..."
                      className="w-full mt-1 border border-gray-200 rounded-xl p-3 text-xs outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 transition"
                    ></textarea>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={inquiryLoading}
                      className="w-full bg-[#021C57] hover:bg-[#03308f] text-white py-3.5 px-6 rounded-2xl font-bold transition shadow-md hover:shadow-lg flex items-center justify-center gap-2 text-xs uppercase tracking-wider disabled:opacity-50 cursor-pointer"
                    >
                      {inquiryLoading ? "Submitting Inquiry..." : "Submit Quotation Request"}
                    </button>
                  </div>

                </form>

              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default ProductDetailsPage;
