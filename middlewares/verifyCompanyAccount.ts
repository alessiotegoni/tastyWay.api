import asyncHandler from "express-async-handler";
import { UserSchema } from "../models";

export const checkCmpAccount = asyncHandler(async (req, res, next) => {
  const { id } = req.user!;

  const user = await UserSchema.findById(id, { isCompanyAccount: 1 }).lean();

  if (!user) {
    res.status(404).json({ message: "Utente eliminato" });
    return;
  }

  const isReqRestaurant = req.originalUrl.startsWith("/api/restaurants");
  const isReqUser = req.originalUrl.startsWith("/api/users");

  if (isReqRestaurant && !user.isCompanyAccount) {
    res.status(401).json({
      message: "Per gestire un ristorante necessiti di un account aziendale",
    });
    return;
  }

  if (isReqUser && user.isCompanyAccount) {
    res.status(401).json({
      message: "Puoi gestire solo il tuo ristorante",
    });
    return;
  }

  next();
});
