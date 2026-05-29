import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { Mail, Lock, User, ArrowRight, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";

const Register = () => {
  const navigate = useNavigate();
  const { register, loading } = useAuthStore();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) {
      return toast.error("Please fill in all fields");
    }

    if (password.length < 6) {
      return toast.error("Password must be at least 6 characters");
    }

    try {
      await register(name, email, password);
      setIsSuccess(true);
      toast.success("Registration successful!");
    } catch (err) {
      toast.error(err.message || "Registration failed");
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen w-screen bg-dark-bg flex items-center justify-center p-4 relative overflow-hidden font-sans">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-600/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        <div className="w-full max-w-md rounded-2xl glass-panel relative z-10 overflow-hidden shadow-2xl gradient-border p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 mb-6 border border-emerald-500/25">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="font-display font-bold text-2xl text-white mb-3">Check your inbox</h2>
          <p className="text-sm text-gray-400 mb-6 leading-relaxed">
            We have sent a verification link to <span className="text-white font-medium">{email}</span>. Please click the link to verify your account.
          </p>

          <div className="bg-brand-500/10 border border-brand-500/20 rounded-lg p-4 mb-6 text-left">
            <p className="text-xs font-semibold text-brand-400 uppercase tracking-wider mb-1">Local Dev Mode Note</p>
            <p className="text-xs text-gray-400 leading-relaxed">
              If you haven't configured an SMTP provider, the email was logged directly in your **server terminal**. Copy and paste that link in your browser to complete verification.
            </p>
          </div>

          <Link
            to="/login"
            className="inline-flex items-center justify-center w-full bg-brand-500 hover:bg-brand-600 text-white font-medium rounded-lg py-2.5 text-sm transition-colors cursor-pointer"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-screen bg-dark-bg flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-600/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 pointer-events-none" />

      {/* Main glassmorphic registration card */}
      <div className="w-full max-w-md rounded-2xl glass-panel relative z-10 overflow-hidden shadow-2xl gradient-border p-8">
        
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-linear-to-tr from-brand-600 to-indigo-500 font-display font-extrabold text-white text-2xl shadow-lg mb-4 animate-float">
            Z
          </div>
          <h2 className="font-display font-bold text-3xl tracking-tight text-white mb-2">
            Create an <span className="gradient-text">Account</span>
          </h2>
          <p className="text-sm text-gray-400">
            Sign up to build isolated workspaces and projects
          </p>
        </div>

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Full Name
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
                <User className="w-4.5 h-4.5" />
              </span>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="w-full bg-dark-surface/50 border border-dark-border focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none rounded-lg py-2.5 pl-10 pr-4 text-sm text-white placeholder-gray-500 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
                <Mail className="w-4.5 h-4.5" />
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john@company.com"
                className="w-full bg-dark-surface/50 border border-dark-border focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none rounded-lg py-2.5 pl-10 pr-4 text-sm text-white placeholder-gray-500 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
                <Lock className="w-4.5 h-4.5" />
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full bg-dark-surface/50 border border-dark-border focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none rounded-lg py-2.5 pl-10 pr-4 text-sm text-white placeholder-gray-500 transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-600 disabled:bg-brand-500/50 cursor-pointer disabled:cursor-not-allowed text-white font-medium rounded-lg py-3 text-sm transition-all shadow-md shadow-brand-500/20 hover:shadow-brand-500/30"
          >
            <span>{loading ? "Creating Account..." : "Create Account"}</span>
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        {/* Footer info */}
        <p className="text-center text-xs text-gray-400 mt-8">
          Already have an account?{" "}
          <Link to="/login" className="text-brand-500 hover:text-brand-400 font-semibold transition-colors">
            Sign in instead
          </Link>
        </p>

      </div>
    </div>
  );
};

export default Register;
