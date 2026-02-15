import { ScheduledPost } from "./src/models/scheduledPost.model.js";
import connectDB from "./src/db/index.db.js";

const testQuery = async () => {
    await connectDB();
    const now = new Date();
    console.log("Current Time:", now);

    const pendingPosts = await ScheduledPost.find({
        $or: [
            { status: { $in: ["pending", "scheduled"] }, scheduledAt: { $lte: now } },
            {
                status: "failed",
                nextRetryAt: { $lte: now },
                $expr: { $lt: ["$retryCount", "$maxRetries"] }
            }
        ]
    }).select("_id status nextRetryAt retryCount");

    console.log("Found posts:", pendingPosts.length);
    pendingPosts.forEach(p => {
        console.log(`ID: ${p._id}, Status: ${p.status}, NextRetry: ${p.nextRetryAt}, RetryCount: ${p.retryCount}`);
    });
    process.exit(0);
};

testQuery();
