import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { validateLimit, updateUsage } from "../services/usage.service.js";
import { MailService } from "../services/mail.service.js";

const getCurrentUser = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .json(new ApiResponse(200, req.user, "User fetched successfully"));
});

const getAllUsers = asyncHandler(async (req, res) => {
    const users = await User.find({ organizationId: req.user.organizationId }).select("-password -refreshToken");
    return res
        .status(200)
        .json(new ApiResponse(200, users, "Users fetched successfully"));
});

const createUser = asyncHandler(async (req, res) => {
    const { firstName, lastName, email, password, role } = req.body;

    if ([firstName, lastName, email, password, role].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "All fields are required");
    }

    // Usage Tracking: Validate team member limit
    await validateLimit(req.user.organizationId, 'team');

    const existedUser = await User.findOne({ email });

    if (existedUser) {
        throw new ApiError(409, "User with email already exists");
    }

    const user = await User.create({
        name: `${firstName} ${lastName}`,
        email,
        password,
        role,
        organizationId: req.user.organizationId,
    });

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user");
    }

    // Usage Tracking: Increment team member count
    await updateUsage(req.user.organizationId, 'team', 1, 'inc');

    return res
        .status(201)
        .json(new ApiResponse(200, createdUser, "User created successfully"));
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;

    const user = await User.findById(req.user?._id);
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid old password");
    }

    user.password = newPassword;
    await user.save({ validateBeforeSave: false });

    // 🚀 Security Notification
    MailService.sendSecurityAlertEmail(user.email, { type: "password" })
        .catch(err => console.error("Security notification failed", err));

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Password changed successfully"));
});

const updateAccountDetails = asyncHandler(async (req, res) => {
    const { name, email, avatar } = req.body;

    if (!name && !email && !avatar) {
        throw new ApiError(400, "Provide details to update");
    }

    const previousEmail = req.user.email;

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                name,
                email,
                avatar
            },
        },
        { new: true }
    ).select("-password");

    // 🚀 Security Notification for Email Change
    if (email && email !== previousEmail) {
        MailService.sendSecurityAlertEmail(email, { type: "email" })
            .catch(err => console.error("Security notification failed", err));
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, user, "Account details updated successfully")
        );
});

const updateUserRole = asyncHandler(async (req, res) => {
    const { userId, role } = req.body;

    if (!userId || !role) {
        throw new ApiError(400, "User ID and Role are required");
    }

    // Prevent self-demotion if necessary or check permissions
    // Note: authorizeRoles("admin") already ensures the requester is an admin

    const user = await User.findOneAndUpdate(
        { _id: userId, organizationId: req.user.organizationId },
        { $set: { role } },
        { new: true }
    ).select("-password");

    if (!user) {
        throw new ApiError(404, "User not found in your organization");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, user, "User role updated successfully"));
});

const deleteUser = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    if (!userId) {
        throw new ApiError(400, "User ID is required");
    }

    // Cannot delete yourself
    if (userId === req.user._id.toString()) {
        throw new ApiError(400, "You cannot remove yourself from the organization");
    }

    const user = await User.findOneAndDelete({
        _id: userId,
        organizationId: req.user.organizationId
    });

    if (!user) {
        throw new ApiError(404, "User not found in your organization");
    }

    // Usage Tracking: Decrement team member count
    await updateUsage(req.user.organizationId, 'team', 1, 'dec');

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "User removed successfully"));
});

export { 
    getCurrentUser, 
    getAllUsers, 
    createUser, 
    changeCurrentPassword, 
    updateAccountDetails,
    updateUserRole,
    deleteUser
};
