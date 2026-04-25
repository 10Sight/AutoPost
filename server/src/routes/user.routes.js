import { Router } from "express";
import { 
    getCurrentUser, 
    getAllUsers, 
    createUser,
    changeCurrentPassword,
    updateAccountDetails,
    updateUserRole,
    deleteUser
} from "../controllers/user.controller.js";
import { authorizeRoles } from "../middlewares/authorize.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT);

router.route("/current-user").get(getCurrentUser);
router.route("/").get(getAllUsers).post(authorizeRoles("admin"), createUser);
router.route("/role").patch(authorizeRoles("admin"), updateUserRole);
router.route("/:userId").delete(authorizeRoles("admin"), deleteUser);
router.route("/change-password").post(changeCurrentPassword);
router.route("/update-account").patch(updateAccountDetails);

export default router;
