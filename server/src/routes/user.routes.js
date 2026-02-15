import { Router } from "express";
import { getCurrentUser, getAllUsers, createUser } from "../controllers/user.controller.js";
import { authorizeRoles } from "../middlewares/authorize.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT);

router.route("/current-user").get(getCurrentUser);
router.route("/").get(getAllUsers).post(authorizeRoles("admin"), createUser);

export default router;
