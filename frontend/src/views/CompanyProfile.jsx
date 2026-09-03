"use client";

import React from "react";
import { ArrowLeft, Download, ExternalLink, MessageCircle } from "lucide-react";
import { Link } from "../utils/navigation.jsx";

const CompanyProfile = () => {
  const pdfUrl = "/arclcompany.pdf";

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col">
      {/* Top Bar with Quick Navigation */}
      <div className="bg-slate-950 px-4 sm:px-8 py-3.5 border-b border-slate-800 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition flex items-center gap-1.5 text-xs font-bold"
          >
            <ArrowLeft size={16} />
            <span>Home</span>
          </Link>
          <span className="font-bold text-sm sm:text-base text-white">
            ARCL Instruments — Company Profile (PDF)
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          <a
            href="https://wa.me/918169695728?text=Hello%20ARCL%2C%20I%20have%20reviewed%20your%20Company%20Profile%20and%20would%20like%20to%20inquire."
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition"
          >
            <MessageCircle size={14} />
            <span>WhatsApp</span>
          </a>

          <a
            href={pdfUrl}
            download="ARCL-Company-Profile.pdf"
            className="px-3.5 py-1.5 rounded-xl bg-[#021C57] hover:bg-blue-800 border border-blue-400/30 text-white text-xs font-bold flex items-center gap-1.5 transition"
          >
            <Download size={14} />
            <span>Download</span>
          </a>

          <a
            href={pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition"
            title="Open standalone PDF in new window"
          >
            <ExternalLink size={15} />
          </a>
        </div>
      </div>

      {/* Embedded Fullscreen PDF Viewport */}
      <div className="flex-1 w-full bg-slate-900" style={{ height: "calc(100vh - 60px)" }}>
        <iframe
          src={`${pdfUrl}#view=FitH&toolbar=1`}
          title="ARCL Instruments Company Profile PDF"
          className="w-full h-full border-none bg-slate-900"
        />
      </div>
    </div>
  );
};

export default CompanyProfile;

