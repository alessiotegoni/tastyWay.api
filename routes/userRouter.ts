import express, { Router } from "express";
import {
  createCheckoutSession,
  deleteUser,
  getUserActiveOrders,
  getUserOrders,
  getUserProfile,
  stripeWebhookHandler,
  updateUserImg,
  updateUserInfo,
  updateUserSecurity,
} from "../controllers/userController";
import { checkCmpAccount } from "../middlewares/verifyCompanyAccount";
import { uploadSingleImg } from "../lib/utils";
import {
  validateUserSecurityBody,
  validateUserInfoBody,
  validateUserOrdersQuery,
} from "../lib/validations/userValidation";
import { validateOrderBody } from "../lib/validations/orderValidation";
import { verifyAddress } from "../middlewares/verifyAddress";
import { verifyJWT } from "../middlewares/verifyJWT";

const imgUploader = uploadSingleImg("userImg");

const router = Router();

router.post(
  "/orders/checkout-webhook",
  express.raw({ type: "*/*" }),
  stripeWebhookHandler
);

router.use(express.json(), verifyJWT);

router
  .route("/profile")
  .get(getUserProfile)
  .patch(imgUploader, validateUserInfoBody, verifyAddress, updateUserInfo);

router.patch("/profile/security", validateUserSecurityBody, updateUserSecurity);

router.use(checkCmpAccount);

router.delete("/profile", deleteUser);

router.patch("/profile-img", imgUploader, updateUserImg);

router.post(
  "/orders/create-checkout-session",
  validateOrderBody,
  verifyAddress,
  createCheckoutSession
);

router.get("/orders", validateUserOrdersQuery, getUserOrders);
router.get("/active-orders", getUserActiveOrders);

export default router;
