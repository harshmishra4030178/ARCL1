"use client";

import React, { useState, useEffect, useRef } from "react";
import { Clock, CheckCircle2 } from "lucide-react";
import { createContact } from "../../api/contactApi.js";
import { toast } from "react-toastify";

/**
 * High-performance animated interactive Plexus / Constellation Canvas
 * Renders smooth floating particles and dynamic interconnected lines matching high-tech lab aesthetics.
 */
function PlexusCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId;
    let width = 0;
    let height = 0;

    const resize = () => {
      if (!canvas || !canvas.parentElement) return;
      const rect = canvas.parentElement.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
    };

    resize();
    window.addEventListener("resize", resize);

    const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
    const particleCount = isMobile ? 32 : 65;
    const maxDistance = isMobile ? 105 : 145;

    const colors = ["#38bdf8", "#60a5fa", "#e0f2fe", "#f59e0b", "#93c5fd"];

    const particles = Array.from({ length: particleCount }, () => ({
      x: Math.random() * (width || 800),
      y: Math.random() * (height || 500),
      vx: (Math.random() - 0.5) * 0.75,
      vy: (Math.random() - 0.5) * 0.75,
      radius: Math.random() * 2 + 1.5,
      color: colors[Math.floor(Math.random() * colors.length)],
      pulse: Math.random() * Math.PI * 2,
      pulseSpeed: 0.02 + Math.random() * 0.02,
    }));

    const mouse = { x: null, y: null, maxDist: 150 };

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };

    const handleMouseLeave = () => {
      mouse.x = null;
      mouse.y = null;
    };

    const parent = canvas.parentElement;
    if (parent) {
      parent.addEventListener("mousemove", handleMouseMove);
      parent.addEventListener("mouseleave", handleMouseLeave);
    }

    let isVisible = true;
    const observer = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting;
    });
    observer.observe(canvas);

    const render = () => {
      if (!isVisible) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      ctx.clearRect(0, 0, width, height);

      // 1. Update positions & draw connections
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        p.x += p.vx;
        p.y += p.vy;
        p.pulse += p.pulseSpeed;

        if (p.x < 0) p.x = width;
        else if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        else if (p.y > height) p.y = 0;

        // Dynamic plexus connecting lines
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.hypot(dx, dy);

          if (dist < maxDistance) {
            const alpha = (1 - dist / maxDistance) * 0.35;
            ctx.beginPath();
            ctx.strokeStyle = `rgba(56, 189, 248, ${alpha})`;
            ctx.lineWidth = 0.9;
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }

        // Interactive mouse connection
        if (mouse.x !== null && mouse.y !== null) {
          const dx = p.x - mouse.x;
          const dy = p.y - mouse.y;
          const dist = Math.hypot(dx, dy);
          if (dist < mouse.maxDist) {
            const alpha = (1 - dist / mouse.maxDist) * 0.55;
            ctx.beginPath();
            ctx.strokeStyle = `rgba(245, 158, 11, ${alpha})`;
            ctx.lineWidth = 1.2;
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.stroke();
          }
        }

        // Draw node with pulsating glow
        const currentRadius = p.radius + Math.sin(p.pulse) * 0.6;
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(1, currentRadius), 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 6;
        ctx.shadowColor = p.color;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", resize);
      if (parent) {
        parent.removeEventListener("mousemove", handleMouseMove);
        parent.removeEventListener("mouseleave", handleMouseLeave);
      }
      observer.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="absolute inset-0 w-full h-full pointer-events-none z-[2]"
    />
  );
}

