import { Router } from "express";
import {
  forgotPassword,
  googleAuth,
  logout,
  refreshToken,
  resetPassword,
  signIn,
  signUp,
  verifyEmail,
} from "../controllers/authController";
import {
  validateGoogleAuth,
  validateSignInBody,
  validateUserBody,
} from "../lib/validations/userValidation";
import { verifyAddress } from "../middlewares/verifyAddress";
import { verifyJWT } from "../middlewares/verifyJWT";

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

router.post("/verify-email", verifyJWT, verifyEmail);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

export default router;
