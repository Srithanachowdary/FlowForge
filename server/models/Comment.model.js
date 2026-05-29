import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
  {
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      required: true,
      index: true
    },
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      index: true
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    content: {
      type: String,
      required: [true, "Comment content is required"]
    },
    mentions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      }
    ],
    attachments: [
      {
        url: { type: String },
        name: { type: String }
      }
    ],
    isEdited: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

const Comment = mongoose.model("Comment", commentSchema);
export default Comment;
