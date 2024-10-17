import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import bcrypt from "bcrypt";
import { RestaurantSchema, UserSchema } from "../models";
import { setJwtCookie, signJwt } from "../lib/utils";
import jwt from "jsonwebtoken";
import { UserRefreshToken } from "../types";

export const signIn = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await UserSchema.findOne(
    { email },
    {
      phoneNumber: 0,
    }
  ).lean();

  if (!user)
    return res.status(401).json({ message: `Email o password errata` });

  const passwordMatchs = await bcrypt.compare(password, user.password);

  if (!passwordMatchs)
    return res.status(401).json({ message: "Email o password errata" });

  let restaurantName;

  let imageUrl = user?.profileImg ?? undefined;
  let createdAt = user.createdAt;

  if (user.isCompanyAccount) {
    const userRestaurant = await RestaurantSchema.findOne(
      { ownerId: user._id },
      { name: 1, imageUrl: 1, createdAt: 1 }
    ).lean();

    if (userRestaurant) {
      restaurantName = userRestaurant.name;
      imageUrl = userRestaurant.imageUrl;
      createdAt = userRestaurant.createdAt;
    }
  }

  const accessToken = signJwt(
    {
      id: user._id.toString(),
      email: user.email,
      restaurantName,
      imageUrl,
      createdAt,
      name: user.name,
      surname: user.surname,
      address: user.address,
      isCmpAccount: user.isCompanyAccount,
    },
    "1d"
  );

  const refreshToken = signJwt(
    { id: user._id.toString(), email: user.email },
    "17d"
  );

  if (!accessToken || !refreshToken)
    throw Error("Error while generating jwt token");

  setJwtCookie(refreshToken, res);

  res.status(201).json(accessToken);
});

export const signUp = asyncHandler(async (req, res) => {
  const { phoneNumber, email: userEmail, password } = req.body;

  const emailExist = await UserSchema.exists({
    email: { $regex: new RegExp(`^${userEmail.toLowerCase()}$`, "i") },
  }).lean();

  if (emailExist)
    return res
      .status(401)
      .json({ message: `Questa email e' gia' associata ad un'altro account` });

  const phoneExist = await UserSchema.exists({ phoneNumber }).lean();
  if (phoneExist)
    return res.status(401).json({
      message: `Questo numero di telefono e' gia' associato ad un'altro account`,
    });

  const hashedPassword = await bcrypt.hash(password, 10);

  const { isCompanyAccount, ...restBody } = req.body;

  const user = await UserSchema.create({
    ...restBody,
    password: hashedPassword,
  });

  const { id, email } = user;

  const accessToken = signJwt(
    {
      id: user._id.toString(),
      email: user.email,
      createdAt: user.createdAt,
      name: user.name,
      surname: user.surname,
      address: user.address,
      isCmpAccount: user.isCompanyAccount,
    },
    "1d"
  );
  const refreshToken = signJwt({ id, email }, "30d");

  if (!accessToken || !refreshToken)
    throw Error("Error while generating jwt token");

  setJwtCookie(refreshToken, res);

  return res.status(201).json(accessToken);
});

export const refreshToken = asyncHandler(
  async (req: Request, res: Response) => {
    const { jwt: refreshToken } = req?.cookies;

    if (!refreshToken)
      return res.status(401).json({ message: "Missing refresh token" });

    try {
      const decodedToken = jwt.verify(
        refreshToken,
        process.env.JWT_TOKEN_SECRET as string
      ) as UserRefreshToken;

      const user = await UserSchema.findById(decodedToken?.id, {
        _id: 1,
        email: 1,
        name: 1,
        surname: 1,
        address: 1,
        isCompanyAccount: 1,
      }).lean();

      if (!user || user.email !== decodedToken.email) return res.status(401);

      let restaurantName;

      let imageUrl = user?.profileImg ?? undefined;
      let createdAt = user.createdAt;

      if (user.isCompanyAccount) {
        const userRestaurant = await RestaurantSchema.findOne(
          { ownerId: user._id.toString() },
          { name: 1, imageUrl: 1, createdAt: 1 }
        ).lean();

        if (userRestaurant) {
          restaurantName = userRestaurant.name;
          imageUrl = userRestaurant.imageUrl;
          createdAt = userRestaurant.createdAt;
        }
      }

      const accessToken = signJwt(
        {
          id: user._id.toString(),
          email: user.email,
          restaurantName,
          imageUrl,
          createdAt,
          name: user.name,
          surname: user.surname,
          address: user.address,
          isCmpAccount: user.isCompanyAccount,
        },
        "1d"
      );

      res.status(201).json(accessToken);
    } catch (err) {
      res.status(401).json({ message: "Login scaduto" });
    }
  }
);

export const logout = (req: Request, res: Response) => {
  const { jwt } = req?.cookies;

  if (!jwt) return res.status(404).json({ message: "Utente gia' sloggato" });

  res.clearCookie("jwt", { httpOnly: true, secure: true });

  res.status(200).json({ message: "Sloggato con successo" });
};
