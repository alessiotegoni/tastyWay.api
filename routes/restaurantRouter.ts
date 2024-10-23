import { Request, Router } from "express";
import {
  createRestaurant,
  deleteOrder,
  getActiveOrders,
  getMyRestaurant,
  getRestaurantByName,
  getRestaurantItems,
  getRestaurantOrders,
  getRestaurants,
  updateOrder,
  updateRestaurant,
} from "../controllers/restaurantController";
import { checkCmpAccount } from "../middlewares/verifyCompanyAccount";
import { checkOwner } from "../middlewares/restaurant/verifyOwner";
import { uploadMultImgs } from "../lib/utils";
import { verifyOrder } from "../middlewares/restaurant/verifyOrder";
import {
  validateQuery,
  validateRestaurantBody,
  validateRestaurantItems,
  validateRestaurantParam,
  validateRestaurantsQuery,
} from "../lib/validations/restaurantValidation";
import { verifyAddress } from "../middlewares/verifyAddress";
import { verifyJWT } from "../middlewares/verifyJWT";

const imgsUploader = uploadMultImgs();

const router = Router();

router.get("/", verifyAddress, validateRestaurantsQuery, getRestaurants);
router.get("/:restaurantName", validateRestaurantParam, getRestaurantByName);
router.get("/:restaurantId/items", validateRestaurantItems, getRestaurantItems);

router.use(verifyJWT, checkCmpAccount);

// Restaurant

router
  .route("/my/restaurant")
  .get(getMyRestaurant)
  .post(imgsUploader, validateRestaurantBody, verifyAddress, createRestaurant)
  .patch(
    checkOwner,
    imgsUploader,
    (req: Request) => console.log(req.files),
    validateRestaurantBody,
    verifyAddress,
    updateRestaurant
  );

// Orders

router.use(checkOwner, verifyOrder);

router.get("/active-orders", getActiveOrders);

router
  .route("/orders")
  .get(validateQuery, getRestaurantOrders)
  .patch(updateOrder)
  .delete(deleteOrder);

export default router;
