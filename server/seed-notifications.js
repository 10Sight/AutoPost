import mongoose from "mongoose";
import { Notification } from "./src/models/notification.model.js";
import { Organization } from "./src/models/organization.model.js";
import { User } from "./src/models/user.model.js";
import dotenv from "dotenv";

dotenv.config();

const seedNotifications = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB");

        const org = await Organization.findOne({ slug: "default-org" });
        const user = await User.findOne({ email: "kaireshonline@gmail.com" });

        if (!org || !user) {
            console.error("Organization or User not found.");
            process.exit(1);
        }

        const notifications = [
            {
                organizationId: org._id,
                userId: user._id,
                title: "Welcome to AutoPost!",
                message: "Your account is now active. Start by connecting your social media profiles.",
                type: "SUCCESS",
            },
            {
                organizationId: org._id,
                userId: user._id,
                title: "Rule Warning: Late Night Posting",
                message: "Engagement might be lower during these hours. Check your policy rules for details.",
                type: "WARNING",
            },
            {
                organizationId: org._id,
                userId: user._id,
                title: "Post Failed",
                message: "Your scheduled post for LinkedIn failed due to an invalid token.",
                type: "ERROR",
            }
        ];

        await Notification.deleteMany({ userId: user._id });
        await Notification.insertMany(notifications);
        console.log("Sample notifications seeded successfully!");
        process.exit(0);
    } catch (error) {
        console.error("Error seeding notifications:", error);
        process.exit(1);
    }
};

seedNotifications();
