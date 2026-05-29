import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { GoogleLogin } from "@react-oauth/google";
import { Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
import toast from "react-hot-toast";
import axiosInstance from "../../api/axios";

const Login = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated, fetchMe, loading } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      return toast.error("Please fill in all fields");
    }

    try {
      await login(email, password);
      toast.success("Welcome back!");
      navigate("/");
    } catch (err) {
      toast.error(err.message || "Login failed");
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const response = await axiosInstance.post("/auth/google-one-tap", {
        credential: credentialResponse.credential
      });
      const { user, accessToken } = response.data.data;
      
      localStorage.setItem("accessToken", accessToken);
      useAuthStore.setState({ user, token: accessToken, isAuthenticated: true });
      toast.success("Welcome back via Google!");
      navigate("/");
    } catch (err) {
      toast.error(err.response?.data?.message || "Google Authentication failed");
    }
  };

  return (
    <div className="min-h-screen w-screen bg-dark-bg flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-600/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 pointer-events-none" />

      {/* Main glassmorphic login card */}
      <div className="w-full max-w-md rounded-2xl glass-panel relative z-10 overflow-hidden shadow-2xl gradient-border p-8">
        
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-linear-to-tr from-brand-600 to-indigo-500 font-display font-extrabold text-white text-2xl shadow-lg mb-4 animate-float">
            Z
          </div>
          <h2 className="font-display font-bold text-3xl tracking-tight text-white mb-2">
            Welcome to <span className="gradient-text">Zive</span>
          </h2>
          <p className="text-sm text-gray-400">
            Sign in to manage workspaces, projects & sprints
          </p>
        </div>

        {/* Local Email/Password Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
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
                placeholder="you@company.com"
                className="w-full bg-dark-surface/50 border border-dark-border focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none rounded-lg py-2.5 pl-10 pr-4 text-sm text-white placeholder-gray-500 transition-all"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Password
              </label>
              <Link 
                to="/forgot-password" // Optional route link or stub
                className="text-xs text-brand-500 hover:text-brand-400 font-medium transition-colors"
                onClick={() => toast("Contact administrator or write reset route", { icon: "ℹ️" })}
              >
                Forgot Password?
              </Link>
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
                <Lock className="w-4.5 h-4.5" />
              </span>
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-dark-surface/50 border border-dark-border focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none rounded-lg py-2.5 pl-10 pr-10 text-sm text-white placeholder-gray-500 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-white"
              >
                {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-600 disabled:bg-brand-500/50 cursor-pointer disabled:cursor-not-allowed text-white font-medium rounded-lg py-3 text-sm transition-all shadow-md shadow-brand-500/20 hover:shadow-brand-500/30"
          >
            <span>{loading ? "Authenticating..." : "Sign In"}</span>
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        {/* Divider */}
        <div className="relative flex py-5 items-center">
          <div className="flex-grow border-t border-dark-border"></div>
          <span className="flex-shrink mx-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
            or continue with
          </span>
          <div className="flex-grow border-t border-dark-border"></div>
        </div>

        {/* Google OAuth button */}
        <div className="flex justify-center">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => toast.error("Google login failed")}
            theme="filled_dark"
            shape="rectangular"
            text="signin_with"
            width="100%"
          />
        </div>

        {/* Footer info */}
        <p className="text-center text-xs text-gray-400 mt-8">
          Don't have an account?{" "}
          <Link to="/register" className="text-brand-500 hover:text-brand-400 font-semibold transition-colors">
            Sign up for free
          </Link>
        </p>

      </div>
    </div>
  );
};

export default Login;
