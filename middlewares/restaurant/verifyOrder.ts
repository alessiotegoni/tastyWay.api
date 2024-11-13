import { OrderSchema } from "../../models";
import asyncHandler from "express-async-handler";
import { OrderDocument } from "../../types";
import { isValidObjectId } from "mongoose";

// Verify if order the order is from that restaurant

export const verifyOrder = asyncHandler(async (req, res, next) => {
  const { orderId } = req.params;

  if (!orderId || !isValidObjectId(orderId)) {
    res.status(404).json({ message: "orderId missing" });
    return;
  }

  const order: OrderDocument | null = await OrderSchema.findById(orderId);

  if (!order) {
    res.status(404).json({ message: "Ordine non trovato" });
    return;
  }

  if (order.restaurantId.toString() !== req.restaurant._id.toString()) {
    res
      .status(401)
      .json({ message: `Quest'ordine non appartiene al tuo ristorante` });
    return;
  }

  req.order = order;

  next();
});
