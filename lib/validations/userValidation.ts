import { body, query } from "express-validator";
import { valErrsHandler } from "./errsHandler";
import { isValidObjectId } from "mongoose";
import { passwordOptions } from "./authValidation";

export const validateUserBody = [
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

  body("address").isString().withMessage("L'indirizzo e' obbligatorio"),

  valErrsHandler,
];

export const validateUserOrdersQuery = [
  query("id")
    .optional()
    .custom((id, { req }) => {
      if (id && !isValidObjectId(id))
        throw new Error("L'id dell'ordine deve essere un id di mongoDB valido");

      // const { page, limit } = req.query!;

      // if (!id && (!page || !limit)) {
      //   throw new Error(
      //     "Numero di pagine di ordini da caricare e limite obbligatori"
      //   );
      // }
      return true;
    }),

  query("pageParam")
    .optional()
    .custom((pageParam) => {
      if (pageParam && !isValidObjectId(pageParam))
        throw new Error("L'id dell'ordine deve essere un id di mongoDB valido");

      return true;
    }),

  query("limit")
    .isString()
    .withMessage(
      "Il limite di ristorante da caricare deve essere un numero intero"
    )
    .toInt(),

  valErrsHandler,
];

export const validateUserInfoBody = [
  ...validateUserBody,

  body("isCompanyAccount")
    .isBoolean()
    .withMessage("Il tipo di account deve essere un booleano"),

  valErrsHandler,
];

export const validateUserSecurityBody = [
  body("newPassword")
    .isStrongPassword(passwordOptions)
    .withMessage("Nuova password invalida"),

  body("oldPassword")
    .optional()
    .isString()
    .withMessage("La vecchia password deve essere una stringa"),

  valErrsHandler,
];
