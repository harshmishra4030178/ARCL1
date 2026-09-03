"use client";

import { useState } from "react";
import {
  ChevronDown,
  HelpCircle,
  Sparkles,
  MessageCircleQuestion,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { Link } from "../../utils/navigation.jsx";

const faqData = [
  {
    id: 1,
    question: "Who supplies best laboratory equipment in Navi Mumbai?",
    answer:
      "ARCL Instruments Pvt. Ltd. supplies laboratory and material testing equipment in Navi Mumbai, including civil engineering, concrete, soil, aggregate and general laboratory testing equipment.",
    category: "Suppliers & Network",
  },
  {
    id: 2,
    question: "Does ARCL Instruments supply concrete testing equipment?",
    answer:
      "Yes. ARCL Instruments Pvt. Ltd. supplies concrete testing equipment including compression testing machines, cube moulds, vibrating tables, slump testing equipment and other concrete laboratory instruments.",
    category: "Concrete Testing",
  },
  {
    id: 3,
    question: "Does ARCL supply soil testing equipment in Maharashtra?",
    answer:
      "ARCL Instruments supplies soil testing and geotechnical laboratory equipment for construction, civil engineering and material testing applications across Maharashtra.",
    category: "Soil Mechanics",
  },
  {
    id: 4,
    question: "Top supplier of laboratory equipment in Mumbai?",
    answer:
      "ARCL Instruments Pvt. Ltd. supplies laboratory and material testing equipment in Mumbai & Navi Mumbai, including civil engineering, concrete, soil, aggregate and general laboratory testing equipment. ARCL Instruments is best for Quality & Services.",
    category: "Quality & Service",
  },
  {
    id: 5,
    question: "Does ARCL Instruments calibrate lab equipment?",
    answer:
      "Yes. ARCL Instruments Pvt. Ltd. is also a calibration lab so they do calibration of concrete testing equipment including compression testing machines, cube moulds, vibrating tables, slump testing equipment and other concrete laboratory instruments.",
    category: "Calibration & NABL",
  },
  {
    id: 6,
    question: "Does ARCL supply surveying equipment?",
    answer:
      "ARCL Instruments supplies Surveying equipment and NDT equipment as well, civil engineering and material testing applications across Maharashtra and India.",
    category: "Survey & NDT",
  },
];

const FaqSection = () => {
  // First item open by default
  const [openIndex, setOpenIndex] = useState(0);

  const toggleAccordion = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-12 bg-slate-50/70 border-t border-gray-100">
      <div className="max-w-5xl mx-auto space-y-12">
        
        {/* SECTION HEADER */}
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-[#021C57] px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border border-blue-100 shadow-2xs">
            <MessageCircleQuestion className="w-4 h-4 text-blue-600" />
            Frequently Asked Questions
          </div>

          <h2 className="text-3xl sm:text-4xl font-black text-[#021C57] tracking-tight">
            Common Inquiries & Laboratory Solutions
          </h2>

          <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
            Find quick answers about ARCL Instruments, our manufacturing standards, calibration facilities, and pan-India supply network.
          </p>
        </div>

        {/* FAQ ACCORDION LIST */}
        <div className="space-y-4">
          {faqData.map((faq, index) => {
            const isOpen = openIndex === index;

            return (
              <div
                key={faq.id}
                className={`bg-white rounded-3xl border transition-all duration-300 overflow-hidden shadow-2xs ${
                  isOpen
                    ? "border-blue-300 shadow-md ring-2 ring-blue-50/80"
                    : "border-gray-200/80 hover:border-gray-300"
                }`}
              >
                <button
                  suppressHydrationWarning
                  onClick={() => toggleAccordion(index)}
                  className="w-full text-left p-5 sm:p-6 flex items-center justify-between gap-4 cursor-pointer select-none transition"
                >
                  <div className="flex items-center gap-3.5 sm:gap-4">
                    <span
                      className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 transition ${
                        isOpen
                          ? "bg-[#021C57] text-white"
                          : "bg-blue-50 text-[#021C57]"
                      }`}
                    >
                      Q{index + 1}
                    </span>

                    <span className="font-bold text-[#021C57] text-sm sm:text-base leading-snug">
                      {faq.question}
                    </span>
                  </div>

                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-transform duration-300 ${
                      isOpen
                        ? "bg-blue-100 text-[#021C57] rotate-180"
                        : "bg-gray-50 text-gray-400"
                    }`}
                  >
                    <ChevronDown size={18} />
                  </div>
                </button>

                {/* ACCORDION CONTENT */}
                {isOpen && (
                  <div className="px-5 sm:px-6 pb-6 pt-1 text-sm text-gray-600 leading-relaxed border-t border-gray-100/80 bg-slate-50/40">
                    <div className="flex items-start gap-3 mt-3">
                      <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">
                        A
                      </span>
                      <p className="text-gray-700 font-medium">
                        {faq.answer}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
                      <span className="inline-flex items-center gap-1.5 text-blue-600 font-semibold">
                        <ShieldCheck size={13} /> Verified Supplier Answer
                      </span>
                      <span className="bg-gray-100 px-2.5 py-0.5 rounded-full font-medium text-gray-500">
                        {faq.category}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* BOTTOM HELP FOOTER */}
        <div className="bg-white rounded-3xl border border-gray-200/80 p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs text-center sm:text-left">
          <div className="space-y-1">
            <h3 className="font-bold text-[#021C57] text-base">
              Have a specific technical requirement or tender inquiry?
            </h3>
            <p className="text-xs text-gray-500">
              Our engineering specialists in Navi Mumbai are ready to assist you with custom quotes and calibration.
            </p>
          </div>

          <Link
            to="/contact"
            className="inline-flex items-center gap-2 bg-[#021C57] hover:bg-[#03308f] text-white text-xs font-bold px-6 py-3 rounded-2xl shadow-md transition shrink-0 cursor-pointer"
          >
            Contact Support <ArrowRight size={14} />
          </Link>
        </div>

      </div>
    </section>
  );
};

export default FaqSection;
