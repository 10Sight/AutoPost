import crypto from "crypto";
import { Invitation } from "../models/invitation.model.js";
import { User } from "../models/user.model.js";
import { MailService } from "../services/mail.service.js";
import { validateLimit } from "../services/usage.service.js";
import { ApiError } from "../utils/ApiError.js";
import { config } from "../config/env.config.js";

/**
 * Service to handle Team Invitation logic
 */
export class InvitationService {
    /**
     * Create and send a new invitation
     */
    static async createInvitation(data) {
        const { email, role, organizationId, organizationName, invitedByUserId, invitedByName } = data;

        // 1. Check if user already exists
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            throw new ApiError(409, "User with this email already exists in the system");
        }

        // 2. Check if organization has reached team limit
        await validateLimit(organizationId, 'team');

        // 3. Generate secure token
        const token = crypto.randomBytes(32).toString("hex");
        const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours

        // 4. Upsert Invitation
        const invitation = await Invitation.findOneAndUpdate(
            { email: email.toLowerCase(), organizationId },
            {
                role,
                token,
                expiresAt,
                invitedBy: invitedByUserId,
                status: "pending"
            },
            { upsert: true, new: true }
        );

        // 5. Dispatch Email
        const inviteUrl = `${config.FRONTEND_URL}/invite/${token}`;
        MailService.sendInvitationEmail(email, {
            organizationName,
            invitedBy: invitedByName,
            role: role.charAt(0).toUpperCase() + role.slice(1),
            inviteUrl
        }).catch(err => console.error("Invitation email failed to send:", err));

        return invitation;
    }

    /**
     * Verify invitation token and return context
     */
    static async verifyToken(token) {
        const invitation = await Invitation.findOne({ 
            token, 
            status: "pending",
            expiresAt: { $gt: new Date() }
        }).populate("organizationId", "name slug branding");

        if (!invitation) {
            throw new ApiError(404, "Invalid or expired invitation link");
        }

        return invitation;
    }

    /**
     * Fetch all active pending invitations for an org
     */
    static async getPendingInvites(organizationId) {
        console.log(`[InvitationService] Fetching pending invites for Org: ${organizationId}`);
        const invites = await Invitation.find({
            organizationId,
            status: "pending",
            expiresAt: { $gt: new Date() }
        }).select("_id email role createdAt expiresAt");
        console.log(`[InvitationService] Found ${invites.length} pending invites`);
        return invites;
    }

    /**
     * Mark an invitation as accepted
     */
    static async acceptInvitation(token) {
        const invitation = await Invitation.findOne({ token, status: "pending" });
        if (invitation) {
            invitation.status = "accepted";
            await invitation.save();
        }
        return invitation;
    }
}
