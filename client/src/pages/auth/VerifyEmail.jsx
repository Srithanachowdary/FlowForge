import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { CheckCircle, AlertTriangle, Loader2 } from "lucide-react";

const VerifyEmail = () => {
  const { token } = useParams();
  const { verifyEmail } = useAuthStore();
  const [status, setStatus] = useState("loading"); // loading, success, error
  const [message, setMessage] = useState("");

  const calledRef = React.useRef(false);

  useEffect(() => {
    const performVerification = async () => {
      if (!token) {
        setStatus("error");
        setMessage("Invalid verification request.");
        return;
      }
      if (calledRef.current) return;
      calledRef.current = true;
      try {
        await verifyEmail(token);
        setStatus("success");
      } catch (err) {
        setStatus("error");
        setMessage(err.message || "Email verification failed. The token may be expired.");
      }
    };
    performVerification();
  }, [token, verifyEmail]);

  return (
    <div className="min-h-screen w-screen bg-dark-bg flex items-center justify-center p-4 relative overflow-hidden font-sans">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-600/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />

      <div className="w-full max-w-md rounded-2xl glass-panel relative z-10 overflow-hidden shadow-2xl gradient-border p-8 text-center">
        {status === "loading" && (
          <div className="py-6">
            <Loader2 className="w-12 h-12 text-brand-500 animate-spin mx-auto mb-4" />
            <h2 className="font-display font-bold text-xl text-white mb-2">Verifying your email</h2>
            <p className="text-sm text-gray-400">Please wait while we confirm your credentials...</p>
          </div>
        )}

        {status === "success" && (
          <div>
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 mb-6 border border-emerald-500/25">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h2 className="font-display font-bold text-2xl text-white mb-2">Verification Complete!</h2>
            <p className="text-sm text-gray-400 mb-8 leading-relaxed">
              Thank you. Your email has been verified. You can now access workspaces and create boards.
            </p>
            <Link
              to="/login"
              className="inline-flex items-center justify-center w-full bg-brand-500 hover:bg-brand-600 text-white font-medium rounded-lg py-2.5 text-sm transition-colors cursor-pointer"
            >
              Sign In to Your Workspace
            </Link>
          </div>
        )}

        {status === "error" && (
          <div>
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-rose-500/10 text-rose-500 mb-6 border border-rose-500/25">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h2 className="font-display font-bold text-2xl text-white mb-2">Verification Failed</h2>
            <p className="text-sm text-gray-400 mb-8 leading-relaxed">
              {message}
            </p>
            <Link
              to="/register"
              className="inline-flex items-center justify-center w-full bg-brand-500 hover:bg-brand-600 text-white font-medium rounded-lg py-2.5 text-sm transition-colors cursor-pointer"
            >
              Try Registering Again
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;
