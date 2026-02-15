import mongoose from "mongoose";
import { User } from "./src/models/user.model.js";
import { Organization } from "./src/models/organization.model.js";
import { ScheduledPost } from "./src/models/scheduledPost.model.js";
import { SocialAccount } from "./src/models/socialAccount.model.js";
import { Media } from "./src/models/media.model.js";
import { Usage } from "./src/models/usage.model.js";
import { AuditLog } from "./src/models/auditLog.model.js";
import { config } from "./src/config/env.config.js";

const migrate = async () => {
    try {
        await mongoose.connect(config.MONGO_URI);
        console.log("Connected to MongoDB for migration");

        // 1. Ensure a default organization exists
        let defaultOrg = await Organization.findOne({ slug: "default-org" });
        if (!defaultOrg) {
            defaultOrg = await Organization.create({
                name: "Default Organization",
                slug: "default-org",
                active: true
            });
            console.log("Created Default Organization");
        }

        const orgId = defaultOrg._id;

        // 2. Update Users
        const userUpdate = await User.updateMany(
            { organizationId: { $exists: false } },
            { $set: { organizationId: orgId } }
        );
        console.log(`Updated ${userUpdate.modifiedCount} users with default organization`);

        // 3. Update ScheduledPosts
        const postUpdate = await ScheduledPost.updateMany(
            { organizationId: { $exists: false } },
            { $set: { organizationId: orgId } }
        );
        console.log(`Updated ${postUpdate.modifiedCount} scheduled posts`);

        // 4. Update SocialAccounts
        const accountUpdate = await SocialAccount.updateMany(
            { organizationId: { $exists: false } },
            { $set: { organizationId: orgId } }
        );
        console.log(`Updated ${accountUpdate.modifiedCount} social accounts`);

        // 5. Update Media
        const mediaUpdate = await Media.updateMany(
            { organizationId: { $exists: false } },
            { $set: { organizationId: orgId } }
        );
        console.log(`Updated ${mediaUpdate.modifiedCount} media records`);

        // 6. Update AuditLogs
        const auditUpdate = await AuditLog.updateMany(
            { organizationId: { $exists: false } },
            { $set: { organizationId: orgId } }
        );
        console.log(`Updated ${auditUpdate.modifiedCount} audit logs`);

        // 7. Handle Usage (Refactored from userId to organizationId)
        // This is tricky if multiple users had usage records. 
        // For simplicity, we assign all to the defaultOrg's usage or create one.
        const existingUsages = await Usage.find({ organizationId: { $exists: false } });
        if (existingUsages.length > 0) {
            console.log(`Found ${existingUsages.length} usage records without organizationId`);
            // We can't easily merge them, so we'll just assign the first one to the org if org usage doesn't exist
            let orgUsage = await Usage.findOne({ organizationId: orgId });
            if (!orgUsage) {
                // Take the most "complete" one or just update the first one
                await Usage.updateOne(
                    { _id: existingUsages[0]._id },
                    { $set: { organizationId: orgId } }
                );
                console.log("Assigned existing usage record to default organization");
            }
            // Delete others or leave them orphaned? Let's leave them for safety or delete if they are strictly required to have orgId
            await Usage.deleteMany({ organizationId: { $exists: false }, _id: { $ne: existingUsages[0]._id } });
        }

        console.log("Migration completed successfully");
        process.exit(0);
    } catch (error) {
        console.error("Migration failed:", error);
        process.exit(1);
    }
};

migrate();
