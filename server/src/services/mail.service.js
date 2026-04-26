import nodemailer from "nodemailer";
import { config } from "../config/env.config.js";
import { logger } from "../utils/logger.js";

/**
 * Production-grade Email Service
 */
export class MailService {
    static transporter = null;

    static async init() {
        if (this.transporter) return;

        // Note: You must add GOOGLE_SMTP_USER and GOOGLE_SMTP_PASS to your .env
        // And enable "App Passwords" in your Google Account
        this.transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.GOOGLE_SMTP_USER,
                pass: process.env.GOOGLE_SMTP_PASS,
            },
        });

        try {
            await this.transporter.verify();
            logger.info("Email Service Integrated Successfully");
        } catch (error) {
            logger.warn("Email service failed to initialize (Check GOOGLE_SMTP credentials):", error.message);
        }
    }

    /**
     * Send instant failure alert to Superadmin
     */
    static async sendFailureAlert(superadminEmail, data) {
        if (!this.transporter) await this.init();

        const mailOptions = {
            from: `"10Sight System" <${process.env.GOOGLE_SMTP_USER}>`,
            to: superadminEmail,
            subject: `🚨 CRITICAL: Post Failure for ${data.organizationName}`,
            html: `
                <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                    <h2 style="color: #e11d48;">System Alert: Post Publication Failed</h2>
                    <p><strong>Organization:</strong> ${data.organizationName}</p>
                    <p><strong>Platform:</strong> ${data.platform}</p>
                    <p><strong>Error:</strong> ${data.error || "Unknown Error"}</p>
                    <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                    <a href="${process.env.FRONTEND_URL}/admin-panel/health" 
                       style="background: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                        View Global Feed
                    </a>
                </div>
            `,
        };

        try {
            if (this.transporter) {
                await this.transporter.sendMail(mailOptions);
                logger.info(`Failure alert sent to Superadmin: ${superadminEmail}`);
            }
        } catch (error) {
            logger.error(`Failed to send email alert:`, error);
        }
    }
    /**
     * Send welcome email to new client admin
     */
    static async sendWelcomeEmail(to, data) {
        if (!this.transporter) await this.init();

        const mailOptions = {
            from: `"10Sight System" <${process.env.GOOGLE_SMTP_USER}>`,
            to: to,
            subject: `🚀 Welcome to ${data.companyName} Workspace`,
            html: `
                <div style="font-family: sans-serif; padding: 30px; border: 1px solid #f0f0f0; border-radius: 15px; max-width: 600px; margin: auto;">
                    <h1 style="color: #2563eb; margin-bottom: 20px;">Welcome to the Platform, ${data.adminName}!</h1>
                    <p>Your professional social media workspace <strong>${data.companyName}</strong> has been provisioned.</p>
                    
                    <div style="background: #f8fafc; padding: 20px; border-radius: 10px; margin: 25px 0; border: 1px solid #e2e8f0;">
                        <h3 style="margin-top: 0; color: #1e293b;">Your Temporary Credentials</h3>
                        <p style="margin: 5px 0;"><strong>Email:</strong> ${to}</p>
                        <p style="margin: 5px 0;"><strong>Password:</strong> <span style="font-family: monospace; background: #e2e8f0; padding: 2px 6px; border-radius: 4px;">${data.tempPassword}</span></p>
                    </div>

                    <p style="color: #64748b; font-size: 14px; margin-bottom: 30px;">
                        Please log in to your dashboard and change your password immediately for security.
                    </p>

                    <a href="${data.loginUrl}" 
                       style="display: inline-block; background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                        Access My Workspace
                    </a>

                    <hr style="border: 0; border-top: 1px solid #f0f0f0; margin: 30px 0;">
                    <p style="color: #94a3b8; font-size: 12px; text-align: center;">
                        Automated Provisioning System &bull; Professional SaaS Suite
                    </p>
                </div>
            `,
        };

        try {
            if (this.transporter) {
                await this.transporter.sendMail(mailOptions);
                logger.info(`Welcome email sent to: ${to}`);
            }
        } catch (error) {
            logger.error(`Failed to send welcome email:`, error);
        }
    }

    /**
     * Send status change notification
     */
    static async sendStatusChangeEmail(to, data) {
        if (!this.transporter) await this.init();

        const mailOptions = {
            from: `"10Sight Security" <${process.env.GOOGLE_SMTP_USER}>`,
            to: to,
            subject: `⚠️ Update regarding your ${data.companyName} Workspace`,
            html: `
                <div style="font-family: sans-serif; padding: 30px; border: 1px solid #f0f0f0; border-radius: 15px; max-width: 600px; margin: auto;">
                    <h2 style="color: ${data.status === 'active' ? '#10b981' : '#e11d48'};">Workspace Status Updated</h2>
                    <p>This is an automated notification regarding your workspace: <strong>${data.companyName}</strong>.</p>
                    
                    <div style="background: #f8fafc; padding: 20px; border-radius: 10px; margin: 25px 0; border-left: 5px solid ${data.status === 'active' ? '#10b981' : '#e11d48'};">
                        <p style="margin: 0;">Your new workspace status is: <strong style="text-transform: uppercase;">${data.status}</strong></p>
                    </div>

                    <p style="color: #64748b; font-size: 14px; margin-bottom: 30px;">
                        ${data.status === 'active' 
                            ? "All platform features have been restored. You can now resume your scheduling activities." 
                            : "Access to your workspace has been temporarily restricted. If you believe this is an error, please contact our support team."}
                    </p>

                    <a href="${process.env.FRONTEND_URL}" 
                       style="display: inline-block; background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                        Visit Dashboard
                    </a>
                </div>
            `,
        };

        try {
            if (this.transporter) {
                await this.transporter.sendMail(mailOptions);
                logger.info(`Status change email sent to: ${to}`);
            }
        } catch (error) {
            logger.error(`Failed to send status change email:`, error);
        }
    }

    /**
     * Send security alert email
     */
    static async sendSecurityAlertEmail(to, data) {
        if (!this.transporter) await this.init();

        const { type } = data;
        const subjects = {
            password: "🔒 Security Alert: Password Changed",
            email: "🔒 Security Alert: Email Updated"
        };

        const mailOptions = {
            from: `"10Sight Security" <${process.env.GOOGLE_SMTP_USER}>`,
            to: to,
            subject: subjects[type] || "🔒 10Sight Security Alert",
            html: `
                <div style="font-family: sans-serif; padding: 40px; border: 1px solid #e11d48; border-radius: 20px; max-width: 600px; margin: auto; background: #fff;">
                    <div style="display: inline-block; padding: 10px 20px; background: #fff1f2; color: #e11d48; border-radius: 50px; font-weight: bold; font-size: 12px; margin-bottom: 20px;">
                        SECURITY ALERT
                    </div>
                    <h2 style="color: #0f172a; margin: 0 0 10px 0;">Your ${type} was changed</h2>
                    <p style="color: #64748b; line-height: 1.6;">
                        This is an automated security notification for your 10Sight account. 
                        The ${type} associated with your account was updated on <strong>${new Date().toLocaleString()}</strong>.
                    </p>
                    
                    <div style="background: #f8fafc; padding: 25px; border-radius: 12px; margin: 30px 0; border: 1px solid #f1f5f9;">
                        <p style="margin: 0; color: #0f172a; font-weight: 500;">
                            If you performed this action, you can safely ignore this email.
                        </p>
                    </div>

                    <p style="color: #e11d48; font-weight: bold; font-size: 14px;">
                        If you did NOT perform this action, please secure your account immediately.
                    </p>

                    <div style="margin-top: 40px; border-top: 1px solid #f1f5f9; pt-20px; padding-top: 20px;">
                        <a href="${process.env.FRONTEND_URL}/dashboard/profile" 
                           style="display: inline-block; background: #0f172a; color: white; padding: 12px 30px; text-decoration: none; border-radius: 10px; font-weight: bold; font-size: 15px;">
                            Review Account Activity
                        </a>
                    </div>
                    
                    <p style="margin-top: 30px; color: #94a3b8; font-size: 11px;">
                        This email was sent to ${to}. Security is our priority at 10Sight.
                    </p>
                </div>
            `,
        };

        try {
            if (this.transporter) {
                await this.transporter.sendMail(mailOptions);
                logger.info(`Security alert (${type}) sent to: ${to}`);
            }
        } catch (error) {
            logger.error(`Failed to send security alert:`, error);
        }
    }

    /**
     * Send team invitation email
     */
    static async sendInvitationEmail(to, data) {
        if (!this.transporter) await this.init();

        const mailOptions = {
            from: `"10Sight System" <${process.env.GOOGLE_SMTP_USER}>`,
            to: to,
            subject: `🤝 You're invited to join ${data.organizationName} on 10Sight`,
            html: `
                <div style="font-family: sans-serif; padding: 40px; border: 1px solid #f0f0f0; border-radius: 20px; max-width: 600px; margin: auto; background: #fff;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <div style="display: inline-block; padding: 12px 24px; background: #eff6ff; color: #2563eb; border-radius: 50px; font-weight: bold; font-size: 14px;">
                            TEAM INVITATION
                        </div>
                    </div>
                    
                    <h1 style="color: #0f172a; text-align: center; margin-bottom: 10px; font-size: 24px;">Join the Workspace</h1>
                    <p style="color: #64748b; text-align: center; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
                        <strong>${data.invitedBy}</strong> has invited you to join the <strong>${data.organizationName}</strong> team as a <strong>${data.role}</strong>.
                    </p>
                    
                    <div style="background: #f8fafc; padding: 30px; border-radius: 16px; text-align: center; border: 1px solid #f1f5f9; margin-bottom: 30px;">
                        <p style="color: #1e293b; margin-bottom: 20px; font-weight: 500;">Click the button below to accept your invitation and set up your account:</p>
                        <a href="${data.inviteUrl}" 
                           style="display: inline-block; background: #2563eb; color: white; padding: 14px 35px; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 16px; transition: all 0.2s;">
                            Accept Invitation
                        </a>
                    </div>

                    <p style="color: #94a3b8; font-size: 13px; text-align: center; line-height: 1.5;">
                        This invitation will expire in 48 hours. If you weren't expecting this invitation, you can safely ignore this email.
                    </p>
                    
                    <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 30px 0;">
                    
                    <div style="text-align: center;">
                        <p style="color: #cbd5e1; font-size: 12px;">
                            &copy; ${new Date().getFullYear()} 10Sight Technologies. All rights reserved.
                        </p>
                    </div>
                </div>
            `,
        };

        try {
            if (this.transporter) {
                await this.transporter.sendMail(mailOptions);
                logger.info(`Invitation email sent to: ${to}`);
            }
        } catch (error) {
            logger.error(`Failed to send invitation email:`, error);
        }
    }

    /**
     * Send professional invoice email with PDF attachment
     */
    static async sendInvoiceEmail(to, data, attachmentPath) {
        if (!this.transporter) await this.init();

        const mailOptions = {
            from: `"10Sight Billing" <${process.env.GOOGLE_SMTP_USER}>`,
            to: to,
            subject: `📄 Your Invoice for ${data.planName} Plan`,
            html: `
                <div style="font-family: sans-serif; padding: 30px; border: 1px solid #f0f0f0; border-radius: 15px; max-width: 600px; margin: auto;">
                    <h2 style="color: #2563eb;">Payment Successful!</h2>
                    <p>Hi ${data.adminName},</p>
                    <p>Thank you for subscribing to the <strong>${data.planName} Plan</strong>. Your account limits have been updated successfully.</p>
                    
                    <div style="background: #f8fafc; padding: 20px; border-radius: 10px; margin: 25px 0; border: 1px solid #e2e8f0;">
                        <p style="margin: 5px 0;"><strong>Plan:</strong> ${data.planName}</p>
                        <p style="margin: 5px 0;"><strong>Amount Paid:</strong> $${(data.amount / 100).toFixed(2)}</p>
                        <p style="margin: 5px 0;"><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
                    </div>

                    <p>We've attached your formal invoice to this email for your records.</p>

                    <hr style="border: 0; border-top: 1px solid #f0f0f0; margin: 30px 0;">
                    <p style="color: #94a3b8; font-size: 12px; text-align: center;">
                        10Sight Billing System &bull; Professional SaaS Suite
                    </p>
                </div>
            `,
            attachments: [
                {
                    filename: `Invoice_${data.invoiceId}.pdf`,
                    path: attachmentPath,
                    contentType: "application/pdf"
                }
            ]
        };

        try {
            if (this.transporter) {
                await this.transporter.sendMail(mailOptions);
                logger.info(`Invoice email sent to: ${to}`);
            }
        } catch (error) {
            logger.error(`Failed to send invoice email:`, error);
        }
    }
}
