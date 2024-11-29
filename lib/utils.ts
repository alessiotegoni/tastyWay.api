import jwt from "jsonwebtoken";
import { Response } from "express";
import multer from "multer";
import { v2 as cloudinary, UploadApiOptions } from "cloudinary";
import { UserAccessToken, UserRefreshToken } from "../types/userTypes";
import { DBOrderItem, OrderItem, SingleOrderItem } from "../types/orderTypes";

type UserJwtType = UserAccessToken | UserRefreshToken;

export const signJwt = (user: UserJwtType, expiresIn: string) => {
  const token = jwt.sign(user, process.env.JWT_TOKEN_SECRET as string, {
    expiresIn,
  });

  return token;
};

export const setJwtCookie = (token: string, res: Response) => {
  const isProduction = process.env.NODE_ENV === "production";

  // sameSite: "none", richiede secure: true.

  res.cookie("jwt", token, {
    httpOnly: true, // Impedisce l'accesso ai cookie tramite JavaScript (sicurezza)
    secure: isProduction, // Solo HTTPS in produzione
    sameSite: isProduction ? "none" : "lax", // Protezione contro attacchi CSRF
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

export const uploadSingleImg = (fieldName: string) => {
  const storage = multer.memoryStorage();
  const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
  });

  return upload.single(fieldName);
};

export const uploadMultImgs = () => {
  const storage = multer.memoryStorage();
  const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
  });

  return upload.any();
};

export const calcExpectedTime = (
  orderTimestamp: Date,
  restaurantDT: number = 40 // DeliveryTime
) => {
  const deliveryTime = new Date(orderTimestamp);

  deliveryTime.setMinutes(deliveryTime.getMinutes() + restaurantDT + 20);

  return deliveryTime;
};

export const calcItemsQuantities = (array: string[]) => {
  const itemQuantities: Record<string, number> = {};

  array.forEach((item) => {
    // Se l'item esiste già nell'oggetto, aumenta la quantità, altrimenti imposta a 1
    itemQuantities[item] = (itemQuantities[item] || 0) + 1;
  });

  return itemQuantities;
};

export const calcTotalPrice = (
  items: SingleOrderItem[],
  deliveryPrice: number
) =>
  items.reduce((total, item) => total + item.quantity * item.price, 0) +
  deliveryPrice;

type ItemType<T> = T extends "FULL" ? SingleOrderItem : OrderItem;

export const getItems = <T extends "FULL" | "NAME_QUANTITY">(
  orderItemIds: string[],
  restaurantItems: DBOrderItem[],
  type: T
): ItemType<T>[] => {
  const items: ItemType<T>[] = [];

  const itemsQnts = calcItemsQuantities(orderItemIds);

  Object.keys(itemsQnts).forEach((itemId) => {
    restaurantItems.forEach(({ _id, name, img, price }) => {
      if (_id?.toString() !== itemId) return;

      const baseItem: OrderItem = {
        _id,
        name,
        quantity: itemsQnts[itemId],
      };

      const item =
        type === "FULL"
          ? {
              ...baseItem,
              img,
              price,
            }
          : baseItem;

      items.push(item as ItemType<T>);
    });
  });

  return items;
};

export const uploadImg = async (
  img: Express.Multer.File,
  uploadOptions?: UploadApiOptions
) => {
  const base64Image = Buffer.from(img.buffer).toString("base64");
  const dataURI = `data:${img.mimetype};base64,${base64Image}`;
  const uploadResponse = await cloudinary.uploader.upload(
    dataURI,
    uploadOptions
  );

  return uploadResponse.secure_url;
};
