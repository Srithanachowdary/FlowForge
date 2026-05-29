import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      index: true
    },
    type: {
      type: String,
      enum: ["mention", "assignment", "comment", "sprint_start", "invite"],
      required: true
    },
    message: {
      type: String,
      required: true
    },
    link: {
      type: String,
      default: ""
    },
    isRead: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false } // only need createdAt for notifications
  }
);

const Notification = mongoose.model("Notification", notificationSchema);
export default Notification;
