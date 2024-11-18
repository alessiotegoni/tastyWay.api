import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import bcrypt from "bcrypt";
import { RestaurantSchema, UserSchema } from "../models";
import { setJwtCookie, signJwt } from "../lib/utils";
import jwt from "jsonwebtoken";
import { GoogleUserData, UserRefreshToken } from "../types";
import axios from "axios";

export const googleAuth = asyncHandler(async (req, res) => {
  const googleAccessToken = req.body?.access_token;

  let userData: Partial<GoogleUserData> | undefined = req.body?.userData;

  if (!userData && !googleAccessToken) {
    res
      .status(404)
      .json({ message: "google user data or access_token missing" });
    return;
  }

  if (!userData && googleAccessToken) {
    userData = (
      await axios.get<GoogleUserData>(
        `https://www.googleapis.com/oauth2/v3/userinfo`,
        {
          headers: { Authorization: `Bearer ${googleAccessToken}` },
        }
      )
    ).data;
  }

  if (!userData?.email || !userData?.given_name || !userData?.family_name) {
    res.status(404).json({ message: "Il tuo account google non e' valido" });
    return;
  }

  const { email, given_name, family_name, picture } = userData;

  let user = await UserSchema.findOne({ email }).lean();

  if (!user) {
    user = await UserSchema.create({
      email,
      name: given_name,
      surname: family_name,
      profileImg: picture,
    });
  }

  let restaurantName: string | undefined;
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
      name: user.name,
      surname: user.surname,
      address: user.address ?? "",
      imageUrl,
      restaurantName,
      isGoogleLogged: true,
      isCmpAccount: user.isCompanyAccount,
      createdAt,
    },
    "1d"
  );

  const refreshToken = signJwt(
    { id: user._id.toString(), email: user.email },
    "17d"
  );

  if (!accessToken || !refreshToken) {
    throw Error("Error while generating jwt token");
  }

  setJwtCookie(refreshToken, res);

  res.status(201).json(accessToken);
});

export const signIn = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await UserSchema.findOne(
    { email },
    {
      phoneNumber: 0,
    }
  ).lean();

  if (!user) {
    res.status(401).json({ message: `Email o password errata` });
    return;
  }

  if (!user.password) {
    res.status(404).json({
      message:
        "Logga col tuo account google e crea una password sulla sezione sicurezza del tuo profilo",
    });
    return;
  }

  const passwordMatchs = await bcrypt.compare(password, user.password);

  if (!passwordMatchs) {
    res.status(401).json({ message: "Email o password errata" });
    return;
  }

  let restaurantName: string | undefined;
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
      isGoogleLogged: !user?.password,
      address: user.address ?? "",
      isCmpAccount: user.isCompanyAccount,
    },
    "1d"
  );

  const refreshToken = signJwt(
    { id: user._id.toString(), email: user.email },
    "17d"
  );

  if (!accessToken || !refreshToken) {
    throw Error("Error while generating jwt token");
  }

  setJwtCookie(refreshToken, res);

  res.status(201).json(accessToken);
});

export const signUp = asyncHandler(async (req, res) => {
  const { phoneNumber, email: userEmail, password } = req.body;

  const emailExist = await UserSchema.exists({
    email: { $regex: new RegExp(`^${userEmail.toLowerCase()}$`, "i") },
  }).lean();

  if (emailExist) {
    res
      .status(401)
      .json({ message: `Questa email e' gia' associata ad un'altro account` });
    return;
  }

  const phoneExist = await UserSchema.exists({ phoneNumber }).lean();
  if (phoneExist) {
    res.status(401).json({
      message: `Questo numero di telefono e' gia' associato ad un'altro account`,
    });
    return;
  }

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
      address: user.address!,
      isGoogleLogged: false,
      isCmpAccount: false,
    },
    "1d"
  );
  const refreshToken = signJwt({ id, email }, "30d");

  if (!accessToken || !refreshToken) {
    throw Error("Error while generating jwt token");
  }

  setJwtCookie(refreshToken, res);

  res.status(201).json(accessToken);
});

export const refreshToken = asyncHandler(
  async (req: Request, res: Response) => {
    const { jwt: refreshToken } = req?.cookies;

    if (!refreshToken) {
      res.status(401).json({ message: "Missing refresh token" });
      return;
    }

    try {
      const decodedToken = jwt.verify(
        refreshToken,
        process.env.JWT_TOKEN_SECRET as string
      ) as UserRefreshToken;

      const user = await UserSchema.findById(decodedToken?.id).lean();

      if (!user || user.email !== decodedToken.email) {
        res.status(401).json({ message: "Invalid token" });
        return;
      }

      let restaurantName: string | undefined;
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
          address: user.address ?? "",
          isGoogleLogged: !user?.password,
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

  if (!jwt) {
    res.status(404).json({ message: "Utente gia' sloggato" });
    return;
  }

  res.clearCookie("jwt", { httpOnly: true, secure: true });

  res.status(200).json({ message: "Sloggato con successo" });
};
