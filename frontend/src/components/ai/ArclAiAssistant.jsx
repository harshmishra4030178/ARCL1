"use client";

import React, { useState, useRef, useEffect } from "react";
import { Link } from "../../utils/navigation.jsx";
import { useQuoteCartStore } from "../../store/useQuoteCartStore.js";
import { useAiAssistantStore } from "../../store/useAiAssistantStore.js";
import {
  Bot,
  Sparkles,
  X,
  Send,
  ShoppingBag,
  CheckCircle2,
  PhoneCall,
  Mail,
  ShieldCheck,
  Layers,
  ArrowRight,
} from "lucide-react";
import { formatTitleCase } from "../../utils/stringUtils.js";

import { generateArclAiAnswer, ARCL_PRODUCTS } from "../../utils/arclAiEngine.js";

export default function ArclAiAssistant() {
  const { isOpen, closeAssistant } = useAiAssistantStore();
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: "welcome",
      sender: "ai",
      text: "Namaste! 🙏 I am your **ARCL Technical Lab Assistant**.\n\nAap mujhse kisi bhi machine, Testing Standards (IS/ASTM), rates, ya lab packages ke bare me **Hindi, Hinglish ya English** me pooch sakte hain.",
      time: "Just now",
      suggestions: [
        "ARCL me kya kya milta hai?",
        "Concrete Cube Testing Machines (IS 516)",
        "Bitumen Lab Equipments (IS 73)",
        "Company Contact & Delivery details",
      ],
    },
  ]);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = async (textToSend) => {
    const query = (textToSend || input).trim();
    if (!query) return;

    // Add User Message
    const userMsg = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: query,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    // Try Next.js Gemini Route first; fall back to local conversational engine seamlessly
    try {
      const res = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: query }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.text) {
          const aiMsg = {
            id: `ai-${Date.now()}`,
            sender: "ai",
            text: data.text,
            recommendedProducts: [],
            suggestions: ["ARCL me kya kya milta hai?", "Contact Sales Desk"],
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          };
          setMessages((prev) => [...prev, aiMsg]);
          setIsTyping(false);
          return;
        }
      }
    } catch (e) {
      // Fall through to local conversational engine
    }

    // Local Conversational Engine
    setTimeout(() => {
      const response = generateArclAiAnswer(query);

      const aiMsg = {
        id: `ai-${Date.now()}`,
        sender: "ai",
        text: response.text,
        recommendedProducts: response.recommendedProducts || [],
        suggestions: response.suggestions || [],
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    }, 350);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 right-2 sm:right-6 z-[99999] w-[95vw] sm:w-[420px] max-h-[85vh] h-[580px] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-slideUp">
      
      {/* Header */}
      <div className="px-4 py-3.5 bg-gradient-to-r from-[#021C57] via-[#082970] to-[#021C57] text-white flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-amber-400 text-blue-950 flex items-center justify-center shadow-md">
            <Bot size={20} />
          </div>
          <div>
            <h3 className="text-sm font-black flex items-center gap-1.5 text-white">
              ARCL AI Assistant
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                Online
              </span>
            </h3>
            <p className="text-[10px] text-blue-200">Civil Lab Standards & Equipment Expert</p>
          </div>
        </div>

        <button
          onClick={closeAssistant}
          className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
          aria-label="Close Chat"
        >
          <X size={18} />
        </button>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50 text-xs">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex flex-col ${m.sender === "user" ? "items-end" : "items-start"}`}
          >
            <div
              className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 shadow-xs leading-relaxed ${
                m.sender === "user"
                  ? "bg-[#021C57] text-white rounded-br-none"
                  : "bg-white text-slate-800 border border-slate-200/80 rounded-bl-none"
              }`}
            >
              <div
                className="whitespace-pre-line"
                dangerouslySetInnerHTML={{
                  __html: m.text
                    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                    .replace(/\n/g, "<br />"),
                }}
              />

              {/* Product Recommendations Cards */}
              {m.recommendedProducts && m.recommendedProducts.length > 0 && (
                <div className="mt-3 space-y-2 border-t border-slate-100 pt-2">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                    <Sparkles size={10} className="text-amber-500" />
                    Recommended Equipment:
                  </div>
                  {m.recommendedProducts.map((p, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200/70 hover:border-blue-300 transition"
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        <img
                          src={p.image}
                          alt={p.name}
                          className="w-8 h-8 object-contain rounded bg-white p-0.5 shrink-0"
                        />
                        <div className="truncate">
                          <span className="font-bold text-slate-900 block truncate text-[11px]">
                            {formatTitleCase(p.name)}
                          </span>
                          {p.code && (
                            <span className="text-[9px] font-mono text-blue-900 font-semibold">
                              {p.code}
                            </span>
                          )}
                        </div>
                      </div>

                      <Link
                        to={`/products/${p.slug}`}
                        onClick={closeAssistant}
                        className="shrink-0 px-2.5 py-1 bg-[#021C57] text-white rounded-lg text-[10px] font-bold hover:bg-blue-900 transition flex items-center gap-1"
                      >
                        <span>View</span>
                        <ArrowRight size={10} />
                      </Link>
                    </div>
                  ))}
                </div>
              )}

              {/* Suggestion Starter Pills */}
              {m.suggestions && m.suggestions.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5 pt-1">
                  {m.suggestions.map((sug, i) => (
                    <button
                      key={i}
                      onClick={() => handleSend(sug)}
                      className="text-[10px] font-semibold bg-blue-50 text-blue-900 border border-blue-200/70 hover:bg-blue-100 px-2.5 py-1 rounded-full transition text-left cursor-pointer"
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <span className="text-[9px] text-slate-400 mt-1 px-1">{m.time}</span>
          </div>
        ))}

        {isTyping && (
          <div className="flex items-center gap-1.5 text-slate-400 text-xs px-2 py-1">
            <Bot size={14} className="text-[#021C57] animate-spin" />
            <span>ARCL AI is analyzing testing standards...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input Bar */}
      <div className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Ask in Hindi / Hinglish / English..."
          className="flex-1 bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#021C57] focus:bg-white transition"
        />
        <button
          onClick={() => handleSend()}
          disabled={!input.trim()}
          className="p-2 bg-[#021C57] text-white rounded-xl hover:bg-blue-900 disabled:opacity-40 transition shadow-xs cursor-pointer"
        >
          <Send size={15} />
        </button>
      </div>

    </div>
  );
}
