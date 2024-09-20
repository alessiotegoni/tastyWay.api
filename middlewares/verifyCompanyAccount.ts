import asyncHandler from "express-async-handler";
import { UserSchema } from "../models";

export const checkCmpAccount = asyncHandler(async (req, res, next) => {
  const { id } = req.user!;

  const user = await UserSchema.findById(id, { isCompanyAccount: 1 });

  if (!user) return res.status(404).json({ message: "Utente eliminato" });

  const isReqRestaurant = req.originalUrl.startsWith("/api/restaurants");
  const isReqUser = req.originalUrl.startsWith("/api/users");

  if (isReqRestaurant && !user.isCompanyAccount)
    return res.status(401).json({
      message: "Per gestire un ristorante necessiti di un account aziendale",
    });

  if (isReqUser && user.isCompanyAccount)
    return res.status(401).json({
      message: "Puoi gestire solo il tuo ristorante",
    });

  next();
});
