import { Router } from "express";
import {
    uploadMedia,
    getMedia,
    deleteMedia,
} from "../controllers/media.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router.use(verifyJWT);

router.route("/").get(getMedia).post(upload.single("file"), uploadMedia);
router.post("/upload", upload.single("file"), uploadMedia); // Explicit route for frontend compatibility
router.route("/:mediaId").delete(deleteMedia);

export default router;
