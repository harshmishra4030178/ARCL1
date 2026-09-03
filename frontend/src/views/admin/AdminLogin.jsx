"use client";

import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "../../utils/navigation.jsx";
import { useAuthStore } from "../../store/useAuthStore.js";
import { toast } from "react-toastify";
const logo = "/assets/LOGO.png";
import {
  FaShieldAlt,
  FaGoogle,
  FaUserTie,
  FaInfoCircle,
  FaExclamationTriangle,
} from "react-icons/fa";

const AdminLogin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginWithGoogle, isAuthenticated, error, clearError } = useAuthStore();

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

  // Quick Developer / Primary Admin Access
  const handleQuickAdminLogin = async () => {
    try {
      setLoading(true);
      clearError();
      setAccessDeniedNotice(null);

      await loginWithGoogle({
        email: "admin@arcl.com",
        name: "ARCL Administrator",
        picture: "",
        googleId: "local-admin-dev",
      });
      toast.success("Logged in as ARCL Administrator");
      navigate(redirectPath, { replace: true });
    } catch (err) {
      toast.error(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-[#021C57] via-[#052b7a] to-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 md:p-10 border border-gray-100 space-y-6">
        
        {/* LOGO & TITLE */}
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <img src={logo} alt="ARCL Logo" className="h-16 object-contain" />
          </div>
          
          <div className="inline-flex items-center gap-2 bg-blue-50 text-[#021C57] px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider mb-2 border border-blue-100">
            <FaShieldAlt className="text-blue-600" /> Protected Admin Portal
          </div>
          
          <h1 className="text-2xl font-bold text-gray-800">
            Sign In to Dashboard
          </h1>
          <p className="text-gray-500 text-xs sm:text-sm mt-1">
            ARCL Instruments Management & Executive Portal
          </p>
        </div>

        {/* ACCESS DENIED USER NOTICE (WHEN A REGULAR USER LOGS IN) */}
        {accessDeniedNotice && (
          <div className="p-4 bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl space-y-2 text-xs leading-relaxed animate-fade-in">
            <div className="flex items-center gap-2 font-bold text-sm text-amber-800">
              <FaExclamationTriangle className="text-amber-600 shrink-0" />
              <span>Standard User Registered</span>
            </div>
            <p>
              Your Google account is now registered in our database with the standard <strong>'user'</strong> role.
            </p>
            <p className="text-[11px] text-amber-700">
              🔒 <em>Only users promoted to <strong>'admin'</strong> role by the system administrator can access the Admin Dashboard.</em>
            </p>
          </div>
        )}

        {error && !accessDeniedNotice && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-2xl flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={clearError}
              className="font-bold text-red-500 hover:text-red-700 cursor-pointer ml-2"
            >
              ✕
            </button>
          </div>
        )}

        {/* GOOGLE SIGN IN BUTTON CONTAINER */}
        <div className="space-y-4 flex flex-col items-center">
          <div id="googleSignInBtn" className="flex justify-center min-h-[44px]"></div>

          {/* Quick Admin Access Button */}
          <div className="w-full pt-4 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-400 mb-3">Quick Developer / Setup Access</p>
            <button
              onClick={handleQuickAdminLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 bg-[#021C57] hover:bg-[#03308f] text-white font-medium py-3.5 px-6 rounded-2xl transition duration-200 shadow-md disabled:opacity-50 cursor-pointer text-sm"
            >
              <FaUserTie className="text-base" />
              {loading ? "Authenticating..." : "Continue as Admin (admin@arcl.com)"}
            </button>
          </div>
        </div>

        {/* SECURITY FOOTER */}
        <div className="pt-4 border-t border-gray-100 text-center text-xs text-gray-400">
          <p>Protected by ARCL Enterprise Role-Based Access Control (RBAC).</p>
        </div>

      </div>
    </div>
  );
};

export default AdminLogin;
