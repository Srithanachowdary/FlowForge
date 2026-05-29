import Notification from "../models/Notification.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";

// Get user notifications
export const getNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .populate("sender", "name avatar")
      .sort({ createdAt: -1 })
      .limit(50); // limit to latest 50 notifications

    return res.status(200).json(new ApiResponse(200, notifications, "Notifications retrieved successfully"));
  } catch (error) {
    next(error);
  }
};

// Mark single notification as read
export const markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findById(id);
    if (!notification) {
      throw new ApiError(404, "Notification not found");
    }

    if (notification.recipient.toString() !== req.user._id.toString()) {
      throw new ApiError(403, "You can only read your own notifications");
    }

    notification.isRead = true;
    await notification.save();

    return res.status(200).json(new ApiResponse(200, notification, "Notification marked as read"));
  } catch (error) {
    next(error);
  }
};

// Mark all notifications as read for current user
export const markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, isRead: false },
      { isRead: true }
    );
    return res.status(200).json(new ApiResponse(200, null, "All notifications marked as read"));
  } catch (error) {
    next(error);
  }
};
