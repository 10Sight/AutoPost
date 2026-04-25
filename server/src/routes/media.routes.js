import { Router } from "express";
import {
    uploadMedia,
    getMedia,
    getMediaById,
    deleteMedia,
    createFolder,
    getFolders,
    deleteFolder,
    moveMedia,
} from "../controllers/media.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import { applyEditorHeaders } from "../middlewares/editor.middleware.js";

const router = Router();

router.use(verifyJWT);

// Folder routes
router.route("/folders").post(createFolder).get(getFolders);
router.route("/folders/:folderId").delete(deleteFolder);

// Media routes
router.route("/").get(getMedia).post(upload.single("file"), uploadMedia);
router.post("/upload", upload.single("file"), uploadMedia);

router.route("/editor/upload").post(applyEditorHeaders, upload.single("file"), uploadMedia);

router.route("/:mediaId").get(getMediaById).delete(deleteMedia);
router.put("/:mediaId/move", moveMedia);

export default router;
