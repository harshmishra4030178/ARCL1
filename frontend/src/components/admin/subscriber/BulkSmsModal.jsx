"use client";

import { useEffect, useRef, useState } from "react";
import {
  MessageSquare,
  Send,
  Users,
  Sparkles,
  Smartphone,
  CheckCircle2,
  Clock,
  History,
  X,
  AlertCircle,
  Phone,
  Mail,
  Image as ImageIcon,
  Upload,
  Trash2,
  Layout,
  ExternalLink,
  Layers,
} from "lucide-react";
import {
  getSmsAudiencesApi,
  sendBulkSmsApi,
  getSmsCampaignsApi,
} from "../../../api/subscriberApi.js";
import { toast } from "react-toastify";

const PRESET_TEMPLATES = [
  {
    title: "Diwali & Festive Greetings",
    subject: "Warm Festive Greetings & Special Wishes from ARCL Instruments",
    message:
      "Wishing you and your esteemed organization a joyous, prosperous, and successful Festive Season! May this season bring excellence and precision to all your testing and calibration operations.\n\nThank you for choosing ARCL Instruments.",
    image:
      "https://images.unsplash.com/photo-1577083552431-6e5fd01aa342?w=800&auto=format&fit=crop&q=80",
  },
  {
    title: "New Year 2026 Wishes",
    subject: "Happy New Year 2026 from the ARCL Instruments Family",
    message:
      "As we step into the New Year, ARCL Instruments extends our warmest wishes for a year filled with innovation, precision, and monumental growth. We look forward to supporting your laboratory infrastructure throughout 2026.",
    image:
      "https://images.unsplash.com/photo-1546271876-af61017c129f?w=800&auto=format&fit=crop&q=80",
  },
  {
    title: "Special 10% Festive Discount",
    subject: "Exclusive 10% Festive Discount on Laboratory Testing Equipment",
    message:
      "Celebration Offer: Get up to 10% exclusive discount on high-precision Civil, Mechanical, and Soil testing instruments this month. Request your official quotation today to lock in special pricing!",
    image:
      "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80",
  },
  {
    title: "New Equipment Launch",
    subject: "New Advanced Testing Equipment Launched - ARCL Instruments",
    message:
      "ARCL Instruments Alert: New advanced laboratory testing equipment is now officially available! Explore detailed technical specifications, calibration certificates, and get instant quotes at: https://arcl.com/products",
    image:
      "https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=800&auto=format&fit=crop&q=80",
  },
];

