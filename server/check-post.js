import { ScheduledPost } from "./src/models/scheduledPost.model.js";
import connectDB from "./src/db/index.db.js";

const checkStatus = async () => {
    await connectDB();
    const postId = "69901d37be97f766b8386243";

    const post = await ScheduledPost.findById(postId);
    if (post) {
        console.log(`ID: ${post._id}`);
        console.log(`Status: ${post.status}`);
        console.log(`NextRetry: ${post.nextRetryAt}`);
        console.log(`Platform: ${post.platform}`);
    } else {
        console.log("Post not found");
    }
    process.exit(0);
};

checkStatus();
