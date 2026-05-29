import mongoose from "mongoose";
import slugify from "slugify";

const memberSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  role: {
    type: String,
    enum: ["admin", "manager", "developer", "viewer"],
    default: "developer"
  },
  joinedAt: {
    type: Date,
    default: Date.now
  }
});

const inviteSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true
  },
  token: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ["admin", "manager", "developer", "viewer"],
    default: "developer"
  },
  expiresAt: {
    type: Date,
    required: true
  }
});

const workspaceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Workspace name is required"],
      trim: true
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true
    },
    logo: {
      type: String,
      default: ""
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    members: [memberSchema],
    invites: [inviteSchema],
    plan: {
      type: String,
      enum: ["free", "pro", "team"],
      default: "free"
    },
    stripeCustomerId: {
      type: String,
      default: ""
    },
    stripeSubscriptionId: {
      type: String,
      default: ""
    },
    planExpiresAt: {
      type: Date,
      default: null
    },
    settings: {
      defaultRole: {
        type: String,
        enum: ["admin", "manager", "developer", "viewer"],
        default: "developer"
      },
      allowInvite: {
        type: Boolean,
        default: true
      }
    }
  },
  {
    timestamps: true
  }
);

// Pre-save hook to generate URL-safe slug from workspace name
workspaceSchema.pre("save", async function (next) {
  if (!this.isModified("name")) return next();
  
  // Make slug unique by appending random bytes
  const baseSlug = slugify(this.name, { lower: true, strict: true });
  const randomSuffix = Math.random().toString(36).substring(2, 6);
  this.slug = `${baseSlug}-${randomSuffix}`;
  next();
});

const Workspace = mongoose.model("Workspace", workspaceSchema);
export default Workspace;
