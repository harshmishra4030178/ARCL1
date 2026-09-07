"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  BookOpen,
  Search,
  Clock,
  Calendar,
  User,
  ArrowRight,
  BookmarkCheck,
  Tag,
  ChevronRight,
  FileText,
  Sparkles,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import { useBlogStore } from "../store/useBlogStore";
import { useCategoryStore } from "../store/useCategoryStore";
import { useEquipmentTypeStore } from "../store/useEquipmentTypeStore";
import { formatTitleCase } from "../utils/stringUtils";

export default function BlogListPage() {
  const { blogs, fetchBlogs, isLoading } = useBlogStore();
  const { categories, fetchCategories } = useCategoryStore();
  const { equipmentTypes, fetchEquipmentTypes } = useEquipmentTypeStore();

  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchBlogs({ category: selectedCategory, search: searchQuery });
    fetchCategories();
    fetchEquipmentTypes();
  }, [selectedCategory, searchQuery, fetchBlogs, fetchCategories, fetchEquipmentTypes]);

  // Dynamically build category pills ONLY from real Equipment Types and Blog categories
  const dynamicCategories = useMemo(() => {
    const list = [];
    const seen = new Set();
    list.push("All");
    seen.add("all");

    // 1. Only real defined Equipment Types
    (equipmentTypes || []).forEach((eq) => {
      if (eq?.name) {
        const formatted = formatTitleCase(eq.name.trim());
        if (!seen.has(formatted.toLowerCase())) {
          seen.add(formatted.toLowerCase());
          list.push(formatted);
        }
      }
    });

    // 2. Plus any categories from blogs
    (blogs || []).forEach((b) => {
      if (b?.category) {
        const formatted = formatTitleCase(b.category.trim());
        if (!seen.has(formatted.toLowerCase())) {
          seen.add(formatted.toLowerCase());
          list.push(formatted);
        }
      }
    });

    return list;
  }, [equipmentTypes, blogs]);

  // Featured blog is ONLY shown on 'All' tab with no search query
  const isAllView = selectedCategory === "All" && !searchQuery.trim();

  const featuredBlog = useMemo(() => {
    if (!isAllView) return null;
    return blogs.find((b) => b.isFeatured) || blogs[0] || null;
  }, [blogs, isAllView]);

  const listBlogs = useMemo(() => {
    if (isAllView && featuredBlog) {
      return blogs.filter((b) => b.slug !== featuredBlog.slug);
    }
    return blogs;
  }, [blogs, featuredBlog, isAllView]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      {/* Hero Header */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950 text-white py-16 md:py-24 border-b border-amber-500/20">
        <div className="absolute inset-0 bg-[radial-gradient(#eab308_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-400/30 text-amber-300 text-xs font-bold tracking-wide uppercase mb-6 backdrop-blur-md">
              <BookOpen className="w-4 h-4" />
              <span>ARCL Technical Knowledge Hub</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-tight mb-5">
              Civil Engineering & <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-200">
                Material Testing Guides
              </span>
            </h1>
            <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl mb-8">
              Authoritative laboratory test procedures, Indian Standards (IS Codes), calibration methods, and civil QA/QC benchmarks compiled by industry specialists.
            </p>

            {/* Search Input Bar */}
            <div className="relative max-w-xl">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                <Search className="w-5 h-5" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search procedures, IS codes, e.g. 'IS 516', 'CBR', 'Vicat'..."
                className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-slate-900/80 border border-slate-700/80 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-400 shadow-xl backdrop-blur-md text-sm transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-xs text-slate-400 hover:text-white"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Category Pills Bar */}
      <section className="sticky top-16 z-20 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
            {dynamicCategories.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? "bg-slate-900 text-amber-400 shadow-md ring-1 ring-slate-800"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        {/* Featured Article Card */}
        {featuredBlog && selectedCategory === "All" && !searchQuery && (
          <section className="mb-14">
            <div className="flex items-center gap-2 mb-4 text-xs font-bold text-amber-600 uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Featured Master Guide</span>
            </div>
            <Link
              href={`/blog/${featuredBlog.slug}`}
              className="group block bg-white rounded-2xl border border-slate-200/90 shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden"
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
                <div className="lg:col-span-6 relative aspect-[16/10] lg:aspect-auto overflow-hidden bg-slate-900 flex items-center justify-center p-6">
                  {featuredBlog.featuredImage ? (
                    <img
                      src={featuredBlog.featuredImage}
                      alt={featuredBlog.title}
                      className="w-full h-full max-h-80 object-contain group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-500">
                      <FileText className="w-16 h-16" />
                    </div>
                  )}
                  <span className="absolute top-4 left-4 px-3 py-1 rounded-md bg-amber-500 text-slate-950 text-xs font-bold shadow-md uppercase tracking-wider">
                    {formatTitleCase(featuredBlog.category)}
                  </span>
                </div>

                <div className="lg:col-span-6 p-6 sm:p-8 lg:p-10 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-4 text-xs text-slate-500 mb-3">
                      <span className="flex items-center gap-1.5 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {mounted && featuredBlog.publishedAt
                          ? new Date(featuredBlog.publishedAt).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })
                          : "Latest Guide"}
                      </span>
                      <span className="flex items-center gap-1.5 font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                        <Clock className="w-3.5 h-3.5" />
                        {featuredBlog.readTime}
                      </span>
                    </div>

                    <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 group-hover:text-amber-600 transition-colors leading-snug mb-4">
                      {featuredBlog.title}
                    </h2>

                    <p className="text-sm sm:text-base text-slate-600 line-clamp-3 leading-relaxed mb-6">
                      {featuredBlog.excerpt}
                    </p>

                    {/* Standards & Tags */}
                    {featuredBlog.relatedStandards && (
                      <div className="flex flex-wrap gap-1.5 mb-6">
                        {featuredBlog.relatedStandards.slice(0, 3).map((st) => (
                          <span
                            key={st}
                            className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200"
                          >
                            {st}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold">
                        {featuredBlog.author?.name?.charAt(0) || "A"}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900">{featuredBlog.author?.name}</div>
                        <div className="text-[11px] text-slate-500">{featuredBlog.author?.role}</div>
                      </div>
                    </div>

                    <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 group-hover:translate-x-1 transition-transform">
                      Read Full Guide <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          </section>
        )}

        {/* Articles Grid */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-amber-600" />
              <span>
                {selectedCategory === "All" ? "All Technical Articles" : `${selectedCategory} Articles`}
              </span>
              <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full ml-2">
                {listBlogs.length}
              </span>
            </h2>
          </div>

          {listBlogs.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300 p-8">
              <Search className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-slate-800 mb-1">No articles found</h3>
              <p className="text-sm text-slate-500 mb-4">
                No articles match your search filter "{searchQuery}".
              </p>
              <button
                onClick={() => {
                  setSelectedCategory("All");
                  setSearchQuery("");
                }}
                className="px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {listBlogs.map((blog) => (
                <article
                  key={blog.slug}
                  className="group flex flex-col bg-white rounded-xl border border-slate-200/90 shadow-sm hover:shadow-xl hover:border-amber-400/60 transition-all duration-300 overflow-hidden"
                >
                  <Link href={`/blog/${blog.slug}`} className="block relative aspect-[16/10] bg-slate-900 overflow-hidden p-4">
                    <img
                      src={blog.featuredImage || "https://res.cloudinary.com/domeeznqa/image/upload/v1788261941/products/rwv9chfcohdlnj0zvsgk.jpg"}
                      alt={blog.title}
                      onError={(e) => {
                        e.currentTarget.src = "https://res.cloudinary.com/domeeznqa/image/upload/v1788261941/products/rwv9chfcohdlnj0zvsgk.jpg";
                      }}
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                    />
                    <span className="absolute top-3 left-3 px-2.5 py-0.5 rounded bg-slate-900/90 backdrop-blur-sm text-amber-400 text-[11px] font-bold border border-slate-700 shadow">
                      {formatTitleCase(blog.category)}
                    </span>
                  </Link>

                  <div className="p-5 sm:p-6 flex flex-col flex-1 justify-between">
                    <div>
                      <div className="flex items-center gap-3 text-[11px] text-slate-500 mb-2.5">
                        <span className="flex items-center gap-1 font-medium">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          {mounted && blog.publishedAt
                            ? new Date(blog.publishedAt).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })
                            : "Latest Guide"}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1 text-slate-600 font-medium">
                          <Clock className="w-3 h-3" />
                          {blog.readTime}
                        </span>
                      </div>

                      <Link href={`/blog/${blog.slug}`}>
                        <h3 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-amber-600 transition-colors leading-snug mb-2.5 line-clamp-2">
                          {blog.title}
                        </h3>
                      </Link>

                      <p className="text-xs sm:text-sm text-slate-600 line-clamp-3 leading-relaxed mb-4">
                        {blog.excerpt}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-500 truncate max-w-[140px]">
                        {blog.author?.name}
                      </span>
                      <Link
                        href={`/blog/${blog.slug}`}
                        className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 group-hover:text-amber-700 transition-colors"
                      >
                        Read Article <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* Technical Authority Banner */}
        <section className="mt-16 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-8 sm:p-10 text-white border border-slate-800 shadow-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="max-w-3xl relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-amber-500/20 text-amber-300 text-xs font-bold uppercase mb-4">
              <ShieldCheck className="w-4 h-4" />
              <span>IS, ASTM & BS Compliant Instrumentation</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white mb-3">
              Need certified testing machines for your laboratory?
            </h3>
            <p className="text-sm sm:text-base text-slate-300 mb-6">
              ARCL Instruments manufactures complete, certified testing setups with NABL-traceable calibration for concrete, soil, bitumen, and cement testing labs across India.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/standards"
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs sm:text-sm font-bold shadow-lg transition-all"
              >
                Browse Testing Standards (IS Codes) →
              </Link>
              <Link
                href="/contact"
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs sm:text-sm font-semibold border border-slate-700 transition-all"
              >
                Request Custom Lab Quote
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
