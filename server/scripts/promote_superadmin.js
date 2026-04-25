import mongoose from "mongoose";
import { User } from "../src/models/user.model.js";
import { Organization } from "../src/models/organization.model.js";
import dotenv from "dotenv";

dotenv.config();

const promote = async (email) => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB");

        const user = await User.findOne({ email });
        if (!user) {
            console.error("User not found");
            process.exit(1);
        }

        // 1. Update user role
        user.role = "superadmin";
        await user.save();
        console.log(`User ${email} promoted to superadmin successfully.`);

        // 2. Ensure a 'System Management' Org exists if needed, 
        // but for Phase 1, the user stays in their current org.
        
        console.log("Promotion Complete. Please restart your dev server and log in again.");
        process.exit(0);
    } catch (err) {
        console.error("Error during promotion:", err);
        process.exit(1);
    }
};

const email = process.argv[2];
if (!email) {
    console.error("Please provide an email address: node promote_superadmin.js user@example.com");
    process.exit(1);
}

promote(email);
