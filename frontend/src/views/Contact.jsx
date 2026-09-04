"use client";

import React, { useState } from "react";
import {
  MapPin,
  Phone,
  Mail,
  Send,
  User,
  MessageSquare,
  Clock,
  ArrowUpRight,
} from "lucide-react";
import { useContactStore } from "../store/useContactStore.js";
import { toast } from "react-toastify";

function Contact() {
  const { createContact, loading } = useContactStore();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await createContact(formData);

      toast.success("Message sent successfully! We will get back to you soon.");

      setFormData({
        name: "",
        email: "",
        subject: "",
        message: "",
      });
    } catch (error) {
      toast.error(error.message || "Failed to send message");
    }
  };

  const contactItems = [
    {
      icon: MapPin,
      label: "Head Office & Address",
      content: (
        <div className="space-y-2">
          <a
            href="https://maps.app.goo.gl/Xa2cZMx3Dg8yqrB49"
            target="_blank"
            rel="noreferrer"
            className="group block"
          >
            <span className="block font-semibold text-[#021C57] transition group-hover:text-blue-700">
              ARCL Instruments Pvt. Ltd.
            </span>

            <span className="mt-1 block text-sm leading-6 text-slate-500">
              Shop No. 6, Siddivinayak Park CHS,
              <br />
              Sector - 8A Airoli,
              <br />
              Navi Mumbai - 400708
            </span>

            <span className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-blue-600 group-hover:underline">
              View on Google Maps
              <ArrowUpRight className="h-3.5 w-3.5" />
            </span>
          </a>

          <div className="pt-2 border-t border-slate-100 space-y-1">
            <a
              href="tel:+918169695728"
              className="flex items-center gap-2 text-sm font-semibold text-[#021C57] hover:text-blue-700"
            >
              <Phone className="h-3.5 w-3.5 text-blue-600 shrink-0" />
              +91 8169695728
            </a>
            <a
              href="mailto:arclinstruments@gmail.com"
              className="flex items-center gap-2 text-xs font-medium text-slate-600 hover:text-blue-700 truncate"
            >
              <Mail className="h-3.5 w-3.5 text-blue-600 shrink-0" />
              arclinstruments@gmail.com
            </a>
            <a
              href="mailto:info@arclinstruments.com"
              className="flex items-center gap-2 text-xs font-medium text-slate-600 hover:text-blue-700 truncate"
            >
              <Mail className="h-3.5 w-3.5 text-blue-600 shrink-0" />
              info@arclinstruments.com
            </a>
          </div>
        </div>
      ),
    },

    {
      icon: Phone,
      label: "Sales Department",
      content: (
        <div className="space-y-2">
          <p className="text-xs text-slate-500">
            For product inquiries, price quotes, tender supplies & machine orders:
          </p>

          <div className="space-y-1.5">
            <a
              href="tel:+918369458583"
              className="flex items-center gap-2 text-sm font-semibold text-[#021C57] hover:text-blue-700"
            >
              <Phone className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
              +91 8369458583
            </a>

            <a
              href="mailto:abhinav@arclinstruments.com"
              className="flex items-center gap-2 text-xs font-medium text-slate-600 hover:text-blue-700 truncate"
            >
              <Mail className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
              abhinav@arclinstruments.com
            </a>
          </div>

          <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-400">
            <Clock className="h-3 w-3" />
            Monday to Saturday · 9:30 AM to 6:00 PM
          </div>
        </div>
      ),
    },

    {
      icon: Mail,
      label: "Calibration Department",
      content: (
        <div className="space-y-2">
          <p className="text-xs text-slate-500">
            For NABL traceable calibration services, certificates & testing inquiries:
          </p>

          <div className="space-y-1.5">
            <a
              href="tel:+916205691085"
              className="flex items-center gap-2 text-sm font-semibold text-[#021C57] hover:text-blue-700"
            >
              <Phone className="h-3.5 w-3.5 text-cyan-600 shrink-0" />
              +91 6205691085
            </a>

            <a
              href="mailto:rupak@arclinstruments.com"
              className="flex items-center gap-2 text-xs font-medium text-slate-600 hover:text-blue-700 truncate"
            >
              <Mail className="h-3.5 w-3.5 text-cyan-600 shrink-0" />
              rupak@arclinstruments.com
            </a>
          </div>

          <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-400">
            <Clock className="h-3 w-3" />
            Specialist Calibration Support
          </div>
        </div>
      ),
    },
  ];

  return (
    <main className="min-h-screen overflow-hidden bg-[#f4f7fb] text-slate-800">

      {/* =====================================================
          HERO
      ===================================================== */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#021C57] via-[#052b7a] to-[#043399]">

        {/* Decorative circles */}
        <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full border border-white/10" />
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full border border-white/10" />

        <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-5 py-20 sm:px-8 md:py-24 lg:px-10">

          <div className="max-w-3xl">

            <div className="mb-6 inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/10 px-4 py-2 backdrop-blur-sm">
              <span className="h-2 w-2 rounded-full bg-blue-300" />

              <span className="text-[10px] font-semibold tracking-[0.25em] text-blue-100">
                ARCL INSTRUMENTS
              </span>
            </div>

            <h1 className="text-4xl font-semibold leading-tight tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl">
              Let's talk about
              <span className="block text-blue-200">
                your requirements.
              </span>
            </h1>

            <p className="mt-6 max-w-2xl text-sm leading-7 text-blue-100/80 sm:text-base md:text-lg">
              Have questions or need assistance? Connect with our team to
              discuss your laboratory requirements, product inquiries,
              technical support, or any other assistance you need.
            </p>

          </div>

        </div>
      </section>


      {/* =====================================================
          MAIN CONTENT
      ===================================================== */}
      <section className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 md:py-16 lg:px-8">

        {/* Small top decoration */}
        <div className="mx-auto mb-10 flex max-w-5xl items-center justify-center gap-3">
          <div className="h-px flex-1 bg-slate-200" />

          <span className="rounded-full border border-slate-200 bg-white px-4 py-2 text-[10px] font-semibold tracking-[0.2em] text-slate-400 shadow-sm">
            GET IN TOUCH
          </span>

          <div className="h-px flex-1 bg-slate-200" />
        </div>


        {/* =================================================
            MAIN CARD
        ================================================= */}
        <div className="mx-auto max-w-6xl overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-[0_25px_80px_rgba(15,35,70,0.10)]">

          <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr]">


            {/* =================================================
                FORM
            ================================================= */}
            <div className="p-6 sm:p-8 md:p-10 lg:p-14">

              <div className="mb-9">

                <div className="mb-3 text-xs font-semibold tracking-[0.18em] text-blue-600">
                  SEND US A MESSAGE
                </div>

                <h2 className="text-2xl font-bold tracking-tight text-[#021C57] sm:text-3xl">
                  How can we help?
                </h2>

                <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                  Fill in the details below and our team will get back to you
                  as soon as possible.
                </p>

              </div>


              <form onSubmit={handleSubmit} className="space-y-5">


                {/* NAME */}
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Full Name
                  </label>

                  <div className="group relative">

                    <User className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 transition group-focus-within:text-[#021C57]" />

                    <input
                      type="text"
                      name="name"
                      placeholder="Enter your full name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="
                        w-full
                        rounded-2xl
                        border
                        border-slate-200
                        bg-slate-50
                        py-3.5
                        pl-12
                        pr-4
                        text-sm
                        text-slate-700
                        outline-none
                        transition
                        placeholder:text-slate-400
                        hover:border-slate-300
                        focus:border-[#021C57]
                        focus:bg-white
                        focus:ring-4
                        focus:ring-blue-900/5
                      "
                    />

                  </div>
                </div>


                {/* EMAIL */}
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Email Address
                  </label>

                  <div className="group relative">

                    <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 transition group-focus-within:text-[#021C57]" />

                    <input
                      type="email"
                      name="email"
                      placeholder="Enter your email address"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="
                        w-full
                        rounded-2xl
                        border
                        border-slate-200
                        bg-slate-50
                        py-3.5
                        pl-12
                        pr-4
                        text-sm
                        text-slate-700
                        outline-none
                        transition
                        placeholder:text-slate-400
                        hover:border-slate-300
                        focus:border-[#021C57]
                        focus:bg-white
                        focus:ring-4
                        focus:ring-blue-900/5
                      "
                    />

                  </div>
                </div>


                {/* SUBJECT */}
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Subject
                  </label>

                  <div className="group relative">

                    <MessageSquare className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 transition group-focus-within:text-[#021C57]" />

                    <input
                      type="text"
                      name="subject"
                      placeholder="What is your query about?"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                      className="
                        w-full
                        rounded-2xl
                        border
                        border-slate-200
                        bg-slate-50
                        py-3.5
                        pl-12
                        pr-4
                        text-sm
                        text-slate-700
                        outline-none
                        transition
                        placeholder:text-slate-400
                        hover:border-slate-300
                        focus:border-[#021C57]
                        focus:bg-white
                        focus:ring-4
                        focus:ring-blue-900/5
                      "
                    />

                  </div>
                </div>


                {/* MESSAGE */}
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Message
                  </label>

                  <div className="group relative">

                    <MessageSquare className="absolute left-4 top-4 h-5 w-5 text-slate-400 transition group-focus-within:text-[#021C57]" />

                    <textarea
                      name="message"
                      rows="5"
                      placeholder="Write your message here..."
                      value={formData.message}
                      onChange={handleChange}
                      required
                      className="
                        w-full
                        resize-none
                        rounded-2xl
                        border
                        border-slate-200
                        bg-slate-50
                        py-3.5
                        pl-12
                        pr-4
                        text-sm
                        leading-6
                        text-slate-700
                        outline-none
                        transition
                        placeholder:text-slate-400
                        hover:border-slate-300
                        focus:border-[#021C57]
                        focus:bg-white
                        focus:ring-4
                        focus:ring-blue-900/5
                      "
                    />

                  </div>
                </div>


                {/* SUBMIT BUTTON */}
                <button
                  type="submit"
                  disabled={loading}
                  className="
                    group
                    flex
                    w-full
                    items-center
                    justify-center
                    gap-2
                    rounded-2xl
                    bg-[#021C57]
                    px-6
                    py-4
                    text-sm
                    font-semibold
                    text-white
                    shadow-lg
                    shadow-blue-950/10
                    transition-all
                    duration-300
                    hover:bg-[#06317d]
                    hover:shadow-xl
                    hover:shadow-blue-950/20
                    disabled:cursor-not-allowed
                    disabled:opacity-60
                  "
                >

                  <Send className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />

                  {loading ? "Sending..." : "Send Message"}

                </button>

              </form>

            </div>


            {/* =================================================
                CONTACT INFORMATION
            ================================================= */}
            <div className="relative bg-[#f5f8fc] p-5 sm:p-8 lg:p-10">

              {/* Decorative background */}
              <div className="absolute right-0 top-0 h-56 w-56 rounded-full bg-blue-100/50 blur-3xl" />

              <div className="relative">

                <div className="mb-8">

                  <div className="mb-3 text-xs font-semibold tracking-[0.18em] text-blue-600">
                    CONTACT INFORMATION
                  </div>

                  <h2 className="text-2xl font-bold tracking-tight text-[#021C57] sm:text-3xl">
                    We're here to help.
                  </h2>

                  <p className="mt-3 text-sm leading-6 text-slate-500">
                    Reach out to us through any of the following contact
                    details. Our team is ready to assist you.
                  </p>

                </div>


                {/* CONTACT ITEMS */}
                <div className="overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-sm">

                  {contactItems.map((item, index) => {

                    const Icon = item.icon;

                    return (
                      <div
                        key={item.label}
                        className={`
                          flex
                          items-start
                          gap-4
                          p-6
                          transition
                          hover:bg-slate-50
                          ${
                            index !== contactItems.length - 1
                              ? "border-b border-slate-100"
                              : ""
                          }
                        `}
                      >

                        {/* ICON */}
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50">

                          <Icon className="h-5 w-5 text-[#021C57]" />

                        </div>


                        {/* CONTENT */}
                        <div className="min-w-0 flex-1">

                          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                            {item.label}
                          </p>

                          {item.content}

                        </div>

                      </div>
                    );
                  })}

                </div>


                {/* BOTTOM MESSAGE */}
                <div className="mt-6 overflow-hidden rounded-[24px] bg-[#021C57] p-6 text-white shadow-lg">

                  <div className="flex items-start gap-4">

                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10">

                      <Send className="h-4 w-4" />

                    </div>

                    <div>

                      <h3 className="text-sm font-semibold">
                        Have a specific requirement?
                      </h3>

                      <p className="mt-1 text-xs leading-5 text-blue-100/70">
                        Tell us what you need and our team will help you find
                        the right solution.
                      </p>

                    </div>

                  </div>

                </div>

              </div>

            </div>

          </div>

        </div>


        {/* =====================================================
            MAP SECTION
        ===================================================== */}
        <div className="mx-auto mt-10 max-w-6xl">

          <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">

            <div>

              <div className="text-xs font-semibold tracking-[0.18em] text-blue-600">
                FIND US
              </div>

              <h2 className="mt-2 text-2xl font-bold text-[#021C57] sm:text-3xl">
                Our Location
              </h2>

            </div>

            <a
              href="https://maps.app.goo.gl/Xa2cZMx3Dg8yqrB49"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#021C57] hover:text-blue-700"
            >
              Open in Google Maps
              <ArrowUpRight className="h-4 w-4" />
            </a>

          </div>


          <div className="overflow-hidden rounded-[30px] border border-slate-200 bg-white p-2 shadow-xl">

            <div className="overflow-hidden rounded-[24px]">

              <iframe
                title="ARCL Instruments Location"
                className="h-[320px] w-full sm:h-[400px] lg:h-[460px]"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3769.167942153726!2d72.99040537775795!3d19.144124582074515!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3be7b72f867ac6c3%3A0x660b75f814afccbe!2sARCL%20Instruments%20Private%20Limited!5e0!3m2!1sen!2sin!4v1768400080697!5m2!1sen!2sin"
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />

            </div>

          </div>

        </div>

      </section>

    </main>
  );
}

export default Contact;