export default function AppointmentBookingSection() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    service: "",
    date: "",
  });

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.firstName.trim() || !formData.email.trim() || !formData.phone.trim()) {
      toast.error("Please fill all required fields (*)");
      return;
    }

    try {
      setLoading(true);
      const fullName = `${formData.firstName} ${formData.lastName}`.trim();
      const payload = {
        name: fullName,
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        subject: `Research & Testing Appointment: ${formData.service || "Lab Equipment & Calibration"} (${formData.date || "Earliest Date"})`,
        message: `New Appointment Booking Details:\n- Client Name: ${fullName}\n- Email: ${formData.email}\n- Phone: ${formData.phone}\n- Requested Service/Equipment: ${formData.service || "General Technical Consultation"}\n- Preferred Appointment Date: ${formData.date || "Earliest Available Date"}\n- Source: Homepage Book Appointment Section`,
      };

      await createContact(payload);
      toast.success("Appointment scheduled successfully! Our technical engineers will contact you soon.");
      setSubmitted(true);
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        service: "",
        date: "",
      });
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to schedule appointment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const today = new Date().toISOString().split("T")[0];

  return (
    <section className="w-full py-12 px-4 sm:px-6 md:px-10 lg:px-16 bg-gray-50">
      <div className="max-w-[1600px] mx-auto">
        {/* Main Card Container with Realistic Lab Background & High-Tech Overlays */}
        <div className="relative rounded-3xl overflow-hidden bg-[#071a3d] shadow-2xl border border-blue-500/20 p-6 sm:p-10 lg:p-14">
          
          {/* 1. Authentic Laboratory Background Image */}
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-cover bg-center opacity-30 mix-blend-luminosity scale-105 pointer-events-none z-0"
            style={{
              backgroundImage: `url('/assets/appointment-bg.webp')`,
            }}
          />

          {/* 2. Deep Navy Blue Gradient Overlay */}
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-r from-[#06183d]/95 via-[#082255]/85 to-[#05173a]/90 pointer-events-none z-[1]"
          />

          {/* 3. Live Animated Interactive Plexus Constellation Graphics */}
          <PlexusCanvas />

          {/* 4. Ambient Glows */}
          <div
            aria-hidden="true"
            className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-blue-500/15 blur-3xl pointer-events-none z-[1]"
          />
          <div
            aria-hidden="true"
            className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-amber-500/10 blur-3xl pointer-events-none z-[1]"
          />

          {/* Content Grid */}
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
            
            {/* ================= LEFT COLUMN: HERO INFORMATION ================= */}
            <div className="lg:col-span-5 space-y-6 text-white">
              
              {/* Badge: • Book an Appointment */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#0d234a]/75 backdrop-blur-md border border-white/15 text-xs sm:text-sm font-semibold text-white shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-[#e5a93c] animate-pulse" />
                <span>Book an Appointment</span>
              </div>

              {/* Main Heading: Book Research / Testing Appointment */}
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-[1.15]">
                Book Research <br />
                Testing{" "}
                <span className="italic font-serif font-normal tracking-normal">
                  <span className="text-[#38bdf8]">A</span>
                  <span className="text-[#e5a93c]">ppointment</span>
                </span>
              </h2>

              {/* Description */}
              <p className="text-slate-200/90 text-sm sm:text-base leading-relaxed max-w-lg">
                Schedule your research testing appointment with ease and gain access to
                accurate analysis, expert evaluation, and reliable results tailored to your
                needs.
              </p>

              {/* Working Hours Badge */}
              <div className="pt-2 sm:pt-4">
                <div className="inline-flex items-center gap-3 text-white text-xs sm:text-sm">
                  <div className="w-9 h-9 rounded-full bg-[#d99b26] flex items-center justify-center text-white shrink-0 shadow-md">
                    <Clock className="w-5 h-5 text-white" aria-hidden="true" />
                  </div>
                  <div>
                    <span className="font-bold text-white">
                      Working Hours :{" "}
                    </span>
                    <span className="text-slate-200 font-normal">
                      Monday-Saturday, 8:00 AM – 7:00 PM
                    </span>
                  </div>
                </div>
              </div>

            </div>

            {/* ================= RIGHT COLUMN: APPOINTMENT FORM ================= */}
            <div className="lg:col-span-7">
              <div className="bg-[#122b54]/80 backdrop-blur-xl border border-white/15 rounded-3xl p-6 sm:p-8 lg:p-10 shadow-2xl">
                
                {submitted ? (
                  /* Success Feedback View */
                  <div className="py-8 text-center space-y-4">
                    <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-400 flex items-center justify-center mx-auto shadow-lg">
                      <CheckCircle2 className="w-9 h-9" />
                    </div>
                    <h3 className="text-2xl font-bold text-white">
                      Appointment Request Received!
                    </h3>
                    <p className="text-sm text-slate-200 max-w-md mx-auto leading-relaxed">
                      Thank you for scheduling with ARCL Instruments. Our senior laboratory engineer will review your inquiry and confirm your slot via email / phone.
                    </p>
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => setSubmitted(false)}
                        className="inline-flex items-center gap-2 bg-white/15 hover:bg-white/25 text-white font-bold px-6 py-2.5 rounded-xl border border-white/20 transition cursor-pointer text-sm"
                      >
                        Book Another Appointment
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Form View */
                  <form onSubmit={handleSubmit} className="space-y-4">
                    
                    {/* Row 1: First Name & Last Name */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="apt-first-name" className="sr-only">First Name</label>
                        <input
                          id="apt-first-name"
                          type="text"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleChange}
                          placeholder="First Name*"
                          required
                          className="w-full bg-[#2f4d78]/80 hover:bg-[#38598a]/90 focus:bg-[#38598a] border border-white/15 focus:border-amber-400/80 text-white placeholder:text-slate-300/80 rounded-xl px-4 py-3.5 text-sm sm:text-base focus:outline-none transition shadow-inner"
                        />
                      </div>

                      <div>
                        <label htmlFor="apt-last-name" className="sr-only">Last Name</label>
                        <input
                          id="apt-last-name"
                          type="text"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleChange}
                          placeholder="Last Name*"
                          required
                          className="w-full bg-[#2f4d78]/80 hover:bg-[#38598a]/90 focus:bg-[#38598a] border border-white/15 focus:border-amber-400/80 text-white placeholder:text-slate-300/80 rounded-xl px-4 py-3.5 text-sm sm:text-base focus:outline-none transition shadow-inner"
                        />
                      </div>
                    </div>

                    {/* Row 2: Email Address */}
                    <div>
                      <label htmlFor="apt-email" className="sr-only">E-mail Address</label>
                      <input
                        id="apt-email"
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="E-mail Address*"
                        required
                        className="w-full bg-[#2f4d78]/80 hover:bg-[#38598a]/90 focus:bg-[#38598a] border border-white/15 focus:border-amber-400/80 text-white placeholder:text-slate-300/80 rounded-xl px-4 py-3.5 text-sm sm:text-base focus:outline-none transition shadow-inner"
                      />
                    </div>

                    {/* Row 3: Phone Number */}
                    <div>
                      <label htmlFor="apt-phone" className="sr-only">Phone no.</label>
                      <input
                        id="apt-phone"
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="Phone no. *"
                        required
                        className="w-full bg-[#2f4d78]/80 hover:bg-[#38598a]/90 focus:bg-[#38598a] border border-white/15 focus:border-amber-400/80 text-white placeholder:text-slate-300/80 rounded-xl px-4 py-3.5 text-sm sm:text-base focus:outline-none transition shadow-inner"
                      />
                    </div>

                    {/* Row 4: Select Service & Date */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="apt-service" className="sr-only">Select a Service</label>
                        <div className="relative">
                          <select
                            id="apt-service"
                            name="service"
                            value={formData.service}
                            onChange={handleChange}
                            required
                            className="w-full bg-[#2f4d78]/80 hover:bg-[#38598a]/90 focus:bg-[#38598a] border border-white/15 focus:border-amber-400/80 text-white rounded-xl px-4 py-3.5 text-sm sm:text-base focus:outline-none transition appearance-none cursor-pointer shadow-inner pr-10"
                          >
                            <option value="" className="bg-[#0b1f3f] text-slate-300">
                              Select a Services
                            </option>
                            <option value="Concrete Testing Equipment" className="bg-[#0b1f3f] text-white">
                              Concrete Testing Equipment
                            </option>
                            <option value="Soil & Geotechnical Testing" className="bg-[#0b1f3f] text-white">
                              Soil &amp; Geotechnical Testing
                            </option>
                            <option value="Aggregate Testing Equipment" className="bg-[#0b1f3f] text-white">
                              Aggregate Testing Equipment
                            </option>
                            <option value="Bitumen & Asphalt Testing" className="bg-[#0b1f3f] text-white">
                              Bitumen &amp; Asphalt Testing
                            </option>
                            <option value="Cement Testing Equipment" className="bg-[#0b1f3f] text-white">
                              Cement Testing Equipment
                            </option>
                            <option value="NABL Calibration & Maintenance" className="bg-[#0b1f3f] text-white">
                              NABL Calibration &amp; Maintenance
                            </option>
                            <option value="Surveying & NDT Equipment" className="bg-[#0b1f3f] text-white">
                              Surveying &amp; NDT Equipment
                            </option>
                            <option value="Custom Laboratory Setup & Consultation" className="bg-[#0b1f3f] text-white">
                              Custom Laboratory Setup
                            </option>
                          </select>
                          
                          {/* Custom Dropdown Triangle Icon */}
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-300">
                            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
                              <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                            </svg>
                          </div>
                        </div>
                      </div>

                      <div>
                        <label htmlFor="apt-date" className="sr-only">Appointment Date</label>
                        <input
                          id="apt-date"
                          type="date"
                          name="date"
                          min={today}
                          value={formData.date}
                          onChange={handleChange}
                          placeholder="dd-mm-yyyy"
                          required
                          className="w-full bg-[#2f4d78]/80 hover:bg-[#38598a]/90 focus:bg-[#38598a] border border-white/15 focus:border-amber-400/80 text-white placeholder:text-slate-300/80 rounded-xl px-4 py-3.5 text-sm sm:text-base focus:outline-none transition shadow-inner [color-scheme:dark] cursor-pointer"
                        />
                      </div>
                    </div>

                    {/* Row 5: Submit Button (Horizontal Gradient matching Reference) */}
                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-[#173258] via-[#656346] to-[#c99534] hover:from-[#1d3d6b] hover:via-[#7c774b] hover:to-[#dba53d] text-white font-bold py-4 px-6 rounded-2xl shadow-xl transition-all duration-300 transform hover:scale-[1.008] active:scale-[0.99] text-sm sm:text-base cursor-pointer tracking-wide flex items-center justify-center gap-2.5 disabled:opacity-60"
                      >
                        {loading ? (
                          <>
                            <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>Scheduling Appointment...</span>
                          </>
                        ) : (
                          <span>Make An Appointment</span>
                        )}
                      </button>
                    </div>

                  </form>
                )}

              </div>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
}
