import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true
    },
    passwordHash: {
      type: String,
      // null for Google OAuth users
      default: null
    },
    googleId: {
      type: String,
      default: null
    },
    avatar: {
      type: String,
      default: ""
    },
    isVerified: {
      type: Boolean,
      default: false
    },
    verifyToken: {
      type: String,
      default: null
    },
    verifyTokenExpiry: {
      type: Date,
      default: null
    },
    resetToken: {
      type: String,
      default: null
    },
    resetTokenExpiry: {
      type: Date,
      default: null
    },
    refreshToken: {
      type: String,
      default: null
    },
    activeWorkspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workspace",
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Hash password before saving if it has been modified
userSchema.pre("save", async function (next) {
  if (!this.isModified("passwordHash") || !this.passwordHash) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Instance method to check if password matches
userSchema.methods.comparePassword = async function (password) {
  if (!this.passwordHash) return false;
  return await bcrypt.compare(password, this.passwordHash);
};

const User = mongoose.model("User", userSchema);
export default User;
