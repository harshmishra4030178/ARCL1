import React, { useState, useEffect, useRef } from "react";
import { FaWhatsapp } from "react-icons/fa";
import { Mail, Bell, X, CheckCircle2, ArrowRight, Sparkles, ShieldCheck } from "lucide-react";
import { subscribeApi } from "../../api/subscriberApi.js";
import { toast } from "react-toastify";

const FloatingContactButtons = () => {
  const [isSubscribeOpen, setIsSubscribeOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const modalRef = useRef(null);
  const inputRef = useRef(null);

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

  // Focus input on modal open
  useEffect(() => {
    if (isSubscribeOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isSubscribeOpen]);

  // Handle outside click & escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isSubscribeOpen) {
        setIsSubscribeOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSubscribeOpen]);

  const handleSubscribeSubmit = async (e) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error("Please enter your email address");
      return;
    }

    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email.trim())) {
      toast.error("Please enter a valid email address");
      return;
    }

    try {
      setLoading(true);
      const res = await subscribeApi({
        email: email.trim(),
        source: "floating_subscribe_modal",
      });
      const msg = res.data?.message || "Subscribed successfully!";
      toast.success(msg);
      setSubscribed(true);
      setEmail("");
    } catch (err) {
      console.error(err);
      toast.error(
        err.response?.data?.message || "Subscription failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const closeSubscribeModal = () => {
    setIsSubscribeOpen(false);
    // Reset subscribed status after transition completes
    setTimeout(() => {
      setSubscribed(false);
    }, 400);
  };

  return (
    <>
      {/* 0. INTERACTIVE SUBSCRIBE POPUP MODAL */}
      {isSubscribeOpen && (
        <div
          className="fixed inset-0 z-[99999] flex items-end sm:items-center justify-center p-4 sm:p-6 bg-slate-950/60 backdrop-blur-xs animate-fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeSubscribeModal();
          }}
        >
          <div
            ref={modalRef}
            className="relative w-full max-w-md bg-gradient-to-b from-[#031d5b] to-[#02143d] rounded-3xl p-6 sm:p-7 text-white shadow-2xl border border-blue-600/40 transform transition-all duration-300 scale-100 overflow-hidden"
          >
            {/* Background Glow Accents */}
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 rounded-full bg-amber-500/15 blur-2xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 rounded-full bg-blue-500/20 blur-2xl pointer-events-none" />

            {/* Close Button */}
            <button
              type="button"
              onClick={closeSubscribeModal}
              aria-label="Close modal"
              className="absolute top-4 right-4 p-2 rounded-full text-slate-300 hover:text-white hover:bg-white/10 transition cursor-pointer z-20"
            >
              <X className="w-5 h-5" />
            </button>

            {!subscribed ? (
              <div className="relative z-10 space-y-4">
                {/* Header Badge */}
                <div className="inline-flex items-center gap-2 bg-amber-400/15 border border-amber-400/30 px-3 py-1 rounded-full text-[11px] font-bold text-amber-300 uppercase tracking-wider">
                  <Bell className="w-3.5 h-3.5 text-amber-400" /> Equipment Launch Alerts
                </div>

                {/* Title & Description */}
                <div>
                  <h3 className="text-xl sm:text-2xl font-black text-white leading-tight">
                    Stay Updated on New Testing Instruments
                  </h3>
                  <p className="text-xs sm:text-sm text-blue-100/80 mt-1.5 leading-relaxed">
                    Enter your email to receive official specification sheets and updates whenever new laboratory equipment is released.
                  </p>
                </div>

                {/* Subscription Form */}
                <form onSubmit={handleSubscribeSubmit} className="space-y-3 pt-1">
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                    <input
                      ref={inputRef}
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your professional email..."
                      required
                      className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-white text-slate-900 placeholder-slate-400 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-amber-400/40 transition shadow-inner"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-extrabold py-3.5 px-6 rounded-2xl transition-all duration-200 shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 text-sm cursor-pointer disabled:opacity-60"
                  >
                    {loading ? (
                      <>
                        <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                        Subscribing...
                      </>
                    ) : (
                      <>
                        Subscribe Now <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>

                {/* Privacy Badge */}
                <div className="flex items-center justify-center gap-1.5 text-[11px] text-blue-200/70 pt-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>We respect your privacy. No spam. Unsubscribe anytime.</span>
                </div>
              </div>
            ) : (
              /* Success Confirmation View */
              <div className="relative z-10 text-center py-6 space-y-4">
                <div className="w-14 h-14 bg-emerald-500/20 text-emerald-400 border border-emerald-400/40 rounded-full flex items-center justify-center mx-auto animate-bounce">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">
                    Subscription Confirmed!
                  </h3>
                  <p className="text-xs sm:text-sm text-blue-100/90 mt-1 max-w-xs mx-auto">
                    Thank you for subscribing! You will receive our latest testing instrument announcements and catalogs.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeSubscribeModal}
                  className="bg-white/15 hover:bg-white/25 text-white font-semibold text-xs px-6 py-2.5 rounded-xl border border-white/20 transition cursor-pointer"
                >
                  Close Window
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* FLOATING ACTION BUTTONS DOCK (BOTTOM-RIGHT) */}
      <aside
        aria-label="Quick Contact and Subscribe Actions"
        className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3 pointer-events-auto"
      >
        {/* 1. SUBSCRIBE / ALERTS BUTTON (ON TOP) */}
        <div className="relative flex items-center group">
          {/* CTA Tooltip Pill */}
          <div
            className="absolute right-full mr-3 hidden sm:flex items-center bg-slate-900/95 text-white px-3.5 py-1.5 rounded-2xl shadow-xl border border-slate-700/60 backdrop-blur-md opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-200 pointer-events-none whitespace-nowrap"
          >
            <div className="flex flex-col text-right">
              <span className="text-xs font-bold text-amber-400 leading-none">
                Subscribe Alerts
              </span>
              <span className="text-[10px] text-slate-300 font-medium leading-tight mt-0.5">
                New Equipment Launches
              </span>
            </div>
            <div className="w-2 h-2 bg-slate-900/95 rotate-45 border-t border-r border-slate-700/60 absolute -right-1"></div>
          </div>

          {/* Subscribe Action Button */}
          <button
            onClick={() => setIsSubscribeOpen(true)}
            aria-label="Subscribe to New Equipment Launch Alerts"
            className="relative flex items-center justify-center w-12 h-12 sm:w-13 sm:h-13 rounded-full bg-gradient-to-tr from-amber-600 via-amber-500 to-yellow-400 hover:from-amber-500 hover:to-yellow-300 text-slate-950 shadow-lg shadow-amber-500/35 hover:shadow-xl hover:shadow-amber-500/50 transform hover:scale-110 active:scale-95 transition-all duration-300 border-2 border-white cursor-pointer"
          >
            <Bell className="w-5 h-5 sm:w-6 sm:h-6 relative z-10 drop-shadow-sm text-gray-950" />
          </button>
        </div>

        {/* 2. WHATSAPP BUTTON (MIDDLE) */}
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
            className="relative flex items-center justify-center w-12 h-12 sm:w-13 sm:h-13 rounded-full bg-[#25D366] hover:bg-[#20ba59] text-white shadow-lg shadow-emerald-500/35 hover:shadow-xl hover:shadow-emerald-500/50 transform hover:scale-110 active:scale-95 transition-all duration-300 border-2 border-white cursor-pointer"
          >
            {/* Subtle Attention Ping Ring */}
            <span className="absolute -inset-1 rounded-full bg-[#25D366] opacity-30 animate-ping pointer-events-none"></span>

            <FaWhatsapp className="w-6 h-6 sm:w-7 sm:h-7 relative z-10 drop-shadow-sm" />
          </a>
        </div>

        {/* 3. EMAIL BUTTON (BOTTOM) */}
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
            className="relative flex items-center justify-center w-12 h-12 sm:w-13 sm:h-13 rounded-full bg-[#021C57] hover:bg-[#032d88] text-white shadow-lg shadow-slate-900/35 hover:shadow-xl hover:shadow-slate-900/50 transform hover:scale-110 active:scale-95 transition-all duration-300 border-2 border-white cursor-pointer"
          >
            <Mail className="w-5 h-5 sm:w-6 sm:h-6 relative z-10 text-cyan-300 drop-shadow-sm" />
          </a>
        </div>
      </aside>
    </>
  );
};

export default FloatingContactButtons;
