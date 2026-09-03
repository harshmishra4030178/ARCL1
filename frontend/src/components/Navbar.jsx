"use client";

import { Menu, X, ShoppingBag } from "lucide-react";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, NavLink } from "../utils/navigation.jsx";

const logo = "/assets/LOGO.png";

import { FaPhoneAlt } from "react-icons/fa";

import "../index.css";

import { useCategoryStore } from "../store/useCategoryStore.js";
import { useQuoteCartStore } from "../store/useQuoteCartStore.js";

import AmazonSearchBar from "./common/AmazonSearchBar.jsx";

const Navbar = () => {
  const { openCart, getItemCount } = useQuoteCartStore();
  const cartItemCount = getItemCount();

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navLinks = [
    {
      name: "Home",
      to: "/",
    },
    {
      name: "Laboratory Equipments",
      to: "/products",
    },
    {
      name: "Catalog",
      to: "/catalog",
    },
    {
      name: "Calibration Services",
      to: "/calibration-services",
    },
    {
      name: "About",
      to: "/about",
    },
    {
      name: "Company Profile",
      to: "/arclcompany.pdf",
      isExternal: true,
    },
    {
      name: "Contact",
      to: "/contact",
    },
  ];

  return (
    <>
      <header className="h-28 sm:h-30 w-full">
        <div className="fixed top-0 left-0 right-0 z-50 h-28 sm:h-30 bg-white">
          {/* TOP BAR WITH AMAZON SEARCH & CONTACT */}
          <div className="upper-layer h-1/2 flex justify-between items-center bg-zinc-100 shadow-2xs px-3 sm:px-6 gap-2 sm:gap-4">
            
            {/* AMAZON SEARCH BAR */}
            <div className="flex-1 max-w-2xl">
              <AmazonSearchBar />
            </div>

            {/* PHONE & QUOTE BASKET */}
            <div className="flex justify-center items-center gap-2 sm:gap-4 shrink-0">
              <a
                className="text-[#021C57] font-semibold hover:underline transition flex items-center gap-1.5 text-xs sm:text-sm"
                href="tel:+918169695728"
              >
                <FaPhoneAlt className="text-amber-500 w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden md:inline">+91 8169695728</span>
              </a>

              {/* QUOTE BASKET BUTTON */}
              <button
                onClick={openCart}
                className="inline-flex items-center gap-1.5 sm:gap-2 bg-[#021C57] hover:bg-[#032d88] text-white px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer active:scale-95"
                title="View Multi-Product Quote Basket"
              >
                <ShoppingBag size={14} className="text-amber-400" />
                <span className="hidden sm:inline">Quote Basket</span>
                {cartItemCount > 0 ? (
                  <span className="bg-amber-400 text-gray-900 text-[10px] font-black px-1.5 py-0.2 rounded-full">
                    {cartItemCount}
                  </span>
                ) : (
                  <span className="text-[10px] text-blue-200">(0)</span>
                )}
              </button>
            </div>
          </div>

          {/* NAVBAR */}

          <nav
            className="
          flex
          justify-between
          items-center
          h-1/2
          px-5
          py-3.5
          shadow-md
          shadow-black/50
          bg-white
        "
          >
            <div
              className="
            flex
            justify-between
            items-center
            w-full
          "
            >
              {/* LOGO */}

              <div className="logo-section">
                <Link
                  to="/"
                  className="
                flex
                items-center
                justify-center
                gap-2
              "
                >
                  <img
                    src={logo}
                    alt="logo"
                    className="
                  w-20
                  mix-blend-darken
                "
                  />

                  <div
                    className="
                  flex
                  flex-col
                  text-[#021C57]
                "
                  >
                    <p
                      className="
                    font-semibold
                    font-saira
                  "
                    >
                      ARCL INSTRUMENTS PVT. LTD
                    </p>

                    <p
                      className="
                    text-[8px]
                    md:text-[10px]
                    text-center
                  "
                    >
                      ( An ISO 9001:2015 Certified Company )
                    </p>
                  </div>
                </Link>
              </div>

              {/* DESKTOP MENU */}

              <div
                className="
              hidden
              lg:flex
              items-center
              gap-6
            "
              >
                {navLinks.map((link) =>
                  link.isExternal ? (
                    <a
                      key={link.name}
                      href={link.to}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium px-2 py-1 text-gray-700 hover:text-[#021C57] transition-all"
                    >
                      {link.name}
                    </a>
                  ) : (
                    <NavLink
                      key={link.name}
                      to={link.to}
                      className={({ isActive }) =>
                        `
                        font-medium
                        px-2
                        py-1
                        transition-all

                        ${
                          isActive
                            ? "text-[#021C57] border-b-2 border-[#021C57]"
                            : "text-gray-700 hover:text-[#021C57]"
                        }
                      `
                      }
                    >
                      {link.name}
                    </NavLink>
                  )
                )}
              </div>

              {/* MOBILE MENU */}

              <div className="lg:hidden">
                <button onClick={() => setIsMenuOpen(true)}>
                  <Menu size={24} />
                </button>
              </div>
            </div>

            {/* MOBILE SIDEBAR */}

            {isMenuOpen && (
              <div
                className="
                fixed
                top-0
                left-0
                h-screen
                w-1/2
                sm:w-1/2
                bg-white
                shadow-lg
                z-50
                p-4
                flex
                flex-col
                gap-4
              "
              >
                {/* CLOSE */}
                <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                  <span className="text-xs font-bold text-[#021C57] uppercase tracking-wider">
                    Menu & Search
                  </span>
                  <button
                    onClick={() => setIsMenuOpen(false)}
                    className="p-1 rounded-md text-gray-500 hover:bg-gray-100"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* MOBILE SEARCH BAR */}
                <div className="my-1">
                  <AmazonSearchBar isMobile={true} />
                </div>

                {/* MOBILE LINKS */}

                {navLinks.map((link) =>
                  link.isExternal ? (
                    <a
                      key={link.name}
                      href={link.to}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="
                        text-gray-800
                        hover:text-blue-700
                        text-sm
                        font-medium
                      "
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {link.name}
                    </a>
                  ) : (
                    <Link
                      key={link.name}
                      to={link.to}
                      className="
                        text-gray-800
                        hover:text-blue-700
                        text-sm
                        font-medium
                      "
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {link.name}
                    </Link>
                  )
                )}

                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    openCart();
                  }}
                  className="mt-4 flex items-center justify-between bg-[#021C57] text-white p-3 rounded-xl text-xs font-bold shadow-md cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <ShoppingBag size={16} className="text-cyan-300" />
                    <span>Quote Basket</span>
                  </div>
                  <span className="bg-amber-400 text-gray-900 px-2 py-0.5 rounded-full text-[10px] font-black">
                    {cartItemCount}
                  </span>
                </button>
              </div>
            )}
          </nav>
        </div>
      </header>
    </>
  );
};

export default Navbar;