const BulkSmsModal = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState("compose"); // "compose" | "history"
  const [previewMode, setPreviewMode] = useState("email"); // "email" | "sms"

  // Channels: "SMS", "EMAIL" or both
  const [channels, setChannels] = useState(["SMS", "EMAIL"]);

  // Fields
  const [title, setTitle] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [message, setMessage] = useState("");
  const [ctaText, setCtaText] = useState("Explore ARCL Instruments");
  const [ctaLink, setCtaLink] = useState("https://arcl.com");

  // Image handling
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [imageUrlInput, setImageUrlInput] = useState("");
  const fileInputRef = useRef(null);

  // Audiences
  const [targetAudiences, setTargetAudiences] = useState([
    "subscribers",
    "inquiries",
    "contacts",
  ]);
  const [customNumbersInput, setCustomNumbersInput] = useState("");
  const [customEmailsInput, setCustomEmailsInput] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);

  // Data & State
  const [audiencesData, setAudiencesData] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [loadingAudiences, setLoadingAudiences] = useState(false);
  const [sending, setSending] = useState(false);
  const [loadingCampaigns, setLoadingCampaigns] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchAudiences();
      fetchCampaigns();
    }
  }, [isOpen]);

  const fetchAudiences = async () => {
    try {
      setLoadingAudiences(true);
      const res = await getSmsAudiencesApi();
      setAudiencesData(res.data?.data || null);
    } catch (err) {
      console.error("Failed to load broadcast audiences:", err);
    } finally {
      setLoadingAudiences(false);
    }
  };

  const fetchCampaigns = async () => {
    try {
      setLoadingCampaigns(true);
      const res = await getSmsCampaignsApi();
      setCampaigns(res.data?.data?.campaigns || []);
    } catch (err) {
      console.error("Failed to load campaigns:", err);
    } finally {
      setLoadingCampaigns(false);
    }
  };

  if (!isOpen) return null;

  // Toggle channel
  const toggleChannel = (ch) => {
    setChannels((prev) => {
      if (prev.includes(ch)) {
        if (prev.length === 1) return prev; // Keep at least one channel
        return prev.filter((c) => c !== ch);
      }
      return [...prev, ch];
    });
  };

  // Toggle audience checkbox
  const toggleAudience = (type) => {
    setTargetAudiences((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  // Handle local image file selection
  const handleImageFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setImageUrlInput("");
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview("");
    setImageUrlInput("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Parse custom numbers and emails
  const parsedCustomNumbers = customNumbersInput
    .split(/[\n,;]+/)
    .map((n) => n.trim())
    .filter((n) => n.length >= 10);

  const parsedCustomEmails = customEmailsInput
    .split(/[\n,;]+/)
    .map((e) => e.trim().toLowerCase())
    .filter((e) => /^\S+@\S+\.\S+$/.test(e));

  // Estimate total recipients
  const segments = audiencesData?.segments || {};
  let totalPhones = 0;
  let totalEmails = 0;

  if (targetAudiences.includes("subscribers")) {
    totalPhones += segments.subscribers?.phoneCount || 0;
    totalEmails += segments.subscribers?.emailCount || 0;
  }
  if (targetAudiences.includes("inquiries")) {
    totalPhones += segments.inquiries?.phoneCount || 0;
    totalEmails += segments.inquiries?.emailCount || 0;
  }
  if (targetAudiences.includes("contacts")) {
    totalPhones += segments.contacts?.phoneCount || 0;
    totalEmails += segments.contacts?.emailCount || 0;
  }

  totalPhones += parsedCustomNumbers.length;
  totalEmails += parsedCustomEmails.length;

  const effectiveImageUrl = imagePreview || imageUrlInput;

  // SMS Credit calculation
  const charCount = message.length;
  const smsCreditCount = Math.max(1, Math.ceil(charCount / 160)) || 1;

  // SEND BROADCAST
  const handleSendBroadcast = async () => {
    if (!message.trim()) {
      toast.error("Please enter a message body.");
      return;
    }

    if (channels.includes("EMAIL") && !emailSubject.trim() && !title.trim()) {
      toast.error("Please provide an email subject line or campaign title.");
      return;
    }

    if (targetAudiences.length === 0 && parsedCustomNumbers.length === 0 && parsedCustomEmails.length === 0) {
      toast.error("Please select at least one audience segment or enter custom recipients.");
      return;
    }

    const channelSummary =
      channels.includes("SMS") && channels.includes("EMAIL")
        ? `~${totalPhones} SMS + ~${totalEmails} Emails`
        : channels.includes("EMAIL")
        ? `~${totalEmails} Emails`
        : `~${totalPhones} SMS`;

    if (
      !window.confirm(
        `Are you sure you want to dispatch this bulk broadcast to ${channelSummary}?`
      )
    ) {
      return;
    }

    try {
      setSending(true);

      const formData = new FormData();
      formData.append("title", title.trim() || emailSubject.trim() || "Broadcast Campaign");
      formData.append("emailSubject", emailSubject.trim() || title.trim() || "Announcement from ARCL Instruments");
      formData.append("message", message.trim());
      formData.append("channels", JSON.stringify(channels));
      formData.append("targetAudiences", JSON.stringify(targetAudiences));
      formData.append("ctaText", ctaText.trim() || "Visit ARCL Instruments");
      formData.append("ctaLink", ctaLink.trim() || "https://arcl.com");

      if (parsedCustomNumbers.length > 0) {
        formData.append("customNumbers", JSON.stringify(parsedCustomNumbers));
      }
      if (parsedCustomEmails.length > 0) {
        formData.append("customEmails", JSON.stringify(parsedCustomEmails));
      }

      if (imageFile) {
        formData.append("image", imageFile);
      } else if (imageUrlInput.trim()) {
        formData.append("imageUrl", imageUrlInput.trim());
      }

      const res = await sendBulkSmsApi(formData);
      
      if (res.data?.data?.warning === "SMTP_NOT_CONFIGURED" || res.data?.data?.stats?.email?.simulated) {
        toast.warn(
          "Emails were simulated because SMTP credentials (SMTP_USER/SMTP_PASS) are not set in backend/.env. Please configure your Gmail App Password in .env to deliver to real inboxes.",
          { autoClose: 8000 }
        );
      } else if (res.data?.data?.warning) {
        toast.warn(res.data.data.warning, { autoClose: 7000 });
      } else {
        toast.success(
          res.data?.message || "Broadcast successfully dispatched to all recipients!"
        );
      }

      // Reset form
      setMessage("");
      setTitle("");
      setEmailSubject("");
      removeImage();
      setCustomNumbersInput("");
      setCustomEmailsInput("");
      setShowCustomInput(false);
      fetchCampaigns();
      setActiveTab("history");
    } catch (err) {
      console.error("Broadcast send error:", err);
      toast.error(err.response?.data?.message || "Failed to dispatch broadcast.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* MODAL HEADER */}
        <div className="bg-gradient-to-r from-[#021C57] via-[#082977] to-[#0D3692] p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-white/10 border border-white/15">
              <Sparkles className="text-amber-400 w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight">
                Broadcast Campaign Hub (SMS, Email & Greeting Banners)
              </h2>
              <p className="text-xs text-blue-100">
                Send festival greetings, product announcements & promotional alerts in bulk
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="bg-white/10 backdrop-blur-xs p-1 rounded-xl flex items-center border border-white/15 text-xs font-semibold">
              <button
                onClick={() => setActiveTab("compose")}
                className={`px-3 py-1 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                  activeTab === "compose"
                    ? "bg-white text-[#021C57] shadow-xs"
                    : "text-white/80 hover:text-white"
                }`}
              >
                <Send size={12} /> Compose
              </button>
              <button
                onClick={() => setActiveTab("history")}
                className={`px-3 py-1 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                  activeTab === "history"
                    ? "bg-white text-[#021C57] shadow-xs"
                    : "text-white/80 hover:text-white"
                }`}
              >
                <History size={12} /> Dispatched Logs ({campaigns.length})
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
              title="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* MODAL BODY */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6">
          {activeTab === "compose" ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* LEFT FORM (7 COLS) */}
              <div className="lg:col-span-7 space-y-4">
                
                {/* 1. DISPATCH CHANNELS SELECTOR */}
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-gray-200/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                      1. Broadcast Channels
                    </span>
                    <span className="text-[11px] text-gray-400">Select one or both</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => toggleChannel("SMS")}
                      className={`p-3 rounded-xl border font-semibold text-xs flex items-center justify-between transition cursor-pointer ${
                        channels.includes("SMS")
                          ? "bg-white border-[#021C57] text-[#021C57] shadow-xs ring-2 ring-blue-100 font-bold"
                          : "bg-white/60 border-gray-200 text-gray-500 hover:bg-white"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <Smartphone size={15} className="text-blue-600" />
                        <span>SMS / Mobile Alerts</span>
                      </span>
                      <span className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-mono">
                        ~{totalPhones} phones
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => toggleChannel("EMAIL")}
                      className={`p-3 rounded-xl border font-semibold text-xs flex items-center justify-between transition cursor-pointer ${
                        channels.includes("EMAIL")
                          ? "bg-white border-[#021C57] text-[#021C57] shadow-xs ring-2 ring-blue-100 font-bold"
                          : "bg-white/60 border-gray-200 text-gray-500 hover:bg-white"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <Mail size={15} className="text-indigo-600" />
                        <span>Email Blast (HTML)</span>
                      </span>
                      <span className="text-[10px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded font-mono">
                        ~{totalEmails} emails
                      </span>
                    </button>
                  </div>
                </div>

                {/* 2. FESTIVAL & SEASONAL PRESETS */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                    <Sparkles size={13} className="text-amber-500" /> Quick Festival & Announcement Templates
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {PRESET_TEMPLATES.map((tmpl, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setMessage(tmpl.message);
                          setTitle(tmpl.title);
                          setEmailSubject(tmpl.subject);
                          setImageUrlInput(tmpl.image || "");
                          setImagePreview(tmpl.image || "");
                        }}
                        className="text-[11px] bg-gray-100 hover:bg-blue-50 hover:text-blue-700 border border-gray-200 px-2.5 py-1 rounded-xl font-medium transition cursor-pointer"
                      >
                        {tmpl.title}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. CAMPAIGN TITLE & EMAIL SUBJECT */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700">Campaign Title</label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Diwali Greeting & Flash Discount"
                      className="w-full px-3.5 py-2 text-xs border border-gray-200 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>

                  {channels.includes("EMAIL") && (
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-700">Email Subject Line</label>
                      <input
                        type="text"
                        value={emailSubject}
                        onChange={(e) => setEmailSubject(e.target.value)}
                        placeholder="e.g. Warm Diwali Wishes from ARCL Instruments"
                        className="w-full px-3.5 py-2 text-xs border border-gray-200 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />
                    </div>
                  )}
                </div>

                {/* 4. IMAGE / GREETING BANNER UPLOAD */}
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-gray-200/80 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                      <ImageIcon size={14} className="text-blue-600" /> Greeting / Festival Image Banner
                    </label>
                    <span className="text-[10px] text-gray-400">JPG, PNG, WEBP (Optional)</span>
                  </div>

                  {effectiveImageUrl ? (
                    <div className="relative rounded-2xl overflow-hidden border border-gray-200 bg-white max-h-40 group">
                      <img
                        src={effectiveImageUrl}
                        alt="Campaign Banner Preview"
                        className="w-full h-36 object-cover"
                      />
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute top-2 right-2 bg-red-600 text-white p-1.5 rounded-xl shadow-md hover:bg-red-700 transition cursor-pointer"
                        title="Remove Image"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageFileChange}
                        accept="image/*"
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex items-center justify-center gap-1.5 bg-white hover:bg-gray-100 text-gray-700 text-xs font-semibold px-4 py-2 rounded-xl border border-gray-200 shadow-2xs transition cursor-pointer"
                      >
                        <Upload size={13} className="text-blue-600" />
                        <span>Upload Banner / Greeting Card</span>
                      </button>

                      <span className="text-gray-400 text-xs text-center sm:text-left">or</span>

                      <input
                        type="url"
                        value={imageUrlInput}
                        onChange={(e) => {
                          setImageUrlInput(e.target.value);
                          setImageFile(null);
                        }}
                        placeholder="Paste image URL..."
                        className="flex-1 px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-xl outline-none focus:border-blue-500"
                      />
                    </div>
                  )}
                </div>

                {/* 5. TARGET AUDIENCE SELECTOR */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                      <Users size={13} className="text-blue-600" /> Target Customer Audiences
                    </label>
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                      ~{totalPhones} Phones • ~{totalEmails} Emails
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {/* Subscribers */}
                    <div
                      onClick={() => toggleAudience("subscribers")}
                      className={`p-2.5 rounded-2xl border transition cursor-pointer ${
                        targetAudiences.includes("subscribers")
                          ? "bg-blue-50/70 border-[#021C57] ring-1 ring-blue-200"
                          : "bg-gray-50 border-gray-200"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-xs font-bold text-gray-800">Subscribers</span>
                        <input
                          type="checkbox"
                          checked={targetAudiences.includes("subscribers")}
                          onChange={() => {}}
                          className="rounded text-blue-600 cursor-pointer"
                        />
                      </div>
                      <p className="text-[10px] text-gray-500 font-mono">
                        {segments.subscribers?.phoneCount || 0} phones • {segments.subscribers?.emailCount || 0} emails
                      </p>
                    </div>

                    {/* Quotation Inquirers */}
                    <div
                      onClick={() => toggleAudience("inquiries")}
                      className={`p-2.5 rounded-2xl border transition cursor-pointer ${
                        targetAudiences.includes("inquiries")
                          ? "bg-blue-50/70 border-[#021C57] ring-1 ring-blue-200"
                          : "bg-gray-50 border-gray-200"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-xs font-bold text-gray-800">Quote Inquirers</span>
                        <input
                          type="checkbox"
                          checked={targetAudiences.includes("inquiries")}
                          onChange={() => {}}
                          className="rounded text-blue-600 cursor-pointer"
                        />
                      </div>
                      <p className="text-[10px] text-gray-500 font-mono">
                        {segments.inquiries?.phoneCount || 0} phones • {segments.inquiries?.emailCount || 0} emails
                      </p>
                    </div>

                    {/* Contact Form Leads */}
                    <div
                      onClick={() => toggleAudience("contacts")}
                      className={`p-2.5 rounded-2xl border transition cursor-pointer ${
                        targetAudiences.includes("contacts")
                          ? "bg-blue-50/70 border-[#021C57] ring-1 ring-blue-200"
                          : "bg-gray-50 border-gray-200"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-xs font-bold text-gray-800">Contact Leads</span>
                        <input
                          type="checkbox"
                          checked={targetAudiences.includes("contacts")}
                          onChange={() => {}}
                          className="rounded text-blue-600 cursor-pointer"
                        />
                      </div>
                      <p className="text-[10px] text-gray-500 font-mono">
                        {segments.contacts?.phoneCount || 0} phones • {segments.contacts?.emailCount || 0} emails
                      </p>
                    </div>
                  </div>

                  {/* CUSTOM EMAILS & NUMBERS TOGGLE */}
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => setShowCustomInput((prev) => !prev)}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                    >
                      <span>{showCustomInput ? "- Hide custom recipient inputs" : "+ Add custom emails & phone numbers"}</span>
                    </button>

                    {showCustomInput && (
                      <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-gray-600">Custom Phone Numbers</label>
                          <textarea
                            rows={2}
                            value={customNumbersInput}
                            onChange={(e) => setCustomNumbersInput(e.target.value)}
                            placeholder="Paste mobile numbers separated by commas or lines (e.g. 9876543210, +919123456780)"
                            className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl outline-none font-mono"
                          />
                          <p className="text-[10px] text-gray-400">
                            {parsedCustomNumbers.length} valid phone numbers detected
                          </p>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-gray-600">Custom Email Addresses</label>
                          <textarea
                            rows={2}
                            value={customEmailsInput}
                            onChange={(e) => setCustomEmailsInput(e.target.value)}
                            placeholder="Paste email addresses separated by commas or lines (e.g. client@domain.com)"
                            className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl outline-none font-mono"
                          />
                          <p className="text-[10px] text-gray-400">
                            {parsedCustomEmails.length} valid email addresses detected
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 6. MESSAGE BODY */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-gray-700">Message Body</label>
                    <span
                      className={`text-[11px] font-mono font-semibold ${
                        charCount > 160 ? "text-amber-600" : "text-gray-500"
                      }`}
                    >
                      {charCount} chars {channels.includes("SMS") ? `(${smsCreditCount} SMS credit)` : ""}
                    </span>
                  </div>

                  <textarea
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type your greeting message, promotional announcement, or festival wishes here..."
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-gray-200 rounded-2xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                  />
                </div>

              </div>

              {/* RIGHT LIVE PREVIEW & DISPATCH (5 COLS) */}
              <div className="lg:col-span-5 bg-slate-50 p-5 rounded-3xl border border-gray-200/80 flex flex-col justify-between space-y-4">
                
                <div className="space-y-3">
                  {/* PREVIEW SWITCHER */}
                  <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                    <span className="text-xs font-bold text-gray-700">Live Recipient Preview</span>
                    
                    <div className="bg-white p-0.5 rounded-xl border border-gray-200 flex items-center text-xs font-semibold">
                      <button
                        type="button"
                        onClick={() => setPreviewMode("email")}
                        className={`px-2.5 py-1 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                          previewMode === "email"
                            ? "bg-[#021C57] text-white"
                            : "text-gray-500 hover:text-gray-900"
                        }`}
                      >
                        <Mail size={11} /> Email View
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewMode("sms")}
                        className={`px-2.5 py-1 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                          previewMode === "sms"
                            ? "bg-[#021C57] text-white"
                            : "text-gray-500 hover:text-gray-900"
                        }`}
                      >
                        <Smartphone size={11} /> SMS View
                      </button>
                    </div>
                  </div>

                  {/* 1. EMAIL PREVIEW FRAME */}
                  {previewMode === "email" && (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden text-xs max-h-[360px] overflow-y-auto">
                      {/* Email Header */}
                      <div className="bg-gradient-to-r from-[#021C57] to-[#082977] p-3 text-center text-white">
                        <h4 className="font-bold text-xs uppercase tracking-wider">ARCL INSTRUMENTS</h4>
                        <p className="text-[9px] text-blue-200">Precision Testing & Calibration Equipment</p>
                      </div>

                      {/* Banner Image Preview */}
                      {effectiveImageUrl && (
                        <div className="bg-[#021C57]">
                          <img
                            src={effectiveImageUrl}
                            alt="Email Banner Preview"
                            className="w-full h-32 object-cover"
                          />
                        </div>
                      )}

                      {/* Email Body */}
                      <div className="p-4 space-y-2.5">
                        <h5 className="font-bold text-gray-900 text-sm">
                          {title || emailSubject || "Announcement Title"}
                        </h5>

                        <p className="text-gray-700 leading-relaxed whitespace-pre-line text-xs">
                          {message.trim() || (
                            <span className="text-gray-400 italic">
                              Your broadcast message text will render here...
                            </span>
                          )}
                        </p>

                        <div className="text-center pt-2">
                          <span className="inline-block bg-[#021C57] text-white font-bold px-4 py-2 rounded-xl text-xs shadow-xs">
                            {ctaText} →
                          </span>
                        </div>
                      </div>

                      {/* Email Footer */}
                      <div className="bg-gray-50 p-2 text-center text-[10px] text-gray-400 border-t border-gray-100">
                        © {new Date().getFullYear()} ARCL Equipment. All rights reserved.
                      </div>
                    </div>
                  )}

                  {/* 2. SMS PREVIEW FRAME */}
                  {previewMode === "sms" && (
                    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200 space-y-3 min-h-[220px]">
                      <div className="flex items-center justify-between border-b border-gray-100 pb-2 text-[10px] text-gray-400">
                        <span>Messages • ARCL-IND</span>
                        <span>Now</span>
                      </div>

                      <div className="bg-blue-50/90 text-gray-800 text-xs p-3 rounded-2xl rounded-tl-xs border border-blue-100 space-y-1.5">
                        <p className="leading-relaxed whitespace-pre-line">
                          {message.trim() || (
                            <span className="text-gray-400 italic">
                              Your SMS text preview will render here...
                            </span>
                          )}
                        </p>
                        {effectiveImageUrl && (
                          <div className="text-[10px] text-blue-600 underline font-mono">
                            Banner: {effectiveImageUrl.slice(0, 32)}...
                          </div>
                        )}
                        <div className="text-[9px] text-blue-500 text-right font-mono">
                          ARCL Instruments
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="bg-emerald-50/80 p-3 rounded-xl border border-emerald-100 text-[11px] text-emerald-900 flex items-start gap-2">
                    <CheckCircle2 size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                    <span>
                      Dispatches automatically to {totalPhones} phones & {totalEmails} emails. Duplicates are automatically filtered out.
                    </span>
                  </div>
                </div>

                {/* DISPATCH ACTION BUTTON */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleSendBroadcast}
                    disabled={sending || !message.trim() || (totalPhones === 0 && totalEmails === 0)}
                    className="w-full bg-gradient-to-r from-[#021C57] to-[#0B2F7E] hover:from-[#032675] hover:to-[#0f3ea3] text-white font-bold py-3.5 px-4 rounded-2xl text-xs sm:text-sm shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {sending ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        <span>Dispatching Broadcast...</span>
                      </>
                    ) : (
                      <>
                        <Send size={15} />
                        <span>
                          Send Broadcast ({channels.join(" + ")})
                        </span>
                      </>
                    )}
                  </button>
                </div>

              </div>

            </div>
          ) : (
            /* TAB 2: SENT CAMPAIGNS LOG */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                  <History size={16} className="text-blue-600" /> Dispatched Campaign Broadcasts
                </h3>
                <span className="text-xs text-gray-400">{campaigns.length} past broadcasts</span>
              </div>

              {loadingCampaigns ? (
                <div className="py-12 text-center text-xs text-gray-400">Loading campaign logs...</div>
              ) : campaigns.length === 0 ? (
                <div className="py-12 text-center space-y-2">
                  <MessageSquare className="w-10 h-10 text-gray-300 mx-auto" />
                  <p className="text-xs font-bold text-gray-800">No broadcast campaigns sent yet</p>
                  <p className="text-[11px] text-gray-400">
                    Your dispatched SMS and Email greeting broadcasts will be recorded here.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {campaigns.map((camp) => (
                    <div
                      key={camp._id}
                      className="bg-white p-4 rounded-2xl border border-gray-100 shadow-2xs space-y-2.5 hover:border-blue-100 transition"
                    >
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <span
                            className={`p-1.5 rounded-lg text-xs font-bold ${
                              camp.channel === "MULTI_CHANNEL"
                                ? "bg-purple-50 text-purple-700"
                                : camp.channel === "EMAIL"
                                ? "bg-indigo-50 text-indigo-700"
                                : "bg-blue-50 text-blue-700"
                            }`}
                          >
                            {camp.channel === "MULTI_CHANNEL"
                              ? "SMS + Email"
                              : camp.channel}
                          </span>
                          <h4 className="text-xs font-bold text-gray-900">{camp.title}</h4>
                        </div>

                        <div className="flex items-center gap-2 text-[11px]">
                          {camp.smsSuccessCount > 0 && (
                            <span className="bg-blue-50 text-blue-700 font-semibold px-2 py-0.5 rounded-md">
                              {camp.smsSuccessCount} SMS
                            </span>
                          )}
                          {camp.emailSuccessCount > 0 && (
                            <span className="bg-indigo-50 text-indigo-700 font-semibold px-2 py-0.5 rounded-md">
                              {camp.emailSuccessCount} Emails
                            </span>
                          )}
                          <span className="text-gray-400 flex items-center gap-1">
                            <Clock size={11} /> {new Date(camp.createdAt).toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {camp.imageUrl && !camp.imageUrl.startsWith("data:") && (
                        <div className="rounded-xl overflow-hidden max-h-24 max-w-xs border border-gray-100">
                          <img
                            src={camp.imageUrl}
                            alt="Campaign Banner"
                            className="w-full h-24 object-cover"
                          />
                        </div>
                      )}

                      <p className="text-xs text-gray-700 bg-gray-50 p-2.5 rounded-xl border border-gray-100 font-mono">
                        "{camp.message}"
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default BulkSmsModal;
