import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { AuthSchema, RestaurantSchema, UserSchema } from "../models";
import { setJwtCookie, signJwt } from "../lib/utils";
import jwt from "jsonwebtoken";
import { GoogleUserData, UserRefreshToken } from "../types";
import axios from "axios";
import {
  sendPasswordResetEmail,
  sendPasswordResetSuccessfullyEmail,
  sendVerificationEmail,
  sendWelcomeEmail,
} from "../lib/mailtrap/mailFns";

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
      emailVerified: true,
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
      emailVerified: user.emailVerified,
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
      emailVerified: user.emailVerified,
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
    email: { $regex: new RegExp(userEmail, "i") },
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

  const emailVerificationToken = Math.floor(
    100000 + Math.random() * 900000
  ).toString();

  const emailRes = await sendVerificationEmail(
    req.body.email,
    req.body.name,
    emailVerificationToken
  );

  if (!emailRes.success) {
    res
      .status(400)
      .json({ message: "Errore nell'invio dell'email di verifica" });
    return;
  }

  const user = await UserSchema.create({
    ...req.body,
    password: hashedPassword,
    isCompanyAccount: false,
  });

  await AuthSchema.create({
    userId: user._id,
    emailVerification: {
      token: emailVerificationToken,
      expiresAt: Date.now() + 24 * 60 * 60 * 1000,
    },
  });

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
      emailVerified: false,
    },
    "1d"
  );
  const refreshToken = signJwt(
    { id: user._id.toString(), email: user.email },
    "30d"
  );

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

      const user = await UserSchema.findById(decodedToken?.id);

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
          emailVerified: user.emailVerified,
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

export const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.body;

  if (req.user!.emailVerified) {
    res.status(400).json({ message: "Hai gia verificato l'email" });
    return;
  }

  if (!token) {
    res.status(404).json({ message: "Missing token" });
    return;
  }

  const userAuth = await AuthSchema.findOne({
    userId: req.user!.id,
    "emailVerification.token": token,
    "emailVerification.expiresAt": { $gt: Date.now() },
  });

  if (!userAuth) {
    res.status(404).json({ message: "Codice invalido o scaduto" });
    return;
  }

  await userAuth.updateOne({
    emailVerification: { token: null, expiresAt: null },
  });
  const user = await UserSchema.findOneAndUpdate(
    { _id: userAuth.userId },
    { emailVerified: true }
  );

  await sendWelcomeEmail(user!.email, user!.name);

  res.status(200).json({ message: "Email verificata con successo" });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    res.status(400).json({ message: "missing email" });
    return;
  }

  const user = await UserSchema.findOne({ email });

  if (!user) {
    res.status(404).json({ message: "Utente non trovato" });
    return;
  }

  let userAuth = await AuthSchema.findOne({ userId: user._id });

  const password = {
    token: crypto.randomBytes(20).toString("hex"),
    expiresAt: Date.now() + 1 * 60 * 60 * 1000,
  };

  if (!userAuth) {
    userAuth = await AuthSchema.create({
      userId: user._id,
      password,
    });
  } else {
    await userAuth.updateOne({ password });
  }

  await sendPasswordResetEmail(
    user.email,
    user.name,
    `${process.env.CLIENT_URL}/reset-password/${password.token}`
  );

  res.status(200).json({
    message:
      "Una email con un codice di verifica e' stata mandata alla tua casella di posta",
  });
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { token, email, newPassword } = req.body;

  if (!token || !newPassword || !email) {
    res
      .status(400)
      .json({ message: "missing password reset token, newPassword or email" });
    return;
  }

  const authUser = await AuthSchema.findOne({
    "password.token": token,
    "password.expiresAt": { $gt: Date.now() },
  });

  if (!authUser) {
    res.status(404).json({ message: "Token invalido o scaduto" });
    return;
  }

  const user = await UserSchema.findOne(
    { _id: authUser.userId, email },
    { _id: 1, email: 1, name: 1 }
  );

  if (!user) {
    res.status(404).json({ message: "Utente non trovato" });
    return;
  }

  await authUser
    .updateOne({ password: { token: null, expiresAt: null } })
    .lean();

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await user.updateOne({ password: hashedPassword }).lean();

  await sendPasswordResetSuccessfullyEmail(user!.email, user!.name);

  res.status(200).json({ message: "Password reimpostata con successo" });
});
