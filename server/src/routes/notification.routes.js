import { Router } from "express";
import {
    getNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification
} from "../controllers/notification.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT);

router.route("/").get(getNotifications);
router.route("/mark-all-read").patch(markAllAsRead);
router.route("/:notificationId").patch(markAsRead).delete(deleteNotification);

export default router;
