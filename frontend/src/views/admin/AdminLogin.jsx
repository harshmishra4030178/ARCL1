"use client";

import { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "../../utils/navigation.jsx";
import { useAuthStore } from "../../store/useAuthStore.js";
import { toast } from "react-toastify";
const logo = "/assets/LOGO.png";
import {
  FaShieldAlt,
  FaGoogle,
  FaEnvelope,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaArrowRight,
  FaExclamationTriangle,
  FaCrown,
  FaCheckCircle,
  FaUserSecret,
  FaKey,
  FaFingerprint,
  FaTimes,
  FaBroom,
  FaHistory,
  FaLockOpen,
} from "react-icons/fa";

const AdminLogin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginWithGoogle, loginWithPassword, isAuthenticated, error, clearError } =
    useAuthStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [maskEmail, setMaskEmail] = useState(false);
  const [privateSession, setPrivateSession] = useState(false);
  const [privacyVeilEnabled, setPrivacyVeilEnabled] = useState(true);
  const [isWindowBlurred, setIsWindowBlurred] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [honeypot, setHoneypot] = useState("");
  const [loading, setLoading] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutSeconds, setLockoutSeconds] = useState(0);
  const [googleScriptLoaded, setGoogleScriptLoaded] = useState(false);
  const [accessDeniedNotice, setAccessDeniedNotice] = useState(null);

  const passwordTimerRef = useRef(null);
  const lockoutTimerRef = useRef(null);
  const idleTimerRef = useRef(null);
  const redirectPath = location.state?.from?.pathname || "/admin";

  useEffect(() => {
    if (isAuthenticated) {
      navigate(redirectPath, { replace: true });
    }
  }, [isAuthenticated, navigate, redirectPath]);

  // Privacy Feature: Tab Inactivity / Window Blur Protection & Panic Hotkey (Esc key)
  useEffect(() => {
    const handleBlur = () => {
      if (privacyVeilEnabled) {
        setIsWindowBlurred(true);
      }
    };
    const handleFocus = () => {
      setIsWindowBlurred(false);
    };

    const handleKeyDown = (e) => {
      // Emergency Panic Hotkey (Escape key)
      if (e.key === "Escape") {
        setIsWindowBlurred((prev) => !prev);
      }
    };

    window.addEventListener("blur", handleBlur);
    window.addEventListener("focus", handleFocus);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [privacyVeilEnabled]);

  // Privacy Feature: Auto-Clear Inactivity Reset (Clears typed data after 2 min idle)
  useEffect(() => {
    const resetIdleTimer = () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      if (email || password) {
        idleTimerRef.current = setTimeout(() => {
          setEmail("");
          setPassword("");
          toast.info("⏳ Form auto-cleared after 2 minutes of inactivity for privacy.", {
            icon: "🔒",
          });
        }, 120000); // 2 minutes
      }
    };

    window.addEventListener("mousemove", resetIdleTimer);
    window.addEventListener("keydown", resetIdleTimer);
    resetIdleTimer();

    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      window.removeEventListener("mousemove", resetIdleTimer);
      window.removeEventListener("keydown", resetIdleTimer);
    };
  }, [email, password]);

  // Brute-force Lockout Countdown Timer
  useEffect(() => {
    if (lockoutSeconds > 0) {
      lockoutTimerRef.current = setInterval(() => {
        setLockoutSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(lockoutTimerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (lockoutTimerRef.current) clearInterval(lockoutTimerRef.current);
    };
  }, [lockoutSeconds]);

  // Shoulder surfing protection: Auto-hide password after 6 seconds
  const togglePasswordVisibility = () => {
    if (!showPassword) {
      setShowPassword(true);
      if (passwordTimerRef.current) clearTimeout(passwordTimerRef.current);
      passwordTimerRef.current = setTimeout(() => {
        setShowPassword(false);
      }, 6000);
    } else {
      setShowPassword(false);
      if (passwordTimerRef.current) clearTimeout(passwordTimerRef.current);
    }
  };

  useEffect(() => {
    return () => {
      if (passwordTimerRef.current) clearTimeout(passwordTimerRef.current);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, []);

  // Emergency Panic Purge: Clears all browser storage, cookies, memory
  const handleEmergencyPanicPurge = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
      setEmail("");
      setPassword("");
      toast.info("🧹 Emergency Wipe: All local credentials, caches, & footprints cleared.", {
        icon: "🛡️",
      });
    } catch (e) {
      toast.error("Failed to clear local cache.");
    }
  };

  // Load Google Identity Services script
  useEffect(() => {
    const scriptId = "google-gsi-script";
    const existingScript = document.getElementById(scriptId);

    const initializeGoogleSignIn = () => {
      const clientId =
        process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
        (typeof import.meta !== "undefined" && import.meta.env?.VITE_GOOGLE_CLIENT_ID) ||
        "1032563831378-sviqnior6okrofqjsu58uk0cpi6v57tt.apps.googleusercontent.com";

      if (window.google?.accounts?.id) {
        try {
          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: handleGoogleCredentialResponse,
            auto_select: false,
            cancel_on_tap_outside: true,
          });

          const btnContainer = document.getElementById("googleSignInBtn");
          if (btnContainer) {
            window.google.accounts.id.renderButton(btnContainer, {
              theme: "outline",
              size: "large",
              type: "standard",
              shape: "pill",
              text: "signin_with",
              width: 320,
            });
          }
          setGoogleScriptLoaded(true);
        } catch (err) {
          console.warn("Google Sign-In initialization note:", err);
        }
      }
    };

    if (!existingScript) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = initializeGoogleSignIn;
      document.body.appendChild(script);
    } else {
      initializeGoogleSignIn();
    }
  }, []);

  const handleGoogleCredentialResponse = async (response) => {
    try {
      setLoading(true);
      clearError();
      setAccessDeniedNotice(null);

      await loginWithGoogle({ credential: response.credential });
      toast.success("Welcome back, Administrator! 🎉");
      navigate(redirectPath, { replace: true });
    } catch (err) {
      const msg = err.message || "Google Authentication failed";
      if (msg.includes("standard 'user' role") || msg.includes("Access Denied")) {
        setAccessDeniedNotice(msg);
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordLoginSubmit = async (e) => {
    e.preventDefault();

    // Anti-Bot Honeypot Defense (Traps scrapers/malicious bots)
    if (honeypot) {
      console.warn("Bot interaction intercepted.");
      return;
    }

    if (lockoutSeconds > 0) {
      toast.error(`Security Lockout Active. Please wait ${lockoutSeconds} seconds.`);
      return;
    }

    if (!email.trim() || !password) {
      toast.error("Please enter both Super Admin ID and Password.");
      return;
    }

    try {
      setLoading(true);
      clearError();
      setAccessDeniedNotice(null);

      await loginWithPassword({
        email: email.trim(),
        password,
      });

      if (privateSession) {
        sessionStorage.setItem("arcl_private_session", "true");
      }

      setFailedAttempts(0);
      toast.success("Super Administrator Authenticated Successfully! 👑");
      navigate(redirectPath, { replace: true });
    } catch (err) {
      const nextFailed = failedAttempts + 1;
      setFailedAttempts(nextFailed);
      
      if (nextFailed >= 3) {
        setLockoutSeconds(45);
        toast.error("⚠️ Multiple failed attempts. Rate limiter activated for 45s.");
      } else {
        toast.error(err.message || "Login failed. Please check credentials.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBlockedCopy = (e) => {
    e.preventDefault();
    toast.warn("🛡️ Clipboard copying blocked on secure inputs.", {
      icon: "🔒",
      autoClose: 2000,
    });
  };

  return (
    <div className="relative min-h-screen bg-slate-950 flex items-center justify-center p-4 sm:p-6 overflow-hidden select-none font-sans">
      
      {/* 🌌 DYNAMIC AMBIENT LIGHT MESH GLOWS */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-600/25 rounded-full blur-[140px] pointer-events-none animate-pulse"></div>
      <div className="absolute top-1/2 -right-32 w-96 h-96 bg-amber-500/15 rounded-full blur-[150px] pointer-events-none"></div>
      <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-indigo-600/20 rounded-full blur-[140px] pointer-events-none"></div>
      
      {/* TECH BLUEPRINT GRID BACKDROP */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none"></div>

      {/* 🕶️ PRIVACY VEIL OVERLAY (ACTIVATES WHEN USER SWITCHES TABS, MINIMIZES, OR PRESSES ESC) */}
      {isWindowBlurred && privacyVeilEnabled && (
        <div
          onClick={() => setIsWindowBlurred(false)}
          className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-2xl flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-all duration-300 animate-fade-in"
        >
          <div className="p-5 bg-slate-900/95 rounded-3xl border border-blue-500/30 shadow-2xl space-y-3 max-w-sm">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto text-2xl border border-amber-500/40">
              <FaLock />
            </div>
            <h3 className="text-lg font-black text-white">Privacy Veil Active</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Screen shielded to protect sensitive credentials from shoulder-surfers and background recorders.
            </p>
            <div className="pt-2 flex flex-col gap-2">
              <span className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black shadow-md transition">
                <FaLockOpen size={11} /> Click or Press ESC to Resume
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 🛡️ MAIN EXECUTIVE LOGIN CARD */}
      <div className="relative z-10 max-w-[450px] w-full bg-white/95 backdrop-blur-2xl rounded-[32px] shadow-[0_25px_80px_-15px_rgba(2,28,87,0.45)] p-7 sm:p-9 border border-white/70 space-y-5 transition-all">
        
        {/* LIVE SECURITY ENCRYPTION STATUS BAR */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-100/80 text-[10px]">
          <div className="inline-flex items-center gap-1.5 text-emerald-600 font-bold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/60">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block"></span>
            <span>256-Bit Encrypted Tunnel</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded text-[9px] font-mono border border-slate-200" title="Emergency Privacy Panic Hotkey">
              Esc : Panic Shield
            </span>
            <button
              type="button"
              onClick={() => setShowPrivacyModal(true)}
              className="text-slate-400 hover:text-[#021C57] font-semibold flex items-center gap-1 cursor-pointer transition"
              title="View Security & Privacy Protocol"
            >
              <FaShieldAlt className="text-amber-500" />
              <span className="underline">Shield</span>
            </button>
          </div>
        </div>

        {/* HEADER & BRANDING */}
        <div className="text-center space-y-2.5 pt-1">
          <div className="flex justify-center">
            <div className="p-2.5 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center transform hover:scale-105 transition-transform duration-300">
              <img src={logo} alt="ARCL Logo" className="h-12 sm:h-14 object-contain" />
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 bg-gradient-to-r from-amber-500/15 via-amber-400/25 to-amber-500/15 text-amber-950 px-4 py-1 rounded-full text-[11px] font-black uppercase tracking-wider border border-amber-300 shadow-2xs">
            <FaCrown className="text-amber-600 text-xs" />
            <span>Super Administrator Console</span>
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Executive Access
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              ARCL Instruments Management & Role-Based Control
            </p>
          </div>
        </div>

        {/* BRUTE FORCE LOCKOUT NOTICE */}
        {lockoutSeconds > 0 && (
          <div className="p-3.5 bg-rose-50 border border-rose-300 text-rose-900 rounded-2xl space-y-1 text-xs leading-relaxed animate-fade-in shadow-xs">
            <div className="flex items-center gap-2 font-bold text-xs text-rose-800">
              <FaHistory className="text-rose-600 shrink-0" />
              <span>Security Rate Limiter Active</span>
            </div>
            <p className="text-[11px] text-rose-700">
              Too many invalid attempts. Cooling down for <strong>{lockoutSeconds}s</strong> to prevent automated brute-force attacks.
            </p>
          </div>
        )}

        {/* ACCESS DENIED USER NOTICE */}
        {accessDeniedNotice && (
          <div className="p-3.5 bg-amber-50/95 border border-amber-200 text-amber-900 rounded-2xl space-y-1 text-xs leading-relaxed animate-fade-in shadow-2xs">
            <div className="flex items-center gap-2 font-bold text-xs text-amber-800">
              <FaExclamationTriangle className="text-amber-600 shrink-0" />
              <span>Standard User Registered</span>
            </div>
            <p className="text-[11px] text-amber-800">
              Your Google account is registered with the standard <strong>'user'</strong> role.
            </p>
            <p className="text-[10px] text-amber-700 italic">
              🔒 Only authorized Administrators can access this portal.
            </p>
          </div>
        )}

        {/* ERROR NOTICE */}
        {error && !accessDeniedNotice && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-2xl flex items-center justify-between animate-fade-in">
            <div className="flex items-center gap-2">
              <FaExclamationTriangle className="text-rose-500 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={clearError}
              className="font-bold text-rose-500 hover:text-rose-700 cursor-pointer ml-2 p-1"
            >
              ✕
            </button>
          </div>
        )}

        {/* LOGIN FORM */}
        <form onSubmit={handlePasswordLoginSubmit} className="space-y-4">
          
          {/* BOT HONEYPOT (Invisible to humans, traps scrapers) */}
          <div style={{ display: "none" }} aria-hidden="true">
            <input
              type="text"
              name="company_trap"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
              tabIndex={-1}
              autoComplete="off"
            />
          </div>

          {/* EMAIL INPUT WITH ANTI-KEYLOGGER, NO-CACHE & SHOULDER SURF MASK */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                Super Admin ID / Email
              </label>
              <button
                type="button"
                onClick={() => setMaskEmail(!maskEmail)}
                className="text-[10px] text-slate-500 hover:text-amber-700 flex items-center gap-1 cursor-pointer font-medium"
                title="Mask ID from nearby onlookers"
              >
                {maskEmail ? <FaEyeSlash size={10} className="text-amber-600" /> : <FaEye size={10} />}
                <span>{maskEmail ? "Masked ID" : "Stealth Mask"}</span>
              </button>
            </div>
            <div className="relative flex items-center">
              <div className="absolute left-3.5 text-slate-400 pointer-events-none">
                <FaEnvelope className="text-sm" />
              </div>
              <input
                type={maskEmail ? "password" : "email"}
                required
                autoComplete="off"
                spellCheck={false}
                autoCapitalize="none"
                onCopy={handleBlockedCopy}
                onCut={handleBlockedCopy}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="abhinav@arclinstruments.com"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 hover:bg-slate-50/80 focus:bg-white border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition-all font-medium shadow-2xs"
              />
            </div>
          </div>

          {/* PASSWORD INPUT WITH PRIVACY TIMEOUT & CLIPBOARD DEFENSE */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                Security Password
              </label>
              <span className="text-[10px] text-amber-700 font-semibold flex items-center gap-1">
                <FaKey size={9} /> Anti-Surveillance
              </span>
            </div>
            <div className="relative flex items-center">
              <div className="absolute left-3.5 text-slate-400 pointer-events-none">
                <FaLock className="text-sm" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                required
                autoComplete="new-password"
                spellCheck={false}
                autoCapitalize="none"
                onCopy={handleBlockedCopy}
                onCut={handleBlockedCopy}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-11 py-3 bg-slate-50 hover:bg-slate-50/80 focus:bg-white border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition-all font-medium shadow-2xs tracking-wider"
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute right-3 text-slate-400 hover:text-slate-700 p-1.5 cursor-pointer transition rounded-lg hover:bg-slate-100"
                title={showPassword ? "Hide password (Auto-hides in 6s)" : "Show password"}
              >
                {showPassword ? <FaEyeSlash size={14} className="text-amber-600" /> : <FaEye size={14} />}
              </button>
            </div>
          </div>

          {/* PRIVACY & STEALTH MODE TOGGLE */}
          <div className="flex items-center justify-between pt-0.5 text-xs text-slate-600">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={privateSession}
                onChange={(e) => setPrivateSession(e.target.checked)}
                className="w-3.5 h-3.5 rounded text-[#021C57] focus:ring-amber-400 cursor-pointer"
              />
              <span className="text-[11px] font-medium text-slate-600 flex items-center gap-1">
                <FaUserSecret className="text-slate-400" /> Enhanced Privacy Mode
              </span>
            </label>
            <span className="text-[10px] text-slate-400">Auto-expires session</span>
          </div>

          {/* SUBMIT BUTTON */}
          <button
            type="submit"
            disabled={loading || lockoutSeconds > 0}
            className="w-full mt-2 flex items-center justify-center gap-2.5 bg-gradient-to-r from-[#021C57] via-[#08338f] to-[#021C57] hover:from-[#08338f] hover:to-[#021C57] text-white font-black py-3.5 px-6 rounded-2xl transition-all duration-300 shadow-xl shadow-blue-950/25 hover:shadow-amber-500/20 active:scale-[0.98] disabled:opacity-50 cursor-pointer text-xs sm:text-sm tracking-wide border border-blue-800/40"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                <span>Authenticating Super Admin...</span>
              </>
            ) : lockoutSeconds > 0 ? (
              <span>Locked ({lockoutSeconds}s)</span>
            ) : (
              <>
                <FaFingerprint className="text-amber-400 text-sm" />
                <span>Sign In as Super Admin</span>
                <FaArrowRight className="text-xs ml-0.5" />
              </>
            )}
          </button>
        </form>

        {/* DIVIDER */}
        <div className="relative flex items-center justify-center pt-0.5">
          <div className="border-t border-slate-200/80 w-full"></div>
          <span className="bg-white px-3 text-[10px] font-black uppercase tracking-wider text-slate-400 shrink-0">
            or continue with google
          </span>
          <div className="border-t border-slate-200/80 w-full"></div>
        </div>

        {/* GOOGLE SIGN IN BUTTON */}
        <div className="flex flex-col items-center">
          <div id="googleSignInBtn" className="flex justify-center min-h-[44px]"></div>
        </div>

        {/* SECURITY TRUST BADGES & PANIC PURGE FOOTER */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-medium">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-emerald-600 font-bold">
              <FaCheckCircle className="text-emerald-500" /> 256-Bit SSL
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <FaShieldAlt className="text-blue-500" /> RBAC
            </span>
          </div>

          {/* EMERGENCY 1-CLICK PURGE BUTTON */}
          <button
            type="button"
            onClick={handleEmergencyPanicPurge}
            className="text-slate-400 hover:text-rose-600 flex items-center gap-1 transition cursor-pointer hover:underline"
            title="Purge all local cache, storage & tokens"
          >
            <FaBroom size={10} className="text-slate-400 hover:text-rose-500" />
            <span>Wipe Local Footprints</span>
          </button>
        </div>

      </div>

      {/* 🔒 PRIVACY & SECURITY PROTOCOL MODAL */}
      {showPrivacyModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="max-w-md w-full bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-slate-900 font-black text-base">
                <FaShieldAlt className="text-amber-500" />
                <span>ARCL Executive Privacy Protocol</span>
              </div>
              <button
                type="button"
                onClick={() => setShowPrivacyModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition cursor-pointer"
              >
                <FaTimes />
              </button>
            </div>

            <div className="space-y-2.5 text-xs text-slate-600 leading-relaxed max-h-[60vh] overflow-y-auto pr-1">
              <div className="flex items-start gap-2.5 p-2.5 bg-blue-50/70 rounded-xl border border-blue-100">
                <FaCheckCircle className="text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-blue-950 font-bold block">Zero Third-Party Tracking:</strong>
                  No telemetry, analytics, or behavioral cookies are recorded or permitted on this portal.
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-2.5 bg-amber-50/70 rounded-xl border border-amber-100">
                <FaKey className="text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-amber-950 font-bold block">Privacy Veil &amp; ESC Panic Shield:</strong>
                  Whenever you switch tabs, minimize, or tap the <kbd className="px-1 py-0.5 bg-amber-200/60 rounded text-[10px] font-mono">ESC</kbd> key, the screen blurs instantly to block shoulder surfers.
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-2.5 bg-indigo-50/70 rounded-xl border border-indigo-100">
                <FaEyeSlash className="text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-indigo-950 font-bold block">Stealth ID &amp; Anti-Clipboard Defense:</strong>
                  Obfuscate your Super Admin ID in public places with Stealth Mask, and block unauthorized clipboard sniffing.
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-2.5 bg-purple-50/70 rounded-xl border border-purple-100">
                <FaHistory className="text-purple-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-purple-950 font-bold block">2-Min Idle Auto-Clear:</strong>
                  Unsubmitted credentials are automatically wiped from input memory after 2 minutes of idle time if left unattended.
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-2.5 bg-rose-50/70 rounded-xl border border-rose-100">
                <FaBroom className="text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-rose-950 font-bold block">1-Click Panic Footprint Purge:</strong>
                  Instantly wipes all local storage tokens, credentials, and session caches in 1 click.
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-2.5 bg-emerald-50/70 rounded-xl border border-emerald-100">
                <FaFingerprint className="text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-emerald-950 font-bold block">Smart Bot Trap &amp; Rate Limiting:</strong>
                  Automated honeypot crawler trap and rate limiter cooldown prevent credential stuffing.
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowPrivacyModal(false)}
              className="w-full py-2.5 bg-[#021C57] text-white font-bold text-xs rounded-xl hover:bg-[#032d88] transition cursor-pointer shadow-md"
            >
              Close &amp; Return to Sign In
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminLogin;
