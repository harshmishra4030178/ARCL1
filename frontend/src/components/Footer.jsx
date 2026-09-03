"use client";

import React from "react";
import { Link, NavLink } from "../utils/navigation.jsx";
const logo = "/assets/LOGO.png";
import {
  TbBrandLinkedin,
  TbMapPin,
  TbMail,
  TbPhone,
} from "react-icons/tb";
import { FaInstagram } from "react-icons/fa";
import { RiFacebookBoxLine } from "react-icons/ri";
import { FiYoutube } from "react-icons/fi";
import { FaXTwitter } from "react-icons/fa6";
import { HiArrowUpRight } from "react-icons/hi2";

const Footer = () => {
  const navLinks = [
    { name: "Home", to: "/" },
    { name: "Laboratory Equipments", to: "/products" },
    { name: "Catalog", to: "/catalog" },
    { name: "Calibration Services", to: "/calibration-services" },
    { name: "About Us", to: "/about" },
    { name: "Company Profile", to: "/arclcompany.pdf", isExternal: true },
    { name: "Contact Us", to: "/contact" },
  ];

  const socialLinks = [
    {
      icon: <TbBrandLinkedin size={17} />,
      url: "https://www.linkedin.com/company/arclinstruments/about/",
      label: "LinkedIn",
    },
    {
      icon: <FaInstagram size={16} />,
      url: "https://www.instagram.com/arcl_lab/",
      label: "Instagram",
    },
    {
      icon: <RiFacebookBoxLine size={18} />,
      url: "https://www.facebook.com/people/ARCL-Instruments-Pvt-Ltd/61580266556551/",
      label: "Facebook",
    },
    {
      icon: <FiYoutube size={17} />,
      url: "https://www.youtube.com/@ARCLLabSolutions",
      label: "YouTube",
    },
    {
      icon: <FaXTwitter size={16} />,
      url: "https://x.com/ArclPrivate",
      label: "X",
    },
  ];

  return (
    <footer className="relative overflow-hidden bg-[#050e1d] text-white border-t border-slate-800/80">
      {/* Subtle Top Accent Line */}
      <div className="h-[1.5px] bg-gradient-to-r from-transparent via-blue-500/80 to-transparent" />

      {/* Subtle Background Glows */}
      <div className="pointer-events-none absolute -left-28 -top-28 h-64 w-64 rounded-full bg-blue-600/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 -right-28 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        {/* Main Footer Content Grid */}
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-12 lg:gap-8">
          
          {/* 1. BRAND & COMPANY INFO (5 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <Link
              to="/"
              className="inline-flex items-center gap-3 rounded-xl bg-white px-3 py-2 shadow-md transition-transform duration-200 hover:scale-[1.02]"
            >
              <img
                src={logo}
                alt="ARCL Instruments"
                className="h-9 w-auto object-contain"
              />
              <div className="flex flex-col text-[#021C57]">
                <p className="font-bold text-xs tracking-tight uppercase leading-tight font-sans">
                  ARCL INSTRUMENTS PVT. LTD
                </p>
                <p className="text-[9px] text-gray-500 font-medium">
                  ISO 9001:2015 Certified Company
                </p>
              </div>
            </Link>

            <p className="text-xs leading-relaxed text-gray-400 max-w-sm">
              Trusted manufacturer and provider of precision industrial & laboratory testing equipment, delivering certified quality for civil and material testing labs worldwide.
            </p>

            {/* Social Icons */}
            <div className="pt-1 flex items-center gap-2">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-gray-400 transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-500 hover:bg-blue-600 hover:text-white"
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* 2. QUICK LINKS (3 cols) */}
          <div className="lg:col-span-3 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-2">
              <span className="h-1 w-3 rounded-full bg-blue-500" />
              Quick Navigation
            </h3>

            <ul className="grid grid-cols-1 gap-2 text-xs">
              {navLinks.map((link) => (
                <li key={link.name}>
                  {link.isExternal ? (
                    <a
                      href={link.to}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 transition-colors duration-150 text-gray-400 hover:text-white"
                    >
                      <span className="h-1 w-1 rounded-full bg-slate-600" />
                      <span>{link.name}</span>
                    </a>
                  ) : (
                    <NavLink
                      to={link.to}
                      className={({ isActive }) =>
                        `flex items-center gap-2 transition-colors duration-150 ${
                          isActive
                            ? "text-blue-400 font-semibold"
                            : "text-gray-400 hover:text-white"
                        }`
                      }
                    >
                      <span className="h-1 w-1 rounded-full bg-slate-600" />
                      <span>{link.name}</span>
                    </NavLink>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* 3. OFFICE LOCATION (2.5 cols) */}
          <div className="lg:col-span-2 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-2">
              <span className="h-1 w-3 rounded-full bg-blue-500" />
              Head Office
            </h3>

            <a
              href="https://maps.app.goo.gl/Xa2cZMx3Dg8yqrB49"
              target="_blank"
              rel="noopener noreferrer"
              className="group block text-xs text-gray-400 space-y-1 hover:text-gray-200 transition-colors"
            >
              <div className="flex items-start gap-2">
                <TbMapPin size={16} className="text-blue-400 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  Shop No. 6, Siddivinayak Park CHS, Sector 8A, Airoli, Navi Mumbai - 400708
                </p>
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] text-blue-400 group-hover:underline pt-0.5">
                Directions <HiArrowUpRight size={10} />
              </span>
            </a>
          </div>

          {/* 4. CONTACT & CTA (2.5 cols) */}
          <div className="lg:col-span-3 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-2">
              <span className="h-1 w-3 rounded-full bg-blue-500" />
              Direct Contacts
            </h3>

            <div className="space-y-2 text-xs">
              <a
                href="https://wa.me/918169695728?text=Hello%20I%20would%20like%20to%20inquire%20about%20your%20products"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-gray-300 hover:text-emerald-400 transition-colors"
              >
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <TbPhone size={14} />
                </div>
                <span>+91 8169695728</span>
              </a>

              <a
                href="mailto:arclinstruments@gmail.com"
                className="flex items-center gap-2 text-gray-300 hover:text-blue-400 transition-colors truncate"
              >
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  <TbMail size={14} />
                </div>
                <span className="truncate">arclinstruments@gmail.com</span>
              </a>
            </div>

            <div className="pt-1">
              <Link
                to="/contact"
                className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-blue-500 px-3.5 py-1.5 text-xs font-semibold shadow hover:from-blue-500 hover:to-cyan-500 transition-all duration-200"
              >
                Request Quote / Inquire
                <HiArrowUpRight size={12} />
              </Link>
            </div>
          </div>

        </div>

        {/* Bottom Compact Divider & Copyright */}
              <div className="mt-10 py-2 px-4">
  <div className="flex flex-col md:flex-row items-center justify-between gap-4">

    {/* Copyright */}
    <p className="text-sm text-gray-500">
      © {new Date().getFullYear()}{" "}
      <span className="font-bold text-gray-800">ARCL</span>
      <span className="mx-1">•</span>
      All rights reserved.
    </p>

    {/* Developer Section */}
    <div className="flex flex-wrap items-center justify-center gap-3 text-sm">

      <span className="text-gray-500">
        Designed & Developed by
      </span>

      <a
        href="https://www.linkedin.com/in/abhi1224/"
        target="_blank"
        rel="noopener noreferrer"
        className="group flex items-center gap-1.5 font-semibold text-gray-700 transition-all duration-300 hover:text-blue-600"
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-gray-100 text-xs font-bold transition-all duration-300 group-hover:bg-blue-600 group-hover:text-white">
          in
        </span>
        Abhishek Verma
      </a>

      <span className="text-gray-300">|</span>

      <a
        href="https://www.linkedin.com/in/harsh-mishra-4829a82aa/"
        target="_blank"
        rel="noopener noreferrer"
        className="group flex items-center gap-1.5 font-semibold text-gray-700 transition-all duration-300 hover:text-blue-600"
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-gray-100 text-xs font-bold transition-all duration-300 group-hover:bg-blue-600 group-hover:text-white">
          in
        </span>
        Harsh Mishra
      </a>

    </div>
  </div>
</div>
      </div>
    </footer>
  );
};

export default Footer;