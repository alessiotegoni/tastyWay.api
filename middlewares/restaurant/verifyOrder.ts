import { NextFunction, Request, Response } from "express";
import { OrderSchema } from "../../models";
import asyncHandler from "express-async-handler";
import { OrderDocument } from "../../types";

// Verify if order the order is from that restaurant

export const verifyOrder = asyncHandler(async (req, res, next) => {
  const { id: orderId } = req.query;

  if (orderId) {
    const order: OrderDocument | null = await OrderSchema.findById(orderId);

    if (!order) return res.status(404).json({ message: "Ordine non trovato" });

    if (order.restaurantId.toString() !== req.restaurant._id.toString())
      return res
        .status(401)
        .json({ message: `Quest'ordine non appartiene al tuo ristorante` });

    req.order = order;
  }

  next();
});
