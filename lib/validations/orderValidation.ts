import { body } from "express-validator";
import { valErrsHandler } from "./errsHandler";

export const validateOrderBody = [
  body("restaurantId")
  .notEmpty().withMessage(`L'id del ristorante e' obbligatorio`)
    .isString().withMessage(`L'id del ristorante deve essere una stringa`),

  body("address.street")
    .notEmpty().withMessage("La via è obbligatoria")
    .isString().withMessage("La via deve essere una stringa"),

  body("address.city")
    .notEmpty().withMessage("La città è obbligatoria")
    .isString().withMessage("La città deve essere una stringa"),

  body("address.country")
    .notEmpty().withMessage("Il paese è obbligatorio")
    .isString().withMessage("Il paese deve essere una stringa"),

  body("itemIds")
    .notEmpty().withMessage(`E' obbligatorio scegliere almeno un piatto`)
    .isArray({ min: 1 }).withMessage(`E' obbligatorio scegliere almeno un piatto`)
    .custom((itemIds) => {
        for (const itemId of itemIds) {
          if (typeof itemId !== 'string')
                throw new Error("I nomi degli items devono essere stringhe");
        }
        return true;
      }),

  valErrsHandler
];
