import { body, param, query } from "express-validator";
import { valErrsHandler } from "./errsHandler";
import { isValidObjectId } from "mongoose";
import {
  foodTypes,
  restaurantType,
  restaurantItemsTypes,
  ordersStatus,
} from "../../config/allowedFilters";

const validateItems = [
  body("items.*._id")
    .optional()
    .isString()
    .withMessage("L'id deve essere una stringa"),

  body("items.*.price")
    .isFloat({ min: 0 })
    .withMessage("Il prezzo deve essere un numero positivo")
    .toFloat(),

  body("items.*.name")
    .isString()
    .withMessage("Il nome deve essere una stringa"),

  body("items.*.description")
    .isString()
    .withMessage("La descrizione deve essere una stringa"),
];

export const validateRestaurantBody = [
  body("name")
    .isString()
    .withMessage(`Il nome del ristorante deve essere una stringa`),

  body("deliveryInfo.price")
    .isFloat({ min: 0 })
    .withMessage(`Il prezzo della consegna deve essere un numero`)
    .toFloat(),

  body("deliveryInfo.time")
    .isInt({ min: 0 })
    .withMessage(`Il tempo di consegna deve essere un numero`)
    .toInt(),

  body("address").isString().withMessage("L'indirizzo e' obbligatorio"),

  body("cuisine")
    .isArray()
    .withMessage(`Obbligatoria almeno una cucina`)
    .custom((cuisineArray: any[]) => {
      if (!cuisineArray.every((item) => typeof item === "string")) {
        throw new Error("Ogni elemento in cuisine deve essere una stringa");
      }
      return true;
    }),

  body("items")
    .isArray({ min: 3 })
    .withMessage(`Gli items devono essere un array con almeno 3 elementi`),
  ...validateItems,

  valErrsHandler,
];

export const validateQuery = [
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

  valErrsHandler,
];

export const validateRestaurantParam = [
  param("restaurantName")
    .isString()
    .withMessage(
      "Il nome del ristorante e' obbligatorio e deve essere una stringa"
    ),
];

export const validateRestaurantItems = [
  param("restaurantId")
    .isMongoId()
    .isString()
    .withMessage(
      "L'id del ristorante e' obbligatorio e deve essere una stringa"
    ),

  query("pageParam")
    .optional()
    .isMongoId()
    .withMessage("L'id dell'ordine deve essere un id di mongoDB valido"),

  query("limit")
    .isString()
    .withMessage(
      "Il limite di ristorante da caricare deve essere un numero intero"
    )
    .toInt(),

  query("filters.name")
    .optional()
    .isString()
    .withMessage("Il nome dell'item e' obbligatorio e deve essere una stringa"),

  query("filters.itemsType")
    .optional()
    .isArray({ min: 1 })
    .isIn(restaurantItemsTypes)
    .withMessage("Tipo di piatto non valido"),

  valErrsHandler,
];

export const validateRestaurantsQuery = [
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

  query("filters.name")
    .optional()
    .isString()
    .withMessage(
      "Il nome del ristorante e' obbligatorio e deve essere una stringa"
    ),

  query("filters.foodType")
    .optional()
    .isArray({ min: 1 })
    .isIn(foodTypes)
    .withMessage("Filtro foodType non valido"),

  query("filters.restaurantTypes")
    .optional()
    .isArray({ min: 1 })
    .isIn(restaurantType)
    .withMessage("Filtro restaurantType non valido"),

  valErrsHandler,
];

export const validateRestaurantsOrdersQuery = [
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

  query("filters.statusTypes")
    .optional()
    .isArray({ min: 1 })
    .isIn(ordersStatus)
    .withMessage("Stato dell'ordine non valido"),

  query("filters.orderInfo")
    .optional()
    .isString()
    .withMessage("Info dell'ordine non valida"),

  valErrsHandler,
];
