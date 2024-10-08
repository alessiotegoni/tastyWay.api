import express, { Router } from "express";
import {
  createCheckoutSession,
  createOrder,
  deleteUser,
  getUserOrders,
  getUserProfile,
  stripeWebhookHandler,
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
import { verifyJWT } from "../middlewares/verifyJWT";

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

router.post(
  "/orders/create-checkout-session",
  validateOrderBody,
  createCheckoutSession
);

router.post(
  "/orders/checkout-webhook",
  express.raw({ type: "*/*" }),
  stripeWebhookHandler
);

router.use(checkCmpAccount);

router.route("/orders").get(validateQuery, getUserOrders);
// .post(validateOrderBody, verifyAddress, createOrder);

export default router;
