import React, { useEffect, useState } from "react";
import { useWorkspaceStore } from "../../store/workspaceStore";
import { useProjectStore } from "../../store/projectStore";
import { useSearchParams } from "react-router-dom";
import { 
  CreditCard, 
  CheckCircle, 
  HelpCircle, 
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Gauge
} from "lucide-react";
import toast from "react-hot-toast";
import axiosInstance from "../../api/axios";

const BillingPage = () => {
  const [searchParams] = useSearchParams();
  const { currentWorkspace, fetchWorkspaceDetail, loading } = useWorkspaceStore();
  const { projects, tasks, fetchProjects, fetchTasks } = useProjectStore();

  const [checkoutLoading, setCheckoutLoading] = useState(false);

  useEffect(() => {
    if (currentWorkspace?._id) {
      fetchWorkspaceDetail(currentWorkspace._id);
      fetchProjects(currentWorkspace._id);
      fetchTasks(currentWorkspace._id, "all"); // fetch all tasks to calculate counts
    }
  }, [currentWorkspace?._id, fetchWorkspaceDetail, fetchProjects, fetchTasks]);

  // Handle success/cancel search params on redirect
  useEffect(() => {
    if (searchParams.get("success") === "true") {
      toast.success("Upgrade successful! Thank you for subscribing.", {
        duration: 6000,
        icon: "🎉"
      });
    }
    if (searchParams.get("cancel") === "true") {
      toast.error("Checkout canceled.");
    }
  }, [searchParams]);

  // Calculate usage percentages
  const projectCount = projects?.length || 0;
  const memberCount = currentWorkspace?.members?.length || 0;
  const taskCount = tasks?.length || 0;

  const planLimitsMap = {
    free: { maxProjects: 1, maxMembers: 3, maxTasks: 15 },
    pro: { maxProjects: 5, maxMembers: 10, maxTasks: 100 },
    team: { maxProjects: Infinity, maxMembers: Infinity, maxTasks: Infinity }
  };

  const activeLimits = planLimitsMap[currentWorkspace?.plan || "free"];

  const getPercentage = (count, max) => {
    if (max === Infinity) return 0;
    return Math.min(100, Math.round((count / max) * 100));
  };

  const handleCheckout = async (plan) => {
    setCheckoutLoading(true);
    try {
      const res = await axiosInstance.post("/billing/checkout", {
        workspaceId: currentWorkspace._id,
        plan
      });
      const { url } = res.data.data;
      if (url) {
        window.location.href = url; // Redirect to Stripe checkout
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to initiate Stripe Checkout");
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handlePortalRedirect = async () => {
    setCheckoutLoading(true);
    try {
      const res = await axiosInstance.post("/billing/portal", {
        workspaceId: currentWorkspace._id
      });
      const { url } = res.data.data;
      if (url) {
        window.location.href = url; // Redirect to Stripe customer portal
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to open billing portal");
    } finally {
      setCheckoutLoading(false);
    }
  };

  const pricingPlans = [
    {
      id: "free",
      name: "Free",
      price: "$0",
      description: "Ideal for small pet-projects and single developers",
      features: [
        "Up to 1 active project",
        "Up to 3 workspace members",
        "Up to 15 active board tasks",
        "Local Kanban drag-and-drop",
        "AI subtask checklists (4/day)"
      ],
      buttonText: "Current Plan",
      disabled: true
    },
    {
      id: "pro",
      name: "Pro",
      price: "$15",
      description: "Best for growing teams and startups building SaaS",
      features: [
        "Up to 5 active projects",
        "Up to 10 workspace members",
        "Up to 100 active board tasks",
        "OpenAI GPT-4o Sprint Assistant",
        "Live Socket.io push notifications",
        "Email verification templates"
      ],
      buttonText: "Upgrade to Pro",
      disabled: currentWorkspace?.plan === "pro" || currentWorkspace?.plan === "team"
    },
    {
      id: "team",
      name: "Team",
      price: "$49",
      description: "For mature product lines needing infinite scalability",
      features: [
        "Unlimited project boards",
        "Unlimited members & viewer roles",
        "Unlimited sprint backlogs",
        "24/7 Priority support lines",
        "Advanced velocity analytics tracking"
      ],
      buttonText: "Upgrade to Team",
      disabled: currentWorkspace?.plan === "team"
    }
  ];

  return (
    <div className="space-y-8 font-sans max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-extrabold text-white">
            Billing & <span className="gradient-text">Pricing Plans</span>
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Subscribe to paid plans, evaluate resource metrics, and manage subscriptions.
          </p>
        </div>

        {currentWorkspace?.plan !== "free" && (
          <button
            onClick={handlePortalRedirect}
            disabled={checkoutLoading}
            className="flex items-center gap-2 border border-dark-border hover:border-brand-500/50 bg-dark-bg/60 text-gray-300 hover:text-white text-xs font-semibold rounded-lg px-4 py-2.5 transition-colors cursor-pointer"
          >
            <CreditCard className="w-4 h-4 text-brand-500" />
            <span>Manage Stripe Billing</span>
          </button>
        )}
      </div>

      {/* Usage meters dashboard */}
      <div className="rounded-xl bg-dark-surface border border-dark-border p-6 glass-panel">
        <h3 className="text-base font-semibold text-white mb-6 flex items-center gap-2">
          <Gauge className="w-5 h-5 text-brand-500" />
          <span>Active Plan Usage: <span className="capitalize text-indigo-400 font-bold">{currentWorkspace?.plan || "free"}</span></span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Projects Gauge */}
          <div className="space-y-2 bg-dark-bg/30 border border-dark-border p-4 rounded-lg">
            <div className="flex justify-between text-xs">
              <span className="text-gray-400 font-medium">Projects Created</span>
              <span className="text-white font-bold">
                {projectCount} / {activeLimits.maxProjects === Infinity ? "∞" : activeLimits.maxProjects}
              </span>
            </div>
            <div className="w-full bg-dark-bg h-2 rounded-full overflow-hidden border border-dark-border/60">
              <div 
                className="bg-brand-500 h-full rounded-full transition-all" 
                style={{ width: `${getPercentage(projectCount, activeLimits.maxProjects)}%` }}
              />
            </div>
          </div>

          {/* Members Gauge */}
          <div className="space-y-2 bg-dark-bg/30 border border-dark-border p-4 rounded-lg">
            <div className="flex justify-between text-xs">
              <span className="text-gray-400 font-medium">Workspace Members</span>
              <span className="text-white font-bold">
                {memberCount} / {activeLimits.maxMembers === Infinity ? "∞" : activeLimits.maxMembers}
              </span>
            </div>
            <div className="w-full bg-dark-bg h-2 rounded-full overflow-hidden border border-dark-border/60">
              <div 
                className="bg-brand-500 h-full rounded-full transition-all" 
                style={{ width: `${getPercentage(memberCount, activeLimits.maxMembers)}%` }}
              />
            </div>
          </div>

          {/* Tasks Gauge */}
          <div className="space-y-2 bg-dark-bg/30 border border-dark-border p-4 rounded-lg">
            <div className="flex justify-between text-xs">
              <span className="text-gray-400 font-medium">Board Tasks Assigned</span>
              <span className="text-white font-bold">
                {taskCount} / {activeLimits.maxTasks === Infinity ? "∞" : activeLimits.maxTasks}
              </span>
            </div>
            <div className="w-full bg-dark-bg h-2 rounded-full overflow-hidden border border-dark-border/60">
              <div 
                className="bg-brand-500 h-full rounded-full transition-all" 
                style={{ width: `${getPercentage(taskCount, activeLimits.maxTasks)}%` }}
              />
            </div>
          </div>

        </div>
      </div>

      {/* Pricing Cards Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {pricingPlans.map((plan) => {
          const isCurrentPlan = currentWorkspace?.plan === plan.id;
          
          return (
            <div 
              key={plan.id}
              className={`rounded-2xl border bg-dark-surface p-6 flex flex-col justify-between relative overflow-hidden transition-all ${isCurrentPlan ? "border-brand-500 shadow-xl shadow-brand-500/5 ring-1 ring-brand-500" : "border-dark-border hover:border-dark-border/85"}`}
            >
              {plan.id === "pro" && (
                <div className="absolute top-0 right-0 bg-brand-500 text-white font-semibold text-[10px] uppercase tracking-wider py-1 px-4 rounded-bl-lg flex items-center gap-1 shadow-md">
                  <Sparkles className="w-3 h-3" />
                  <span>Popular</span>
                </div>
              )}

              <div>
                <h3 className="font-display font-bold text-xl text-white mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-1 my-4">
                  <span className="text-3xl font-extrabold text-white">{plan.price}</span>
                  <span className="text-xs text-gray-400">/ month</span>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed mb-6">{plan.description}</p>
                
                <div className="border-t border-dark-border/80 my-5"></div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2.5 text-xs text-gray-300">
                      <CheckCircle className="w-4 h-4 text-brand-500 shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={() => handleCheckout(plan.id)}
                disabled={plan.disabled || checkoutLoading}
                className={`w-full py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all ${isCurrentPlan ? "bg-indigo-950 text-indigo-400 border border-indigo-500/20 cursor-default" : "bg-brand-500 hover:bg-brand-600 disabled:bg-gray-800 disabled:text-gray-500 disabled:border-transparent text-white"}`}
              >
                <span>{isCurrentPlan ? "Active Subscribed Tier" : plan.buttonText}</span>
                {!plan.disabled && <ArrowRight className="w-3.5 h-3.5" />}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BillingPage;
