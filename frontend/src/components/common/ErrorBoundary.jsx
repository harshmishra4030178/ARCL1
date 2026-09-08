"use client";

import React from "react";
import { reportClientError } from "../../utils/clientErrorLogger.js";
import { AlertOctagon, RefreshCw, Home } from "lucide-react";

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error("ErrorBoundary caught an exception:", error, errorInfo);

    try {
      reportClientError({
        message: `React Component Crash: ${error?.message || "Unknown Component Error"}`,
        stack: error?.stack || errorInfo?.componentStack || "",
        source: "react_boundary",
        severity: "critical",
        metadata: {
          componentStack: String(errorInfo?.componentStack || "").slice(0, 2000),
          type: "react_lifecycle_error",
        },
      });
    } catch (e) {
      // Ignored
    }
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center bg-slate-50">
          <div className="max-w-md bg-white p-8 rounded-3xl shadow-xl border border-red-100 space-y-4">
            <div className="w-14 h-14 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
              <AlertOctagon size={28} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Something Went Wrong</h2>
              <p className="text-xs text-slate-500 mt-1">
                An unexpected interface error occurred. Our automated monitoring system has logged this incident.
              </p>
            </div>

            {process.env.NODE_ENV === "development" && this.state.error && (
              <pre className="text-left text-[11px] font-mono bg-slate-900 text-red-300 p-3 rounded-xl overflow-x-auto max-h-32">
                {this.state.error.toString()}
              </pre>
            )}

            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={this.handleReload}
                className="inline-flex items-center gap-1.5 bg-[#021C57] hover:bg-[#043399] text-white text-xs font-bold px-4 py-2.5 rounded-xl transition shadow-sm cursor-pointer active:scale-95"
              >
                <RefreshCw size={14} /> Reload Page
              </button>
              <button
                onClick={this.handleGoHome}
                className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold px-4 py-2.5 rounded-xl transition cursor-pointer active:scale-95"
              >
                <Home size={14} /> Back to Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
