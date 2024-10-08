import { body } from "express-validator";
import { valErrsHandler } from "./errsHandler";

export const validateOrderBody = [
  body("restaurantId")
    .notEmpty()
    .withMessage(`L'id del ristorante e' obbligatorio`)
    .isString()
    .withMessage(`L'id del ristorante deve essere una stringa`),

  body("restaurantName")
    .isString()
    .withMessage("Il nome del ristorante deve essere una stringa"),

  body("deliveryPrice")
    .isFloat({ min: 0 })
    .withMessage("Il prezzo di consegna deve essere un numero (minimo 0)"),

  body("address")
    .isString()
    .withMessage("L'indirizzo deve essere una stringa"),

  body("items.*._id")
    .isMongoId()
    .withMessage("L'id dell'item deve essere un id di mongo valido"),

  body("items.*.name")
    .isString()
    .withMessage("Il nome dell'item deve essere una stringa"),

  body("items.*.price")
    .isFloat({ min: 0 })
    .withMessage("Il prezzo dell'item deve essere un numero (minimo 0)"),

  body("items.*.qnt")
    .isFloat({ min: 1 })
    .withMessage("La quantita' dell'item deve essere un numero (minimo 1)"),

  valErrsHandler,
];
