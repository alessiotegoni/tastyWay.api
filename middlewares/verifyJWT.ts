import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { UserAccessToken } from "../types";
import asyncHandler from "express-async-handler";
import { UserSchema } from "../models";

export const verifyJWT = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const authHeader =
      req.headers.authorization ||
      (req.headers["Authorization"] as string | undefined);

    if (!authHeader?.startsWith("Bearer "))
      return res.status(401).json({ message: "missing token" });

    const token = authHeader.split(" ").at(1);

    if (!token) return res.status(401).json({ message: "missing token" });

    try {
      const decodedToken = jwt.verify(
        token,
        process.env.JWT_TOKEN_SECRET as string
      ) as UserAccessToken;

      const user = await UserSchema.findById(decodedToken?.id, { email: 1 });

      if (!user || user.email !== decodedToken.email)
        return res.status(401).json({ message: "Utente non esistente" });

      req.user = decodedToken;

      next();
    } catch (err) {
      res.status(401).json({ message: "Token expired" });
    }
  }
);
