import { Router } from "express";
import { getUsage } from "../controllers/usage.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT);

router.route("/").get(getUsage);

export default router;
