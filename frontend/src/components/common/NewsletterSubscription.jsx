import { useState } from "react";
import { subscribeApi } from "../../api/subscriberApi.js";
import { toast } from "react-toastify";
import { Mail, Bell, CheckCircle, ArrowRight } from "lucide-react";

const NewsletterSubscription = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error("Please enter your email address");
      return;
    }

    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email.trim())) {
      toast.error("Please enter a valid email address");
      return;
    }

    try {
      setLoading(true);
      const res = await subscribeApi(email.trim());
      const msg = res.data?.message || "Subscribed successfully!";
      toast.success(msg);
      setSubscribed(true);
      setEmail("");
    } catch (err) {
      console.error(err);
      toast.error(
        err.response?.data?.message || "Subscription failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="w-full py-16 px-4 md:px-10 lg:px-16 max-w-[1600px] mx-auto">
      <div className="bg-gradient-to-br from-[#021C57] via-[#052b7a] to-[#043399] rounded-3xl p-8 md:p-14 text-white shadow-2xl relative overflow-hidden border border-blue-800">
        
        {/* Subtle Decorative Elements */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-blue-400/10 blur-2xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 rounded-full bg-indigo-500/10 blur-2xl pointer-events-none"></div>

        <div className="relative z-10 max-w-4xl mx-auto text-center space-y-6">
          
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider text-blue-200 border border-white/15">
            <Bell className="w-3.5 h-3.5 text-amber-400" /> New Equipment Launch Alerts
          </div>

          {/* Heading */}
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-tight">
            Be the First to Know When New Instruments Arrive
          </h2>

          {/* Subheading */}
          <p className="text-blue-100 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            Subscribe with your email to receive official specification sheets and launch announcements for new civil, mechanical, scientific, and testing laboratory equipment.
          </p>

          {/* Form */}
          {!subscribed ? (
            <form
              onSubmit={handleSubmit}
              className="max-w-xl mx-auto flex flex-col sm:flex-row gap-3 pt-2"
            >
              <div className="relative flex-1">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  suppressHydrationWarning
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your professional email..."
                  required
                  className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:ring-4 focus:ring-blue-300/30 transition shadow-inner font-medium"
                />
              </div>

              <button
                suppressHydrationWarning
                type="submit"
                disabled={loading}
                className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-gray-950 font-bold px-8 py-4 rounded-2xl transition duration-200 shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 text-sm cursor-pointer shrink-0"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-gray-900 border-t-transparent rounded-full animate-spin"></span>
                    Subscribing...
                  </>
                ) : (
                  <>
                    Subscribe Alerts <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-300 px-6 py-3 rounded-2xl border border-emerald-400/30 text-sm font-semibold animate-fade-in">
              <CheckCircle className="w-5 h-5" />
              You are subscribed! We will notify you whenever new equipment is added.
            </div>
          )}

          <p className="text-xs text-blue-200/70 pt-2">
            🔒 We respect your privacy. No spam. Unsubscribe at any time.
          </p>

        </div>
      </div>
    </section>
  );
};

export default NewsletterSubscription;
