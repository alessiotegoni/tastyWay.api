import { body } from "express-validator";
import { valErrsHandler } from "./errsHandler";

export const validateGoogleAuth = [
  body("name")
    .optional()
    .isString()
    .withMessage(`Il nome dell'utente deve essere una stringa`),

  body("surname")
    .optional()
    .isString()
    .withMessage(`Il cognome dell'utente deve essere una stringa`),

  body("email").optional().isEmail().withMessage("Email non valida"),

  body("profileImg")
    .optional()
    .isURL()
    .withMessage("Url dell'immagine utente invalido"),

  body("access_token")
    .optional()
    .isString()
    .withMessage("Access token invalido"),

  valErrsHandler,
];

export const passwordOptions = {
  minLength: 8,
  minLowercase: 0,
  minUppercase: 0,
  minNumbers: 0,
  minSymbols: 0,
};

export const validateSignInBody = [
  body("email").isEmail().withMessage("Email non valida"),

  body("password")
    .isStrongPassword(passwordOptions)
    .withMessage("Password non valida"),

  valErrsHandler,
];

export const validateResetPassword = [
  body("email").isEmail().withMessage("Email non valida"),
  body("token")
    .isString()
    .isLength({ min: 40, max: 40 })
    .withMessage("Token non valido"),
  body("newPassword")
    .isStrongPassword(passwordOptions)
    .withMessage("Password non valida"),
];
