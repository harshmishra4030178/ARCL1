"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  Calendar,
  Clock,
  User,
  Share2,
  ChevronRight,
  BookOpen,
  ArrowLeft,
  MessageCircle,
  FileDown,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  Copy,
  Check,
  ShieldCheck,
} from "lucide-react";
import { useBlogStore } from "../store/useBlogStore";
import { useProductStore } from "../store/useProductStore";
import { STANDARDS_DATA } from "../data/standardsData";
import { sendProductToWhatsApp } from "../utils/whatsappQuote";
import { generateQuotationPdf } from "../utils/quotationPdfGenerator";
import { parseRichContentToHtml } from "../utils/richContentParser";

export default function BlogDetailsPage({ initialSlug, initialBlog }) {
  const { currentBlog, relatedBlogs, fetchBlogBySlug, isLoading } = useBlogStore();
  const { products, fetchProducts } = useProductStore();
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [activeSection, setActiveSection] = useState("");

  const blog = currentBlog || initialBlog;

  useEffect(() => {
    setMounted(true);
    if (!products || products.length === 0) {
      fetchProducts();
    }
    if (initialSlug) {
      fetchBlogBySlug(initialSlug);
    }
  }, [initialSlug, fetchBlogBySlug, fetchProducts, products]);

  // Find related matching products from the store or from real STANDARDS_DATA equipment
  const matchedProducts = useMemo(() => {
    // 1. Try matching from store products by SKU codes
    if (products && products.length > 0 && blog?.relatedProductSkus?.length > 0) {
      const found = products.filter((p) =>
        blog.relatedProductSkus.includes(p.productCode)
      );
      if (found.length > 0) return found.slice(0, 3);
    }

    // 2. High-precision fallback from real STANDARDS_DATA Cloudinary items
    const allStdEquip = STANDARDS_DATA.flatMap((s) => s.requiredEquipment);
    if (blog?.relatedProductSkus?.length > 0) {
      const stdMatches = allStdEquip.filter((eq) =>
        blog.relatedProductSkus.includes(eq.code)
      );
      if (stdMatches.length > 0) {
        return stdMatches.map((eq) => ({
          name: eq.name,
          productCode: eq.code,
          slug: eq.slug,
          images: [eq.image],
        })).slice(0, 3);
      }
    }

    // 3. Fallback to top concrete / soil equipment
    return allStdEquip.slice(0, 3).map((eq) => ({
      name: eq.name,
      productCode: eq.code,
      slug: eq.slug,
      images: [eq.image],
    }));
  }, [products, blog]);

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleWhatsAppShare = () => {
    if (typeof window !== "undefined" && blog) {
      const url = encodeURIComponent(window.location.href);
      const text = encodeURIComponent(`*${blog.title}*\n\nRead this technical testing guide on ARCL Instruments:\n${window.location.href}`);
      window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
    }
  };

  if (!blog && isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm font-semibold text-slate-600">Loading technical guide...</p>
        </div>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
        <div className="text-center max-w-md bg-white p-8 rounded-2xl border border-slate-200 shadow-lg">
          <h2 className="text-xl font-bold text-slate-900 mb-2">Article Not Found</h2>
          <p className="text-sm text-slate-600 mb-6">
            The requested technical guide could not be located.
          </p>
          <Link
            href="/blog"
            className="px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 inline-flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Blog Hub
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      {/* Article Top Navigation Breadcrumb */}
      <div className="bg-white border-b border-slate-200 sticky top-16 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-slate-500 truncate">
              <Link href="/" className="hover:text-slate-900">Home</Link>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <Link href="/blog" className="hover:text-slate-900 font-medium">Knowledge Hub</Link>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-amber-700 font-semibold truncate max-w-[200px] sm:max-w-xs">{blog.category}</span>
            </div>

            <Link
              href="/blog"
              className="inline-flex items-center gap-1 text-xs font-bold text-slate-700 hover:text-amber-600 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> All Guides
            </Link>
          </div>
        </div>
      </div>

      {/* Main Article Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 lg:pt-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Main Content Column (8 cols) */}
          <main className="lg:col-span-8">
            <article className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-10">
              {/* Category Badge & Meta */}
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <span className="px-3 py-1 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-800 text-xs font-bold uppercase tracking-wide">
                  {blog.category}
                </span>
                <span className="flex items-center gap-1 text-xs text-slate-500">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  {mounted && blog.publishedAt
                    ? new Date(blog.publishedAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })
                    : "Latest Guide"}
                </span>
                <span className="flex items-center gap-1 text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                  <Clock className="w-3.5 h-3.5" />
                  {blog.readTime}
                </span>
              </div>

              {/* Title */}
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight mb-6">
                {blog.title}
              </h1>

              {/* Author & Share Bar */}
              <div className="flex flex-wrap items-center justify-between gap-4 py-4 border-y border-slate-100 mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-900 text-amber-400 flex items-center justify-center font-bold text-sm shadow">
                    {blog.author?.name?.charAt(0) || "A"}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900">{blog.author?.name}</div>
                    <div className="text-xs text-slate-500">{blog.author?.role}</div>
                  </div>
                </div>

                {/* Social Share Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleWhatsAppShare}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 text-xs font-bold transition-all shadow-sm"
                  >
                    <MessageCircle className="w-4 h-4" /> Share on WhatsApp
                  </button>
                  <button
                    onClick={handleCopyLink}
                    className="p-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs transition-colors"
                    title="Copy Article Link"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Featured Image */}
              {blog.featuredImage && (
                <div className="mb-8 rounded-xl bg-slate-950 p-6 flex items-center justify-center border border-slate-800 shadow-inner">
                  <img
                    src={blog.featuredImage}
                    alt={blog.title}
                    onError={(e) => {
                      e.currentTarget.src = "https://res.cloudinary.com/domeeznqa/image/upload/v1788261941/products/rwv9chfcohdlnj0zvsgk.jpg";
                    }}
                    className="max-h-80 w-auto object-contain"
                  />
                </div>
              )}

              {/* Table of Contents (Mobile & Tablet) */}
              {blog.tableOfContents && blog.tableOfContents.length > 0 && (
                <div className="lg:hidden mb-8 p-5 bg-amber-50/60 border border-amber-200/80 rounded-xl">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-900 uppercase tracking-wide mb-3">
                    <BookOpen className="w-4 h-4 text-amber-600" />
                    <span>Table of Contents</span>
                  </div>
                  <ul className="space-y-2 text-xs sm:text-sm">
                    {blog.tableOfContents.map((toc) => (
                      <li key={toc.id}>
                        <a
                          href={`#${toc.id}`}
                          className="text-slate-700 hover:text-amber-700 font-medium hover:underline block"
                        >
                          {toc.text}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Excerpt Lead Paragraph */}
              <div className="text-base sm:text-lg font-medium text-slate-700 leading-relaxed bg-slate-50 p-4 sm:p-5 rounded-xl border-l-4 border-amber-500 mb-8">
                {blog.excerpt}
              </div>

              {/* Article Markdown Body */}
              <div
                className="prose prose-slate max-w-none text-slate-700"
                dangerouslySetInnerHTML={{
                  __html: parseRichContentToHtml(blog.content),
                }}
              />

              {/* Standards Tags */}
              {blog.relatedStandards && blog.relatedStandards.length > 0 && (
                <div className="mt-12 pt-6 border-t border-slate-200">
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                    Compliant Testing Standards
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {blog.relatedStandards.map((std) => (
                      <span
                        key={std}
                        className="px-3 py-1 rounded-md bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold"
                      >
                        {std}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </article>
          </main>

          {/* Sticky Sidebar (4 cols) */}
          <aside className="lg:col-span-4 space-y-6">
            
            {/* Table of Contents (Desktop Sticky) */}
            {blog.tableOfContents && blog.tableOfContents.length > 0 && (
              <div className="hidden lg:block bg-white rounded-xl border border-slate-200 p-6 shadow-sm sticky top-28">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100">
                  <BookOpen className="w-4 h-4 text-amber-600" />
                  <span>Contents in this Guide</span>
                </div>
                <nav className="space-y-2.5 text-xs text-slate-600">
                  {blog.tableOfContents.map((toc) => (
                    <a
                      key={toc.id}
                      href={`#${toc.id}`}
                      className="block hover:text-amber-600 hover:translate-x-1 transition-transform font-medium leading-normal"
                    >
                      {toc.text}
                    </a>
                  ))}
                </nav>
              </div>
            )}

            {/* Smart Product Cross-Sell Card (Interactive Factory Quotations) */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-950 rounded-2xl border border-slate-800 p-6 text-white shadow-xl">
              <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-3">
                <ShieldCheck className="w-4 h-4" />
                <span>Certified Apparatus For This Test</span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">
                Need Apparatus for this Test?
              </h3>
              <p className="text-xs text-slate-300 mb-5 leading-relaxed">
                Get factory-direct pricing with NABL-traceable calibration certificates from ARCL Instruments.
              </p>

              {/* Matched Products List */}
              <div className="space-y-3 mb-5">
                {matchedProducts.map((prod) => (
                  <div
                    key={prod.slug}
                    className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-between gap-3 group hover:border-amber-400 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 rounded-lg bg-slate-900 flex-shrink-0 flex items-center justify-center p-1">
                        <img
                          src={Array.isArray(prod.images) ? prod.images[0] : "/assets/LOGO.png"}
                          alt={prod.name}
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-white group-hover:text-amber-400 truncate">
                          {prod.name}
                        </h4>
                        <p className="text-[11px] text-slate-400 font-mono">
                          {prod.productCode || "ARCL Certified"}
                        </p>
                      </div>
                    </div>

                    <Link
                      href={`/products/${prod.slug}`}
                      className="px-2.5 py-1 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 text-[11px] font-bold flex-shrink-0 transition-colors"
                    >
                      View
                    </Link>
                  </div>
                ))}
              </div>

              {/* Direct WhatsApp Quote CTA */}
              <a
                href={`https://api.whatsapp.com/send?phone=918169695728&text=${encodeURIComponent(
                  `Hello ARCL Instruments, I read your technical guide on "${blog.title}". Please send me complete equipment pricing and catalogue.`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg flex items-center justify-center gap-2 transition-all"
              >
                <MessageCircle className="w-4 h-4" /> Request WhatsApp Package Quote
              </a>
            </div>

            {/* Standards Hub Banner */}
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-6 text-slate-900">
              <h4 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>Looking for other IS Standards?</span>
              </h4>
              <p className="text-xs text-slate-600 mb-4">
                Access 18+ Civil Engineering testing standards and download 1-click test BOQ estimates.
              </p>
              <Link
                href="/standards"
                className="block text-center py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 text-xs font-bold shadow transition-all"
              >
                Open Testing Standards Hub →
              </Link>
            </div>
          </aside>
        </div>

        {/* Related Articles Section */}
        {relatedBlogs && relatedBlogs.length > 0 && (
          <section className="mt-16 pt-10 border-t border-slate-200">
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-amber-600" />
              <span>Related Civil Testing Guides</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedBlogs.map((rb) => (
                <Link
                  key={rb.slug}
                  href={`/blog/${rb.slug}`}
                  className="group block bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-lg hover:border-amber-400 transition-all"
                >
                  <div className="text-[11px] font-bold text-amber-700 uppercase mb-2">
                    {rb.category}
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 group-hover:text-amber-600 line-clamp-2 mb-2">
                    {rb.title}
                  </h4>
                  <p className="text-xs text-slate-600 line-clamp-2 mb-4">
                    {rb.excerpt}
                  </p>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-3 border-t border-slate-100">
                    <span>{rb.readTime}</span>
                    <span className="font-bold text-amber-600 group-hover:translate-x-1 transition-transform">Read →</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
