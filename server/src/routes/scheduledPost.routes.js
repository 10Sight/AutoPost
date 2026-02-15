import { Router } from "express";
import {
    createScheduledPost,
    getScheduledPosts,
    deleteScheduledPost,
    getDashboardStats,
    getAnalytics,
    getSmartSuggestions,
    bulkCreateScheduledPosts,
    updatePostStatus,
    updateScheduledPost,
    getPostVersions,
    rollbackPostVersion,
} from "../controllers/scheduledPost.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/authorize.middleware.js";
import { upload } from "../middlewares/multer.middleware.js"; // Assuming you have this

const router = Router();

router.use(verifyJWT);

router.route("/stats").get(getDashboardStats);
router.route("/analytics").get(getAnalytics);
router.route("/suggestions").get(getSmartSuggestions);
router.route("/bulk").post(upload.single("file"), bulkCreateScheduledPosts);
router.route("/").get(getScheduledPosts).post(createScheduledPost);
router.route("/:postId")
    .patch(updateScheduledPost)
    .delete(deleteScheduledPost);

router.route("/:postId/versions").get(getPostVersions);
router.route("/:postId/versions/:versionNumber/rollback").post(rollbackPostVersion);
router.route("/:postId/status").patch(authorizeRoles("admin", "reviewer", "publisher"), updatePostStatus);

export default router;
