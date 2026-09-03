import React, { useState } from "react";
import { FaWhatsapp, FaEnvelope } from "react-icons/fa";
import { Mail, MessageCircle } from "lucide-react";

const FloatingContactButtons = () => {
  const [hoveredButton, setHoveredButton] = useState(null);

  const whatsappNumber = "918169695728";
  const whatsappMessage = encodeURIComponent(
    "Hello ARCL Instruments, I would like to inquire about your products and services."
  );
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`;

  const emailAddress = "arclinstruments@gmail.com";
  const emailSubject = encodeURIComponent("Inquiry - ARCL Instruments");
  const emailBody = encodeURIComponent(
    "Hello ARCL Team,\n\nI am interested in learning more about your testing equipment / calibration services.\n\nRegards,"
  );
  const emailUrl = `mailto:${emailAddress}?subject=${emailSubject}&body=${emailBody}`;

  return (
    <aside
      aria-label="Quick Contact Actions"
      className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3.5 pointer-events-auto"
    >
      {/* 1. WHATSAPP BUTTON (ON TOP) */}
      <div className="relative flex items-center group">
        {/* CTA Tooltip Pill */}
        <div
          className="absolute right-full mr-3 hidden sm:flex items-center bg-slate-900/95 text-white px-3.5 py-1.5 rounded-2xl shadow-xl border border-slate-700/60 backdrop-blur-md opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-200 pointer-events-none whitespace-nowrap"
        >
          <div className="flex flex-col text-right">
            <span className="text-xs font-bold text-emerald-400 leading-none">
              Chat on WhatsApp
            </span>
            <span className="text-[10px] text-slate-300 font-medium leading-tight mt-0.5">
              Quick Response • Online
            </span>
          </div>
          <div className="w-2 h-2 bg-slate-900/95 rotate-45 border-t border-r border-slate-700/60 absolute -right-1"></div>
        </div>

        {/* WhatsApp Link Button */}
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Chat on WhatsApp with ARCL Instruments"
          className="relative flex items-center justify-center w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-[#25D366] hover:bg-[#20ba59] text-white shadow-lg shadow-emerald-500/35 hover:shadow-xl hover:shadow-emerald-500/50 transform hover:scale-110 active:scale-95 transition-all duration-300 border-2 border-white cursor-pointer"
        >
          {/* Subtle Attention Ping Ring */}
          <span className="absolute -inset-1 rounded-full bg-[#25D366] opacity-30 animate-ping pointer-events-none"></span>

          <FaWhatsapp className="w-7 h-7 sm:w-8 sm:h-8 relative z-10 drop-shadow-sm" />
        </a>
      </div>

      {/* 2. EMAIL BUTTON (BELOW WHATSAPP) */}
      <div className="relative flex items-center group">
        {/* CTA Tooltip Pill */}
        <div
          className="absolute right-full mr-3 hidden sm:flex items-center bg-slate-900/95 text-white px-3.5 py-1.5 rounded-2xl shadow-xl border border-slate-700/60 backdrop-blur-md opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-200 pointer-events-none whitespace-nowrap"
        >
          <div className="flex flex-col text-right">
            <span className="text-xs font-bold text-cyan-300 leading-none">
              Send an Email
            </span>
            <span className="text-[10px] text-slate-300 font-medium leading-tight mt-0.5">
              arclinstruments@gmail.com
            </span>
          </div>
          <div className="w-2 h-2 bg-slate-900/95 rotate-45 border-t border-r border-slate-700/60 absolute -right-1"></div>
        </div>

        {/* Email Link Button */}
        <a
          href={emailUrl}
          aria-label="Send an email to ARCL Instruments"
          className="relative flex items-center justify-center w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-[#021C57] hover:bg-[#032d88] text-white shadow-lg shadow-slate-900/35 hover:shadow-xl hover:shadow-slate-900/50 transform hover:scale-110 active:scale-95 transition-all duration-300 border-2 border-white cursor-pointer"
        >
          <Mail className="w-6 h-6 sm:w-7 sm:h-7 relative z-10 text-cyan-300 drop-shadow-sm" />
        </a>
      </div>
    </aside>
  );
};

export default FloatingContactButtons;
