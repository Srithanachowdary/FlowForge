import crypto from "crypto";
import Workspace from "../models/Workspace.model.js";
import User from "../models/User.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { sendEmail } from "../utils/sendEmail.js";

// 1. Get all workspaces for current user
export const getUserWorkspaces = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const workspaces = await Workspace.find({ "members.userId": userId });
    return res.status(200).json(new ApiResponse(200, workspaces, "Workspaces retrieved successfully"));
  } catch (error) {
    next(error);
  }
};

// 2. Create workspace (creator is automatically added as admin)
export const createWorkspace = async (req, res, next) => {
  try {
    const { name, logo } = req.body;
    if (!name) {
      throw new ApiError(400, "Workspace name is required");
    }

    const newWorkspace = await Workspace.create({
      name,
      logo: logo || "",
      owner: req.user._id,
      members: [
        {
          userId: req.user._id,
          role: "admin",
          joinedAt: new Date()
        }
      ],
      plan: "free"
    });

    // Automatically set as active workspace for the user
    await User.findByIdAndUpdate(req.user._id, { activeWorkspace: newWorkspace._id });

    return res
      .status(201)
      .json(new ApiResponse(201, newWorkspace, "Workspace created successfully"));
  } catch (error) {
    next(error);
  }
};

// 3. Get workspace details and populate members User profile info
export const getWorkspaceDetail = async (req, res, next) => {
  try {
    const { wid: id } = req.params;
    const workspace = await Workspace.findById(id).populate("members.userId", "name email avatar");
    if (!workspace) {
      throw new ApiError(404, "Workspace not found");
    }
    return res.status(200).json(new ApiResponse(200, workspace, "Workspace detail retrieved successfully"));
  } catch (error) {
    next(error);
  }
};

// 4. Update workspace configurations (Admin / Manager only)
export const updateWorkspace = async (req, res, next) => {
  try {
    const { wid: id } = req.params;
    const { name, logo, settings } = req.body;

    const workspace = await Workspace.findById(id);
    if (!workspace) {
      throw new ApiError(404, "Workspace not found");
    }

    if (name) workspace.name = name;
    if (logo !== undefined) workspace.logo = logo;
    if (settings) {
      workspace.settings = { ...workspace.settings, ...settings };
    }

    await workspace.save();
    return res.status(200).json(new ApiResponse(200, workspace, "Workspace details updated successfully"));
  } catch (error) {
    next(error);
  }
};

// 5. Delete workspace (Admin only)
export const deleteWorkspace = async (req, res, next) => {
  try {
    const { wid: id } = req.params;
    const workspace = await Workspace.findById(id);
    
    if (!workspace) {
      throw new ApiError(404, "Workspace not found");
    }

    // Double check owner permissions
    if (workspace.owner.toString() !== req.user._id.toString()) {
      throw new ApiError(403, "Only the workspace owner can delete it");
    }

    await Workspace.findByIdAndDelete(id);

    // Invalidate user active workspace if it matches
    await User.updateMany({ activeWorkspace: id }, { activeWorkspace: null });

    return res.status(200).json(new ApiResponse(200, null, "Workspace deleted successfully"));
  } catch (error) {
    next(error);
  }
};

// 6. Invite Member to Workspace (Admin / Manager only)
export const inviteMember = async (req, res, next) => {
  try {
    const { wid: id } = req.params;
    const { email, role } = req.body;

    if (!email) {
      throw new ApiError(400, "Email is required to invite a member");
    }

    const workspace = await Workspace.findById(id);
    if (!workspace) {
      throw new ApiError(404, "Workspace not found");
    }

    // Check if target is already a member
    const isMember = workspace.members.some(async (m) => {
      const u = await User.findById(m.userId);
      return u && u.email.toLowerCase() === email.toLowerCase();
    });

    if (isMember) {
      throw new ApiError(409, "User is already a member of this workspace");
    }

    // Check plan limits (to be verified by plan middleware as well)
    // Create random token
    const inviteToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Save invite record
    workspace.invites.push({
      email: email.toLowerCase(),
      token: inviteToken,
      role: role || "developer",
      expiresAt
    });
    await workspace.save();

    const inviteLink = `${process.env.CLIENT_URL || "http://localhost:5173"}/login?invite=${inviteToken}`;

    // Send email dispatch
    await sendEmail({
      to: email,
      subject: `Invite to join ${workspace.name} workspace on Zive`,
      html: `
        <h3>Workspace Invitation</h3>
        <p>You have been invited to join the <strong>${workspace.name}</strong> workspace as a <strong>${role || "developer"}</strong>.</p>
        <p>Click the link below to accept the invitation and sign in:</p>
        <a href="${inviteLink}">${inviteLink}</a>
        <p>This invitation expires in 7 days.</p>
      `,
      text: `Join the ${workspace.name} workspace on Zive: ${inviteLink}`
    });

    return res
      .status(200)
      .json(new ApiResponse(200, null, `Invitation successfully sent to ${email}`));
  } catch (error) {
    next(error);
  }
};

