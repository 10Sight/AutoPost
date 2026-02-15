import mongoose from "mongoose";
import { User } from "./src/models/user.model.js";
import { Organization } from "./src/models/organization.model.js";
import { config } from "./src/config/env.config.js";

const seedAdmin = async () => {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(config.MONGO_URI);
        console.log("Connected to MongoDB");

        // 1. Ensure a default organization exists
        let organization = await Organization.findOne({ slug: "default-org" });
        if (!organization) {
            console.log("Creating default organization...");
            organization = await Organization.create({
                name: "Default Organization",
                slug: "default-org",
                active: true
            });
            console.log("Created Default Organization");
        }

        const adminData = {
            name: "Jatin Kumar Nagar",
            email: "jatinnagar563@gmail.com",
            password: "Jatin123",
            role: "admin",
            organizationId: organization._id // Link to organization
        };

        const existedUser = await User.findOne({ email: adminData.email });

        if (existedUser) {
            console.log("Admin user already exists. Updating details...");
            existedUser.name = adminData.name;
            existedUser.password = adminData.password; // The pre-save hook will hash this
            existedUser.role = adminData.role;
            existedUser.organizationId = organization._id; // Ensure organization is linked
            await existedUser.save();
            console.log("Admin user updated successfully");
        } else {
            console.log("Creating admin user...");
            await User.create(adminData);
            console.log("Admin user created successfully");
        }

        await mongoose.connection.close();
        console.log("Database connection closed");
        process.exit(0);
    } catch (error) {
        console.error("Error seeding admin user:", error);
        process.exit(1);
    }
};

seedAdmin();
