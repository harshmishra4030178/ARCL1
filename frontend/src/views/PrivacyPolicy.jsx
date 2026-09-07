"use client";

import React from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Lock,
  Eye,
  FileText,
  Server,
  UserCheck,
  Mail,
  Phone,
  MapPin,
  ChevronRight,
  Sparkles,
  HelpCircle,
  Building,
} from "lucide-react";

export default function PrivacyPolicy() {
  const lastUpdated = "September 2026";

  const sections = [
    {
      id: "introduction",
      icon: <Building className="w-5 h-5 text-amber-500" />,
      title: "1. Introduction & Company Overview",
      content: (
        <>
          <p className="text-slate-600 leading-relaxed mb-3">
            Welcome to <strong>ARCL Instruments Pvt. Ltd.</strong> (“ARCL”, “we”, “our”, or “us”). We are an ISO 9001:2015 certified manufacturer and exporter of precision civil engineering, construction materials, soil, concrete, bitumen, and laboratory testing equipment based in Navi Mumbai, Maharashtra, India.
          </p>
          <p className="text-slate-600 leading-relaxed">
            This Privacy Policy outlines our standards regarding the collection, maintenance, protection, and disclosure of personal and business information gathered through our official website (<strong>https://www.arclinstruments.com</strong>), direct technical consultations, and digital quotation inquiry systems.
          </p>
        </>
      ),
    },
    {
      id: "information-collected",
      icon: <Eye className="w-5 h-5 text-amber-500" />,
      title: "2. Information We Collect",
      content: (
        <div className="space-y-3 text-slate-600 leading-relaxed">
          <p>
            When you interact with our catalog, submit RFQs (Request for Quotations), or contact our engineering departments, we may collect the following details:
          </p>
          <ul className="list-disc list-inside space-y-2 pl-2 text-xs sm:text-sm">
            <li>
              <strong>Commercial &amp; Contact Details:</strong> Full Name, Business/Institutional Email Address, Contact Telephone/Mobile Number, Company/Laboratory Name, GSTIN (optional), and Shipping/Delivery Location.
            </li>
            <li>
              <strong>Quotation &amp; Equipment Inquiries:</strong> Selected testing machines, quantity specifications, custom technical requirements, standard compliance preferences (IS, ASTM, BS, DIN), and quotation basket selections.
            </li>
            <li>
              <strong>Technical Usage &amp; Analytics Data:</strong> IP address, browser type, device specifications, pages visited, time spent per technical guide, and referring search engine URLs.
            </li>
          </ul>
        </div>
      ),
    },
    {
      id: "use-of-information",
      icon: <FileText className="w-5 h-5 text-amber-500" />,
      title: "3. How We Use Your Information",
      content: (
        <div className="space-y-3 text-slate-600 leading-relaxed">
          <p>We process collected information strictly for legitimate commercial and technical engineering purposes:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wide mb-1">Quotation &amp; Order Processing</h4>
              <p className="text-xs text-slate-600">Generating formal commercial proforma invoices, technical compliance sheets, and dispatch schedules.</p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wide mb-1">Engineering &amp; Calibration Support</h4>
              <p className="text-xs text-slate-600">Coordinating on-site machine commissioning, NABL-traceable calibration schedules, and warranty service.</p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wide mb-1">Customer Communication</h4>
              <p className="text-xs text-slate-600">Responding to WhatsApp inquiries, email correspondence, and sending status updates regarding equipment availability.</p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wide mb-1">Platform Optimization &amp; Security</h4>
              <p className="text-xs text-slate-600">Protecting our platform against fraudulent access, cyber threats, and optimizing mobile catalog performance.</p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "quote-basket",
      icon: <Lock className="w-5 h-5 text-amber-500" />,
      title: "4. Quotation Basket & Commercial Privacy",
      content: (
        <div className="space-y-3 text-slate-600 leading-relaxed">
          <p>
            Our website provides an instant Multi-Product Quotation Basket. Information saved within your quote basket (such as chosen equipment models, ASTM/IS standards, and technical notes) is stored securely in your browser session and transmitted directly to our sales desk via encrypted HTTPS protocol upon submission.
          </p>
          <p className="font-medium text-slate-800">
            We never sell, lease, rent, or trade your commercial inquiries or client contact lists to any third-party marketing companies.
          </p>
        </div>
      ),
    },
    {
      id: "data-security",
      icon: <Server className="w-5 h-5 text-amber-500" />,
      title: "5. Data Storage, Security & Encryption",
      content: (
        <div className="space-y-3 text-slate-600 leading-relaxed">
          <p>
            We implement enterprise-grade technical, administrative, and physical security measures to safeguard your information against unauthorized access, accidental loss, alteration, or disclosure:
          </p>
          <ul className="list-disc list-inside space-y-1.5 pl-2 text-xs sm:text-sm">
            <li>End-to-end SSL/TLS 256-bit encryption across all digital routes.</li>
            <li>Role-based access controls restricting customer records to authorized ARCL administrative personnel.</li>
            <li>Encrypted cloud backups hosted on compliant Tier-4 enterprise infrastructure.</li>
          </ul>
        </div>
      ),
    },
    {
      id: "cookies",
      icon: <UserCheck className="w-5 h-5 text-amber-500" />,
      title: "6. Cookies & Tracking Technologies",
      content: (
        <p className="text-slate-600 leading-relaxed">
          Our website uses standard essential cookies to remember your quote basket items, display preferences, and capture anonymous traffic analytics through privacy-compliant telemetry. You may disable cookies through your browser settings; however, certain interactive features (such as quote basket persistence) may be limited.
        </p>
      ),
    },
    {
      id: "contact-dpo",
      icon: <HelpCircle className="w-5 h-5 text-amber-500" />,
      title: "7. Contact Privacy Officer",
      content: (
        <div className="space-y-3 text-slate-600 leading-relaxed">
          <p>
            If you have questions, feedback, or requests regarding your personal data, you may reach our compliance department through any of the following channels:
          </p>
          <div className="p-4 rounded-xl bg-slate-900 text-white space-y-2 text-xs sm:text-sm">
            <div className="flex items-center gap-2">
              <Building className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="font-bold">ARCL Instruments Pvt. Ltd. (Compliance &amp; Legal Desk)</span>
            </div>
            <div className="flex items-start gap-2 text-slate-300">
              <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>Shop No. 6, Siddivinayak Park CHS, Sector 8A, Airoli, Navi Mumbai, Maharashtra - 400708, India</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <Phone className="w-4 h-4 text-amber-400 shrink-0" />
              <span>+91 8169695728 / +91 8369458583</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <Mail className="w-4 h-4 text-amber-400 shrink-0" />
              <span>arclinstruments@gmail.com / info@arclinstruments.com</span>
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      {/* Hero Header */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950 text-white py-14 sm:py-20 border-b border-amber-500/20">
        <div className="absolute inset-0 bg-[radial-gradient(#eab308_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-xs text-slate-400 mb-6 font-medium">
            <Link href="/" className="hover:text-amber-400 transition-colors">
              Home
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-amber-300 font-semibold">Privacy Policy</span>
          </nav>

          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-400/30 text-amber-300 text-xs font-bold tracking-wide uppercase mb-4 backdrop-blur-md">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span>ISO 9001:2015 Certified Data Protection</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-tight mb-4">
            Privacy Policy &amp; <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-200">
              Data Protection Standards
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
            Learn how ARCL Instruments Pvt. Ltd. collects, safeguards, and handles your laboratory equipment inquiries, quotations, and commercial data.
          </p>

          <div className="mt-6 flex items-center gap-4 text-xs text-slate-400">
            <span>Last Updated: <strong className="text-white">{lastUpdated}</strong></span>
            <span>•</span>
            <span>Applicable to: <strong className="text-white">All Global &amp; Domestic Clients</strong></span>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-10 space-y-10">
          
          {sections.map((sec) => (
            <section key={sec.id} id={sec.id} className="scroll-mt-28 space-y-3 pb-8 border-b border-slate-100 last:border-b-0 last:pb-0">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-amber-50 border border-amber-200/60 shrink-0">
                  {sec.icon}
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                  {sec.title}
                </h2>
              </div>
              <div className="text-xs sm:text-sm pl-0 sm:pl-11">
                {sec.content}
              </div>
            </section>
          ))}

          {/* Bottom Action Card */}
          <div className="mt-8 p-6 rounded-2xl bg-gradient-to-r from-slate-900 to-blue-950 text-white flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-sm sm:text-base flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Need Technical or Commercial Assistance?</span>
              </h3>
              <p className="text-xs text-slate-300 mt-1">
                Our civil engineering specialists are available to discuss customized laboratory setups and testing apparatus.
              </p>
            </div>
            <Link
              href="/contact"
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition-all whitespace-nowrap"
            >
              Contact Engineering Desk
            </Link>
          </div>

        </div>
      </main>
    </div>
  );
}
