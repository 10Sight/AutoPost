import { asyncHandler } from "../utils/asyncHandler.js";
import { Notification } from "../models/notification.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";

const getNotifications = asyncHandler(async (req, res) => {
    const notifications = await Notification.find({
        organizationId: req.user.organizationId,
        $or: [
            { userId: req.user._id },
            { userId: { $exists: false } },
            { userId: null }
        ]
    }).sort({ createdAt: -1 }).limit(50);

    return res
        .status(200)
        .json(new ApiResponse(200, notifications, "Notifications fetched successfully"));
});

const markAsRead = asyncHandler(async (req, res) => {
    const { notificationId } = req.params;

    const notification = await Notification.findOneAndUpdate(
        {
            _id: notificationId,
            organizationId: req.user.organizationId,
            $or: [{ userId: req.user._id }, { userId: null }]
        },
        { read: true },
        { new: true }
    );

    if (!notification) {
        throw new ApiError(404, "Notification not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, notification, "Notification marked as read"));
});

const markAllAsRead = asyncHandler(async (req, res) => {
    await Notification.updateMany(
        {
            organizationId: req.user.organizationId,
            userId: req.user._id,
            read: false
        },
        { read: true }
    );

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "All notifications marked as read"));
});

const deleteNotification = asyncHandler(async (req, res) => {
    const { notificationId } = req.params;

    const notification = await Notification.findOneAndDelete({
        _id: notificationId,
        organizationId: req.user.organizationId,
        userId: req.user._id
    });

    if (!notification) {
        throw new ApiError(404, "Notification not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Notification deleted successfully"));
});

export {
    getNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification
};