// 7. Accept Invite (Join Workspace)
export const joinWorkspace = async (req, res, next) => {
  try {
    const { token } = req.params;
    const userId = req.user._id;

    // Find workspace by checking active invites
    const workspace = await Workspace.findOne({
      "invites.token": token,
      "invites.expiresAt": { $gt: Date.now() }
    });

    if (!workspace) {
      throw new ApiError(400, "Invitation link is invalid or has expired");
    }

    const inviteIndex = workspace.invites.findIndex((i) => i.token === token);
    const invite = workspace.invites[inviteIndex];

    // Ensure the logging in user matches the invite email
    if (invite.email.toLowerCase() !== req.user.email.toLowerCase()) {
      throw new ApiError(403, `This invite was sent to ${invite.email}, but you are logged in as ${req.user.email}`);
    }

    // Remove invite record and push user to members list
    workspace.invites.splice(inviteIndex, 1);
    workspace.members.push({
      userId,
      role: invite.role,
      joinedAt: new Date()
    });

    await workspace.save();

    // Automatically set as active workspace for user
    await User.findByIdAndUpdate(userId, { activeWorkspace: workspace._id });

    return res
      .status(200)
      .json(new ApiResponse(200, workspace, "Successfully joined workspace"));
  } catch (error) {
    next(error);
  }
};

// 8. Change Member Role (Admin only)
export const changeMemberRole = async (req, res, next) => {
  try {
    const { wid: id, userId } = req.params;
    const { role } = req.body;

    if (!role) {
      throw new ApiError(400, "Role is required");
    }

    const workspace = await Workspace.findById(id);
    if (!workspace) {
      throw new ApiError(404, "Workspace not found");
    }

    // Verify user is not owner
    if (workspace.owner.toString() === userId.toString()) {
      throw new ApiError(400, "Cannot change role of the workspace Owner");
    }

    const member = workspace.members.find((m) => m.userId.toString() === userId.toString());
    if (!member) {
      throw new ApiError(404, "Member not found inside workspace");
    }

    member.role = role;
    await workspace.save();

    const populated = await Workspace.findById(id).populate("members.userId", "name email avatar");
    return res.status(200).json(new ApiResponse(200, populated.members, "Member role updated successfully"));
  } catch (error) {
    next(error);
  }
};

// 9. Remove Member (Admin / Manager only)
export const removeMember = async (req, res, next) => {
  try {
    const { wid: id, userId } = req.params;

    const workspace = await Workspace.findById(id);
    if (!workspace) {
      throw new ApiError(404, "Workspace not found");
    }

    // Cannot remove owner
    if (workspace.owner.toString() === userId.toString()) {
      throw new ApiError(400, "Cannot remove the workspace Owner");
    }

    // Validate permission levels (Manager cannot remove Admin)
    const targetMember = workspace.members.find((m) => m.userId.toString() === userId.toString());
    if (!targetMember) {
      throw new ApiError(404, "Member not found inside workspace");
    }

    if (req.memberRole === "manager" && targetMember.role === "admin") {
      throw new ApiError(403, "Managers cannot remove Administrators");
    }

    // Remove from members list
    workspace.members = workspace.members.filter((m) => m.userId.toString() !== userId.toString());
    await workspace.save();

    // Reset user's active workspace if removed
    await User.findByIdAndUpdate(userId, { activeWorkspace: null });

    const populated = await Workspace.findById(id).populate("members.userId", "name email avatar");
    return res.status(200).json(new ApiResponse(200, populated.members, "Member removed successfully"));
  } catch (error) {
    next(error);
  }
};
