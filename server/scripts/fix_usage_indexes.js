import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const fixUsageIndexes = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB");

        const collection = mongoose.connection.collection("usages");
        
        console.log("Checking indexes on 'usages' collection...");
        const indexes = await collection.indexes();
        console.log("Current indexes:", indexes.map(i => i.name));

        const staleIndex = "userId_1";
        if (indexes.find(i => i.name === staleIndex)) {
            console.log(`Found stale index: ${staleIndex}. Dropping it...`);
            await collection.dropIndex(staleIndex);
            console.log("Index dropped successfully.");
        } else {
            console.log("No stale userId index found.");
        }

        console.log("Ensuring organizationId_1 index exists and is unique...");
        await collection.createIndex({ organizationId: 1 }, { unique: true });
        console.log("Organization index verified.");

        process.exit(0);
    } catch (error) {
        console.error("Error fixing indexes:", error);
        process.exit(1);
    }
};

fixUsageIndexes();
