"use client";

import React, { useState } from "react";
import { Clock, CheckCircle2, Calendar } from "lucide-react";
import { createContact } from "../../api/contactApi.js";
import { toast } from "react-toastify";

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
            className="absolute inset-0 bg-cover bg-center opacity-30 mix-blend-luminosity scale-105 pointer-events-none"
            style={{
              backgroundImage: `url('/assets/appointment-bg.webp')`,
            }}
          />

          {/* 2. Deep Navy Blue Gradient Overlay */}
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-r from-[#06183d]/95 via-[#082255]/85 to-[#05173a]/90 pointer-events-none"
          />

          {/* 3. Constellation / Plexus Geometric Web SVG Overlay */}
          <svg
            aria-hidden="true"
            className="absolute inset-0 w-full h-full pointer-events-none opacity-35"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="plexusGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.4" />
                <stop offset="50%" stopColor="#818cf8" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#fbbf24" stopOpacity="0.3" />
              </linearGradient>
            </defs>
            {/* Constellation lines */}
            <g stroke="url(#plexusGrad)" strokeWidth="1" fill="none">
              <line x1="80" y1="60" x2="220" y2="140" />
              <line x1="220" y1="140" x2="380" y2="80" />
              <line x1="380" y1="80" x2="490" y2="190" />
              <line x1="220" y1="140" x2="290" y2="280" />
              <line x1="490" y1="190" x2="390" y2="340" />
              <line x1="290" y1="280" x2="390" y2="340" />
              <line x1="390" y1="340" x2="560" y2="310" />
              <line x1="490" y1="190" x2="620" y2="110" />
              <line x1="620" y1="110" x2="780" y2="160" />
              <line x1="560" y1="310" x2="680" y2="380" />
              <line x1="780" y1="160" x2="720" y2="290" />
              <line x1="680" y1="380" x2="720" y2="290" />
              <line x1="140" y1="260" x2="220" y2="140" />
              <line x1="140" y1="260" x2="290" y2="280" />
            </g>
            {/* Constellation glowing nodes */}
            <g fill="#bae6fd">
              <circle cx="80" cy="60" r="2.5" />
              <circle cx="220" cy="140" r="3.5" fill="#38bdf8" />
              <circle cx="380" cy="80" r="2.5" />
              <circle cx="490" cy="190" r="3" fill="#e0f2fe" />
              <circle cx="290" cy="280" r="3.5" fill="#38bdf8" />
              <circle cx="390" cy="340" r="2.5" />
              <circle cx="560" cy="310" r="3" />
              <circle cx="620" cy="110" r="2.5" />
              <circle cx="780" cy="160" r="3.5" fill="#38bdf8" />
              <circle cx="720" cy="290" r="2.5" />
              <circle cx="680" cy="380" r="3" />
              <circle cx="140" cy="260" r="2" />
            </g>
          </svg>

          {/* 4. Ambient Glows */}
          <div
            aria-hidden="true"
            className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-blue-500/15 blur-3xl pointer-events-none"
          />
          <div
            aria-hidden="true"
            className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-amber-500/10 blur-3xl pointer-events-none"
          />

          {/* Content Grid */}
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
            
            {/* ================= LEFT COLUMN: HERO INFORMATION ================= */}
            <div className="lg:col-span-5 space-y-6 text-white">
              
              {/* Badge: • Book an Appointment */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#0d234a]/75 backdrop-blur-md border border-white/15 text-xs sm:text-sm font-semibold text-white shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-[#e5a93c]" />
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
