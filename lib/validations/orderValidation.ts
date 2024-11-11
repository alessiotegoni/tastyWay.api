import { body } from "express-validator";
import { valErrsHandler } from "./errsHandler";
import { isValidObjectId } from "mongoose";

export const validateOrderBody = [
  body("restaurantId")
    .isMongoId()
    .withMessage(`L'id del ristorante deve essere valido`),

  body("address").isString().withMessage("L'indirizzo deve essere una stringa"),

  body("itemsIds")
    .isArray({ min: 1 })
    .custom((itemsIds) => itemsIds.every((i: string) => isValidObjectId(i)))
    .withMessage("gli id degli items devono essere id validi"),

  valErrsHandler,
];
