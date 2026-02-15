import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { validateLimit, updateUsage } from "../services/usage.service.js";

const getCurrentUser = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .json(new ApiResponse(200, req.user, "User fetched successfully"));
});

const getAllUsers = asyncHandler(async (req, res) => {
    const users = await User.find({}).select("-password -refreshToken");
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

export { getCurrentUser, getAllUsers, createUser };
