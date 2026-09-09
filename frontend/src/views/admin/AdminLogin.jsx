"use client";

import { useEffect, useState } from "react";
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
} from "react-icons/fa";

const AdminLogin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginWithGoogle, loginWithPassword, isAuthenticated, error, clearError } =
    useAuthStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleScriptLoaded, setGoogleScriptLoaded] = useState(false);
  const [accessDeniedNotice, setAccessDeniedNotice] = useState(null);

  const redirectPath = location.state?.from?.pathname || "/admin";

  useEffect(() => {
    if (isAuthenticated) {
      navigate(redirectPath, { replace: true });
    }
  }, [isAuthenticated, navigate, redirectPath]);

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

      toast.success("Welcome back, Super Administrator! 👑");
      navigate(redirectPath, { replace: true });
    } catch (err) {
      toast.error(err.message || "Login failed. Please check credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-[#021C57] via-[#052b7a] to-gray-900 flex items-center justify-center p-4 py-8">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-6 sm:p-9 border border-gray-100 space-y-6">
        
        {/* LOGO & TITLE */}
        <div className="text-center">
          <div className="flex justify-center mb-3">
            <img src={logo} alt="ARCL Logo" className="h-14 sm:h-16 object-contain" />
          </div>
          
          <div className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-900 px-3.5 py-1 rounded-full text-[11px] sm:text-xs font-bold uppercase tracking-wider mb-2 border border-amber-200">
            <FaCrown className="text-amber-600" /> Super Admin Portal
          </div>
          
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
            Sign In to Dashboard
          </h1>
          <p className="text-gray-500 text-xs mt-1">
            ARCL Instruments Management & Executive Portal
          </p>
        </div>

        {/* ACCESS DENIED NOTICE */}
        {accessDeniedNotice && (
          <div className="p-4 bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl space-y-2 text-xs leading-relaxed animate-fade-in">
            <div className="flex items-center gap-2 font-bold text-sm text-amber-800">
              <FaExclamationTriangle className="text-amber-600 shrink-0" />
              <span>Standard User Registered</span>
            </div>
            <p>
              Your Google account is registered with the standard <strong>'user'</strong> role.
            </p>
            <p className="text-[11px] text-amber-700">
              🔒 <em>Only users with <strong>'admin'</strong> or <strong>'superadmin'</strong> access can enter this portal.</em>
            </p>
          </div>
        )}

        {/* ERROR NOTICE */}
        {error && !accessDeniedNotice && (
          <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-2xl flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={clearError}
              className="font-bold text-red-500 hover:text-red-700 cursor-pointer ml-2"
            >
              ✕
            </button>
          </div>
        )}

        {/* SUPER ADMIN ID & PASSWORD LOGIN FORM */}
        <form onSubmit={handlePasswordLoginSubmit} className="space-y-4">
          {/* EMAIL / ID INPUT */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Super Admin ID / Email
            </label>
            <div className="relative flex items-center">
              <div className="absolute left-3.5 text-gray-400 pointer-events-none">
                <FaEnvelope className="text-sm" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="abhinav@arclinstruments.com"
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-xs sm:text-sm text-gray-900 placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#021C57] focus:border-transparent transition"
              />
            </div>
          </div>

          {/* PASSWORD INPUT */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative flex items-center">
              <div className="absolute left-3.5 text-gray-400 pointer-events-none">
                <FaLock className="text-sm" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full pl-10 pr-11 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-xs sm:text-sm text-gray-900 placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#021C57] focus:border-transparent transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 text-gray-400 hover:text-gray-600 p-1 cursor-pointer transition"
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          {/* SUBMIT BUTTON */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 flex items-center justify-center gap-2 bg-[#021C57] hover:bg-[#032d88] text-white font-bold py-3.5 px-6 rounded-2xl transition duration-200 shadow-lg shadow-blue-900/20 active:scale-[0.99] disabled:opacity-50 cursor-pointer text-xs sm:text-sm"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                <span>Authenticating...</span>
              </>
            ) : (
              <>
                <span>Sign In as Super Admin</span>
                <FaArrowRight className="text-xs" />
              </>
            )}
          </button>
        </form>

        {/* DIVIDER */}
        <div className="relative flex items-center justify-center">
          <div className="border-t border-gray-200 w-full"></div>
          <span className="bg-white px-3 text-[11px] font-bold uppercase tracking-wider text-gray-400 shrink-0">
            or sign in with Google
          </span>
          <div className="border-t border-gray-200 w-full"></div>
        </div>

        {/* GOOGLE SIGN IN BUTTON */}
        <div className="flex flex-col items-center">
          <div id="googleSignInBtn" className="flex justify-center min-h-[44px]"></div>
        </div>

        {/* SECURITY FOOTER */}
        <div className="pt-4 border-t border-gray-100 text-center text-[11px] text-gray-400">
          <p>Protected by ARCL Enterprise Role-Based Access Control (RBAC).</p>
        </div>

      </div>
    </div>
  );
};

export default AdminLogin;
