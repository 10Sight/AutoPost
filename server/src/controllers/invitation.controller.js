import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { InvitationService } from "../services/invitation.service.js";
import { Invitation } from "../models/invitation.model.js";

/**
 * Controller to send a team invitation
 */
export const sendInvitation = asyncHandler(async (req, res) => {
    const { email, role } = req.body;

    if (!email || !role) {
        throw new ApiError(400, "Email and role are required");
    }

    const invitation = await InvitationService.createInvitation({
        email,
        role,
        organizationId: req.organizationId,
        organizationName: req.organization.name,
        invitedByUserId: req.user._id,
        invitedByName: req.user.name
    });

    return res
        .status(200)
        .json(new ApiResponse(200, { 
            email: invitation.email, 
            role: invitation.role, 
            expiresAt: invitation.expiresAt 
        }, "Invitation sent successfully"));
});

/**
 * Controller to verify an invitation token (Public)
 */
export const verifyInvitation = asyncHandler(async (req, res) => {
    const { token } = req.params;

    if (!token) {
        throw new ApiError(400, "Invitation token is required");
    }

    const invitation = await InvitationService.verifyToken(token);

    return res
        .status(200)
        .json(new ApiResponse(200, {
            email: invitation.email,
            role: invitation.role,
            organization: invitation.organizationId
        }, "Invitation verified successfully"));
});

/**
 * Controller to list all pending invitations for an organization
 */
export const getPendingInvitations = asyncHandler(async (req, res) => {
    const invitations = await InvitationService.getPendingInvites(req.organizationId);

    return res
        .status(200)
        .json(new ApiResponse(200, invitations, "Pending invitations fetched successfully"));
});

/**
 * Controller to cancel a pending invitation
 */
export const cancelInvitation = asyncHandler(async (req, res) => {
    const { inviteId } = req.params;

    const invitation = await Invitation.findOneAndDelete({
        _id: inviteId,
        organizationId: req.organizationId
    });

    if (!invitation) {
        throw new ApiError(404, "Invitation not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Invitation cancelled successfully"));
});
