import { Router } from "express";
import { 
    getGroups, 
    createGroup, 
    updateGroup, 
    deleteGroup,
    assignAccountToGroup
} from "../controllers/accountGroup.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// All routes are protected by JWT
router.use(verifyJWT);

router.route("/")
    .get(getGroups)
    .post(createGroup);

router.route("/:groupId")
    .patch(updateGroup)
    .delete(deleteGroup);

router.route("/:groupId/accounts")
    .post(assignAccountToGroup);

export default router;
