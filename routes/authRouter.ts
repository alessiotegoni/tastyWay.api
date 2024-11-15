import { Router } from "express";
import {
  googleAuth,
  logout,
  refreshToken,
  signIn,
  signUp,
} from "../controllers/authController";
import {
  validateGoogleAuth,
  validateSignInBody,
  validateUserBody,
} from "../lib/validations/userValidation";
import { verifyAddress } from "../middlewares/verifyAddress";

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

export default router;
