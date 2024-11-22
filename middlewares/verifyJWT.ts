import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { UserAccessToken } from "../types/userTypes";
import asyncHandler from "express-async-handler";
import { UserSchema } from "../models";

export const verifyJWT = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const authHeader =
      req.headers.authorization ||
      (req.headers["Authorization"] as string | undefined);

    if (!authHeader?.startsWith("Bearer ")) {
      res.status(401).json({ message: "missing token" });
      return;
    }

    const token = authHeader.split(" ").at(1);

    if (!token) {
      res.status(401).json({ message: "missing auth token" });
      return;
    }

    try {
      const decodedToken = jwt.verify(
        token,
        process.env.JWT_TOKEN_SECRET!
      ) as UserAccessToken;

      const user = await UserSchema.findById(decodedToken?.id);

      if (!user || user.email !== decodedToken.email) {
        res.status(401).json({ message: "Utente non esistente" });
        return;
      }

      req.user = user;

      next();
    } catch (err) {
      res.status(401).json({ message: "Token expired" });
    }
  }
);
