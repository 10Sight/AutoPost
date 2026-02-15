import { Router } from "express";
import { getRules } from "../controllers/rule.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT);

router.route("/").get(getRules);

export default router;
