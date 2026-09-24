"use client";

import React, { useState } from "react";
import { Clock, Calendar, CheckCircle2, Sparkles, Send, ArrowRight } from "lucide-react";
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
        {/* Main Card Container */}
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#021845] via-[#021C57] to-[#011033] shadow-2xl border border-blue-500/20 p-6 sm:p-10 lg:p-14">
          
          {/* Subtle Background High-Tech Mesh / Constellation Pattern */}
          <div
            aria-hidden="true"
            className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:24px_24px]"
          />
          
          {/* Subtle Ambient Glow Circles */}
          <div
            aria-hidden="true"
            className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-blue-500/20 blur-3xl pointer-events-none"
          />
          <div
            aria-hidden="true"
            className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-amber-500/15 blur-3xl pointer-events-none"
          />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            {/* ================= LEFT COLUMN: HERO INFORMATION ================= */}
            <div className="lg:col-span-5 space-y-6 text-white">
              
              {/* Badge: • Book an Appointment */}
              <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs sm:text-sm font-semibold text-slate-100 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span>Book an Appointment</span>
              </div>

              {/* Heading */}
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
                Book Research <br />
                Testing{" "}
                <span className="italic font-serif text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-sky-200 to-amber-300">
                  Appointment
                </span>
              </h2>

              {/* Description */}
              <p className="text-slate-200/90 text-sm sm:text-base leading-relaxed">
                Schedule your research testing appointment with ease and gain access to
                accurate analysis, expert evaluation, and reliable results tailored to your
                needs.
              </p>

              {/* Working Hours Badge */}
              <div className="pt-2">
                <div className="inline-flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-white text-xs sm:text-sm shadow-md">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400 shrink-0 shadow-sm">
                    <Clock className="w-5 h-5" aria-hidden="true" />
                  </div>
                  <div>
                    <span className="font-bold text-amber-300 block leading-tight">
                      Working Hours :
                    </span>
                    <span className="text-slate-200 text-xs sm:text-sm font-medium">
                      Monday–Saturday, 8:00 AM – 7:00 PM
                    </span>
                  </div>
                </div>
              </div>

            </div>

            {/* ================= RIGHT COLUMN: APPOINTMENT FORM ================= */}
            <div className="lg:col-span-7">
              <div className="bg-slate-900/45 backdrop-blur-xl border border-white/15 rounded-3xl p-6 sm:p-8 lg:p-10 shadow-2xl">
                
                {submitted ? (
                  /* Success Feedback View */
                  <div className="py-8 text-center space-y-4 animate-fade-in">
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
                          className="w-full bg-white/10 hover:bg-white/15 focus:bg-white/20 border border-white/20 focus:border-amber-400 text-white placeholder:text-slate-300 rounded-xl px-4 py-3.5 text-sm focus:outline-none transition shadow-inner"
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
                          className="w-full bg-white/10 hover:bg-white/15 focus:bg-white/20 border border-white/20 focus:border-amber-400 text-white placeholder:text-slate-300 rounded-xl px-4 py-3.5 text-sm focus:outline-none transition shadow-inner"
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
                        className="w-full bg-white/10 hover:bg-white/15 focus:bg-white/20 border border-white/20 focus:border-amber-400 text-white placeholder:text-slate-300 rounded-xl px-4 py-3.5 text-sm focus:outline-none transition shadow-inner"
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
                        className="w-full bg-white/10 hover:bg-white/15 focus:bg-white/20 border border-white/20 focus:border-amber-400 text-white placeholder:text-slate-300 rounded-xl px-4 py-3.5 text-sm focus:outline-none transition shadow-inner"
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
                            className="w-full bg-white/10 hover:bg-white/15 focus:bg-white/20 border border-white/20 focus:border-amber-400 text-white rounded-xl px-4 py-3.5 text-sm focus:outline-none transition appearance-none cursor-pointer shadow-inner"
                          >
                            <option value="" className="bg-slate-900 text-slate-300">
                              Select a Services
                            </option>
                            <option value="Concrete Testing Equipment" className="bg-slate-900 text-white">
                              Concrete Testing Equipment
                            </option>
                            <option value="Soil & Geotechnical Testing" className="bg-slate-900 text-white">
                              Soil &amp; Geotechnical Testing
                            </option>
                            <option value="Aggregate Testing Equipment" className="bg-slate-900 text-white">
                              Aggregate Testing Equipment
                            </option>
                            <option value="Bitumen & Asphalt Testing" className="bg-slate-900 text-white">
                              Bitumen &amp; Asphalt Testing
                            </option>
                            <option value="Cement Testing Equipment" className="bg-slate-900 text-white">
                              Cement Testing Equipment
                            </option>
                            <option value="NABL Calibration & Maintenance" className="bg-slate-900 text-white">
                              NABL Calibration &amp; Maintenance
                            </option>
                            <option value="Surveying & NDT Equipment" className="bg-slate-900 text-white">
                              Surveying &amp; NDT Equipment
                            </option>
                            <option value="Custom Laboratory Setup & Consultation" className="bg-slate-900 text-white">
                              Custom Laboratory Setup
                            </option>
                          </select>
                          
                          {/* Custom Dropdown Arrow */}
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-300">
                            <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
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
                          required
                          className="w-full bg-white/10 hover:bg-white/15 focus:bg-white/20 border border-white/20 focus:border-amber-400 text-white placeholder:text-slate-300 rounded-xl px-4 py-3.5 text-sm focus:outline-none transition shadow-inner [color-scheme:dark] cursor-pointer"
                        />
                      </div>
                    </div>

                    {/* Row 5: Submit Button */}
                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-[#b3832d] via-[#d4a03e] to-[#b3832d] hover:from-[#c29033] hover:to-[#e0ad48] text-white font-extrabold py-4 px-6 rounded-2xl shadow-xl transition-all duration-300 transform hover:scale-[1.01] active:scale-[0.99] text-sm sm:text-base cursor-pointer tracking-wide flex items-center justify-center gap-2.5 disabled:opacity-60"
                      >
                        {loading ? (
                          <>
                            <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>Scheduling Appointment...</span>
                          </>
                        ) : (
                          <>
                            <span>Make An Appointment</span>
                            <ArrowRight className="w-4 h-4" aria-hidden="true" />
                          </>
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
