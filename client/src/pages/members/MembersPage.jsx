import React, { useState, useEffect } from "react";
import { useWorkspaceStore } from "../../store/workspaceStore";
import { useAuthStore } from "../../store/authStore";
import { 
  UserPlus, 
  Trash2, 
  ShieldAlert, 
  Check, 
  User,
  ShieldCheck,
  Mail,
  Loader2
} from "lucide-react";
import toast from "react-hot-toast";

const MembersPage = () => {
  const { user } = useAuthStore();
  const { 
    currentWorkspace, 
    fetchWorkspaceDetail, 
    inviteMember, 
    changeMemberRole, 
    removeMember,
    loading 
  } = useWorkspaceStore();

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("developer");
  const [isSendingInvite, setIsSendingInvite] = useState(false);

  useEffect(() => {
    if (currentWorkspace?._id) {
      fetchWorkspaceDetail(currentWorkspace._id);
    }
  }, [currentWorkspace?._id, fetchWorkspaceDetail]);

  // Determine current user's role in this workspace
  const currentUserRole = currentWorkspace?.members?.find(
    (m) => m.userId?._id === user?._id || m.userId === user?._id
  )?.role || "viewer";

  const isUserAdmin = currentUserRole === "admin";
  const isUserAdminOrManager = currentUserRole === "admin" || currentUserRole === "manager";

  const handleSendInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) {
      return toast.error("Please enter email address");
    }
    
    setIsSendingInvite(true);
    try {
      await inviteMember(currentWorkspace._id, inviteEmail.trim(), inviteRole);
      toast.success(`Invite sent successfully to ${inviteEmail}`);
      setInviteEmail("");
    } catch (err) {
      toast.error(err.message || "Failed to send invitation");
    } finally {
      setIsSendingInvite(false);
    }
  };

  const handleRoleChange = async (targetUserId, nextRole) => {
    try {
      await changeMemberRole(currentWorkspace._id, targetUserId, nextRole);
      toast.success("Member role updated");
    } catch (err) {
      toast.error(err.message || "Failed to update role");
    }
  };

  const handleRemoveMember = async (targetUserId) => {
    if (window.confirm("Are you sure you want to remove this member from the workspace?")) {
      try {
        await removeMember(currentWorkspace._id, targetUserId);
        toast.success("Member removed");
      } catch (err) {
        toast.error(err.message || "Failed to remove member");
      }
    }
  };

  return (
    <div className="space-y-8 font-sans max-w-5xl mx-auto">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-display font-extrabold text-white">
          Workspace <span className="gradient-text">Members</span>
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          Manage roles, invite new teammates, and view workspace authorization levels.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left pane: Invite Member (Visible to Admins and Managers) */}
        {isUserAdminOrManager ? (
          <div className="rounded-xl bg-dark-surface border border-dark-border p-6 h-fit glass-panel">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-brand-500" />
              <span>Invite Member</span>
            </h3>

            <form onSubmit={handleSendInvite} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="teammate@company.com"
                    className="w-full bg-dark-bg/60 border border-dark-border focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none rounded-lg py-2 pl-9 pr-4 text-sm text-white placeholder-gray-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Workspace Role
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full bg-dark-bg/60 border border-dark-border focus:border-brand-500 outline-none rounded-lg py-2 px-3 text-sm text-white transition-all"
                >
                  <option value="developer">Developer (Write tasks)</option>
                  <option value="manager">Manager (Manage projects)</option>
                  <option value="viewer">Viewer (Read-only)</option>
                  {isUserAdmin && <option value="admin">Administrator (Full Access)</option>}
                </select>
              </div>

              <button
                type="submit"
                disabled={isSendingInvite}
                className="w-full flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-600 disabled:bg-brand-500/50 cursor-pointer disabled:cursor-not-allowed text-white font-medium rounded-lg py-2.5 text-sm transition-colors mt-6"
              >
                {isSendingInvite ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Inviting...</span>
                  </>
                ) : (
                  <span>Send Invitation</span>
                )}
              </button>
            </form>
          </div>
        ) : (
          <div className="rounded-xl bg-dark-surface border border-dark-border p-6 h-fit text-center glass-panel">
            <ShieldAlert className="w-8 h-8 text-gray-500 mx-auto mb-2" />
            <h4 className="text-sm font-semibold text-white">Invite Restricted</h4>
            <p className="text-xs text-gray-400 mt-1">
              Only Administrators and Managers can invite users to this workspace.
            </p>
          </div>
        )}

        {/* Right pane: Active Members List */}
        <div className="lg:col-span-2 rounded-xl bg-dark-surface border border-dark-border overflow-hidden glass-panel">
          <div className="px-6 py-4 border-b border-dark-border bg-dark-bg/20">
            <h3 className="text-lg font-semibold text-white">Active Members</h3>
          </div>

          <div className="divide-y divide-dark-border">
            {currentWorkspace?.members?.map((member) => {
              const mUser = member.userId;
              if (!mUser) return null;
              
              const isSelf = mUser._id === user?._id;

              return (
                <div key={mUser._id} className="flex items-center justify-between p-4 hover:bg-dark-hover/40 transition-colors">
                  
                  {/* User Profile avatar + info */}
                  <div className="flex items-center gap-3 overflow-hidden">
                    {mUser.avatar ? (
                      <img 
                        src={mUser.avatar} 
                        alt={mUser.name} 
                        className="w-10 h-10 rounded-full border border-dark-border"
                      />
                    ) : (
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-brand-500/10 text-brand-500 font-bold border border-brand-500/20">
                        {mUser.name.substring(0, 1).toUpperCase()}
                      </div>
                    )}
                    <div className="overflow-hidden">
                      <p className="text-sm font-semibold text-white truncate flex items-center gap-1.5">
                        <span>{mUser.name}</span>
                        {isSelf && (
                          <span className="text-[9px] bg-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded-full font-bold uppercase">
                            You
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-gray-400 truncate">{mUser.email}</p>
                    </div>
                  </div>

                  {/* Actions / Role dropdown */}
                  <div className="flex items-center gap-4">
                    {isUserAdmin && !isSelf && currentWorkspace?.owner !== mUser._id ? (
                      <select
                        value={member.role}
                        onChange={(e) => handleRoleChange(mUser._id, e.target.value)}
                        className="bg-dark-bg/60 border border-dark-border focus:border-brand-500 outline-none rounded-lg py-1 px-2.5 text-xs text-white transition-all"
                      >
                        <option value="admin">Admin</option>
                        <option value="manager">Manager</option>
                        <option value="developer">Developer</option>
                        <option value="viewer">Viewer</option>
                      </select>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-gray-300 font-medium capitalize bg-dark-bg/60 border border-dark-border px-2.5 py-1 rounded-lg">
                        {member.role === "admin" ? (
                          <ShieldCheck className="w-3.5 h-3.5 text-brand-500" />
                        ) : (
                          <User className="w-3.5 h-3.5 text-gray-400" />
                        )}
                        <span>{member.role}</span>
                      </span>
                    )}

                    {/* Delete member (Visible to Admins, or Managers for developer/viewers) */}
                    {isUserAdminOrManager && !isSelf && currentWorkspace?.owner !== mUser._id && (
                      <button
                        onClick={() => handleRemoveMember(mUser._id)}
                        disabled={currentUserRole === "manager" && member.role === "admin"}
                        className="p-1.5 rounded-lg text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                        title="Remove member"
                      >
                        <Trash2 className="w-4.5 h-4.5" />
                      </button>
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
};

export default MembersPage;
