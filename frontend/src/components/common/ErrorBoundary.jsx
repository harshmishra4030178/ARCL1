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

            {this.state.error && (
              <div className="text-left space-y-2 mt-2">
                <div className="bg-slate-900 text-red-300 p-3.5 rounded-xl font-mono text-[11px] overflow-x-auto max-h-48 border border-red-900/50 shadow-inner">
                  <div className="font-bold text-red-400 mb-1">
                    {this.state.error.name || "Error"}: {this.state.error.message || String(this.state.error)}
                  </div>
                  {this.state.errorInfo?.componentStack && (
                    <div className="text-slate-400 text-[10px] mt-2 whitespace-pre-wrap border-t border-slate-800 pt-1.5">
                      Component: {this.state.errorInfo.componentStack.split("\n")[1] || "Unknown"}
                    </div>
                  )}
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      const text = `${this.state.error?.toString()}\n\nStack:\n${this.state.error?.stack || ""}\n\nComponent Stack:\n${this.state.errorInfo?.componentStack || ""}`;
                      navigator.clipboard?.writeText(text);
                      alert("Error details copied to clipboard!");
                    }}
                    className="text-[10px] text-slate-500 hover:text-slate-700 underline font-medium cursor-pointer"
                  >
                    📋 Copy Technical Error
                  </button>
                </div>
              </div>
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
