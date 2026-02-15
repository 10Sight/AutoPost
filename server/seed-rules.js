import mongoose from "mongoose";
import { Rule } from "./src/models/rule.model.js";
import { Organization } from "./src/models/organization.model.js";
import dotenv from "dotenv";

dotenv.config();

const seedRules = async () => {
    console.log("Starting seed script...");
    try {
        if (!process.env.MONGO_URI) {
            console.error("MONGO_URI not found in environment. Please check your .env file.");
            process.exit(1);
        }
        console.log("Connecting to:", process.env.MONGO_URI);
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB");

        const org = await Organization.findOne({ slug: "default-org" });
        console.log("Found organization:", org?.name);
        if (!org) {
            console.error("Default organization not found. Please run migrate.js first.");
            process.exit(1);
        }

        const organizationId = org._id;

        // Clear existing rules for this org (to avoid duplicates in testing)
        await Rule.deleteMany({ organizationId });

        const rules = [
            {
                name: "Night Posting Warning",
                description: "Warn user if posting between 10 PM and 6 AM",
                organizationId,
                trigger: "BEFORE_SCHEDULE",
                conditions: [
                    {
                        field: "scheduledAt",
                        operator: "between", // We'll need to handle hours in the engine if we want this exact logic, 
                        // but for now let's use a simpler condition or mock it.
                        // For a real check, we might pass 'hours' to getContext.
                        // Let's use platform 'LinkedIn' for a specific check.
                        value: [new Date().setHours(22, 0, 0, 0), new Date().setHours(23, 59, 59, 999)]
                    }
                ],
                actions: [
                    {
                        type: "WARN",
                        message: "You are scheduling a post during late night hours. Engagement might be lower."
                    }
                ],
                active: true
            },
            {
                name: "Block Empty LinkedIn Caption",
                description: "LinkedIn posts require a caption",
                organizationId,
                trigger: "BEFORE_SCHEDULE",
                conditions: [
                    {
                        field: "platform",
                        operator: "eq",
                        value: "linkedin"
                    },
                    {
                        field: "caption",
                        operator: "eq",
                        value: ""
                    }
                ],
                actions: [
                    {
                        type: "BLOCK",
                        message: "LinkedIn posts cannot have an empty caption."
                    }
                ],
                active: true,
                priority: 10
            },
            {
                name: "Notify on Failure",
                description: "Notify admin if a post fails to publish",
                organizationId,
                trigger: "POST_FAILED",
                conditions: [], // Always trigger on failure for this org
                actions: [
                    {
                        type: "NOTIFY",
                        message: "A scheduled post has failed to publish. Please check the logs."
                    }
                ],
                active: true
            }
        ];

        await Rule.insertMany(rules);
        console.log("Sample rules seeded successfully!");
        process.exit(0);
    } catch (error) {
        console.error("Error seeding rules:", error);
        process.exit(1);
    }
};

seedRules();
