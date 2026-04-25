import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { tenantMiddleware } from "../middlewares/tenant.middleware.js";
import { 
    getPostEngagement, 
    getPostComments, 
    addPostComment,
    likeComment,
    likePost
} from "../controllers/engagement.controller.js";

const router = Router();

// Secure all engagement routes
router.use(verifyJWT);
router.use(tenantMiddleware);

router.route("/:postId").get(getPostEngagement);
router.route("/:postId/comments").get(getPostComments);
router.route("/:postId/comments").post(addPostComment);
router.route("/:postId/comments/:commentId/like").post(likeComment);
router.route("/:postId/like").post(likePost);

export default router;
