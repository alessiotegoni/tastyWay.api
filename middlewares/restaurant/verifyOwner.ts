import asyncHandler from "express-async-handler";
import { RestaurantSchema } from "../../models";
import { RestaurantDocument } from "../../types";

export const checkOwner = asyncHandler(async (req, res, next) => {
  const { id: userId, isCmpAccount } = req.user!;

  const restaurant = await RestaurantSchema.findOne<RestaurantDocument>(
    { ownerId: userId },
    { _id: 1, "deliveryInfo.time": 1, items: 1, imageUrl: 1 }
  );

  if (!restaurant) {
    res
      .status(401)
      .json({ message: "Non sei il titolare di nessun ristorante" });
    return;
  }

  req.restaurant = restaurant;

  next();
});
