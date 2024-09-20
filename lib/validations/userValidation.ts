import { body } from "express-validator";
import { valErrsHandler } from "./errsHandler";
import axios from "axios";

export const validateSignInBody = [
  body("email").isEmail().withMessage("Email non valida"),

  body("password")
    .isString()
    .withMessage("La password deve essere una stringa"),

  valErrsHandler,
];

export const validateUserBody = [
  ...validateSignInBody,

  body("name")
    .isString()
    .withMessage(`Il nome dell'utente deve essere una stringa`),

  body("surname")
    .isString()
    .withMessage(`Il cognome dell'utente deve essere una stringa`),

  body("phoneNumber")
    .isMobilePhone("it-IT")
    .withMessage(
      `Il numero di telefono dell'utente deve essere un numero di telefono italiano valido`
    ),

  body("address")
    .isString()
    .withMessage("L'indirizzo e' obbligatorio"),

  valErrsHandler,
];

export const validateUserInfoBody = [
  ...validateUserBody,

  body("isCompanyAccount")
    .isBoolean()
    .withMessage("Il tipo di account deve essere un booleano")
    .toBoolean(),

  valErrsHandler,
];

export const validateUserSecurityBody = [
  body("newPassword")
    .isString()
    .withMessage(`La nuova password deve essere una stringa`),

  body("oldPassword")
    .isString()
    .withMessage(`La vecchia password deve essere una stringa`),

  valErrsHandler,
];
