import { Router } from "express";
import {
  forgotPassword,
  googleAuth,
  logout,
  refreshToken,
  resetPassword,
  sendVerificationEmail,
  signIn,
  signUp,
  verifyEmail,
} from "../controllers/authController";
import { validateUserBody } from "../lib/validations/userValidation";
import { verifyAddress } from "../middlewares/verifyAddress";
import { verifyJWT } from "../middlewares/verifyJWT";
import {
  validateGoogleAuth,
  validateResetPassword,
  validateSignInBody,
} from "../lib/validations/authValidation";

const router = Router();

router.post("/google", validateGoogleAuth, googleAuth);
router.post("/signin", validateSignInBody, signIn);
router.post(
  "/signup",
  validateSignInBody,
  validateUserBody,
  verifyAddress,
  signUp
);
router.get("/refresh", refreshToken);
router.delete("/logout", logout);

router.post("/forgot-password", forgotPassword);
router.post("/reset-password", validateResetPassword, resetPassword);

router.use(verifyJWT);

router.post("/send-verification-email", sendVerificationEmail);
router.post("/verify-email", verifyEmail);

export default router;
