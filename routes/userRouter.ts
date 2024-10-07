import { Router } from "express";
import {
  createOrder,
  deleteUser,
  getUserOrders,
  getUserProfile,
  updateUserInfo,
  updateUserSecurity,
} from "../controllers/userController";
import { checkCmpAccount } from "../middlewares/verifyCompanyAccount";
import { uploadSingleImg } from "../lib/utils";
import {
  validateUserInfoBody,
  validateUserSecurityBody,
} from "../lib/validations/userValidation";
import { validateOrderBody } from "../lib/validations/orderValidation";
import { validateQuery } from "../lib/validations/restaurantValidation";
import { verifyAddress } from "../middlewares/verifyAddress";

const imgUploader = uploadSingleImg();

const router = Router();

router.route("/profile").get(getUserProfile).delete(deleteUser);

router.patch(
  "/profile/info",
  imgUploader,
  validateUserInfoBody,
  verifyAddress,
  updateUserInfo
);
router.patch("/profile/security", validateUserSecurityBody, updateUserSecurity);

router.use(checkCmpAccount);

router
  .route("/orders")
  .get(validateQuery, getUserOrders)
  .post(validateOrderBody, verifyAddress, createOrder);

export default router;
