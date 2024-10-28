import { Request, Router } from "express";
import {
  createRestaurant,
  deleteOrder,
  getActiveOrders,
  getMyRestaurant,
  getRestaurantByName,
  getRestaurantItems,
  getRestaurantOrderById,
  getRestaurantOrders,
  getRestaurants,
  updateOrder,
  updateRestaurant,
  updateRestaurantImg,
} from "../controllers/restaurantController";
import { checkCmpAccount } from "../middlewares/verifyCompanyAccount";
import { checkOwner } from "../middlewares/restaurant/verifyOwner";
import { uploadMultImgs, uploadSingleImg } from "../lib/utils";
import { verifyOrder } from "../middlewares/restaurant/verifyOrder";
import {
  validateQuery,
  validateRestaurantBody,
  validateRestaurantItems,
  validateRestaurantParam,
  validateRestaurantsOrdersQuery,
  validateRestaurantsQuery,
} from "../lib/validations/restaurantValidation";
import { verifyAddress } from "../middlewares/verifyAddress";
import { verifyJWT } from "../middlewares/verifyJWT";

const imgsUploader = uploadMultImgs();
const imgUploader = uploadSingleImg("restaurantImg");

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
    validateRestaurantBody,
    verifyAddress,
    updateRestaurant
  );

router.patch(
  "/my/restaurant/img",
  checkOwner,
  imgUploader,
  updateRestaurantImg
);

// Orders

router.use(checkOwner, verifyOrder);

router.get("/my/restaurant/active-orders", getActiveOrders);

router.get("/my/restaurant/order/:orderId", getRestaurantOrderById);

router
  .route("/my/restaurant/orders")
  .get(validateRestaurantsOrdersQuery, getRestaurantOrders)
  .patch(updateOrder)
  .delete(deleteOrder);

export default router;
