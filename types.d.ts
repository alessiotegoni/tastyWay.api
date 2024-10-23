import { Request } from "express";
import { JwtPayload } from "jsonwebtoken";
import { OrderSchema } from "./models";
import { Document, Types } from "mongoose";

// export interface RequestWithJwt extends Request {
//   user?: {
//     id: string;
//     email: string;
//     name: string;
//     surname: string;
//   };
// }

export type UserAccessToken = {
  id: string;
  email: string;
  restaurantName?: string;
  imageUrl?: string;
  name: string;
  surname: string;
  address: string;
  isCmpAccount: boolean;
  createdAt: NativeDate;
};

export type UserRefreshToken = {
  id: string;
  email: string;
};

export interface OrderDocument extends Document {
  customerId: Types.ObjectId;
  restaurantId: Types.ObjectId;
  status: string;
  address: string;
  totalPrice: number;
  items: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface RestaurantDocument extends Document {
  //   ownerId: string;
  //   name: string;
  //   address: {
  //     street: string;
  //     city: string;
  //     country: string;
  //   };
  //cuisine: string[];
  imageUrl: string;
  _id: Types.ObjectId;
  deliveryInfo: {
    //price: number;
    time: number;
  };
  items: DBOrderItem[];
  //   createdAt?: Date;
  //   updatedAt?: Date;
}

declare global {
  namespace Express {
    interface Request {
      user?: UserAccessToken & JwtPayload;
      restaurant: RestaurantDocument;
      order?: OrderDocument;
      files?: Express.Multer.File[];
      coords?: [number, number];
    }
  }
}

export type newOrderItem = {
  description: string;
} & Omit<SingleOrderItem, "_id" | "quantity">;

export type oldOrderItem = {
  description: string;
} & Omit<SingleOrderItem, "quantity">;

// Items di tutti gli ordini

export type OrderItem = {
  _id?: Types.ObjectId;
  name: string;
  quantity: number;
};

// Items dell'ordine singolo

export type SingleOrderItem = {
  img?: string;
  price: number;
} & OrderItem;

export type DBOrderItem = Omit<SingleOrderItem, "quantity"> & {
  description: string;
  type: string;
};

// Ordine singolo

export type RestaurantOrder = {
  clientFullName: string;
  orderId: string;
  address: string;
  status: string;
  totalPrice: number;
  expectedTime: Date;
  items: (OrderItem | SingleOrderItem)[];
};

export enum FoodType {
  PIZZA = "pizza",
  SUSHI = "sushi",
  BURGER = "burger",
  DESSERT = "dessert",
  ITALIAN = "italian",
  CHINESE = "chinese",
  MEXICAN = "mexican",
  INDIAN = "indian",
  MEDITERRANEAN = "mediterranean",
  VEGETARIAN = "vegetarian",
  VEGAN = "vegan",
  FAST_FOOD = "fast_food",
  SEAFOOD = "seafood",
  BBQ = "bbq",
  HEALTHY = "healthy",
  STEAKHOUSE = "steakhouse",
  BREAKFAST = "breakfast",
  BAKERY = "bakery",
  THAI = "thai",
}

export enum RestaurantType {
  CHEAP = "cheap",
  EXPENSIVE = "expensive",
  TOP_RATED = "top_rated",
  FAST_DELIVERY = "fast_delivery",
  NEW = "new",
  TRENDING = "trending",
}

export type RestautantFilters = {
  name: string | null;
  foodType: FoodType[] | null;
  restaurantType: RestaurantType[] | null;
};

export enum RestaurantItemsTypes {
  PIZZA = "pizza",
  BURGER = "burger",
  PASTA = "pasta",
  SALAD = "salad",
  SANDWICH = "sandwich",
  FLATBREAD = "flatbread",
  FRIED_FOOD = "fried_food",
  SUSHI = "sushi",
  APPETIZERS = "appetizers",
  DESSERTS = "desserts",
  DRINKS = "drinks",
  BBQ = "bbq",
  SEAFOOD = "seafood",
  MEAT = "meat",
  SOUP = "soup",
  VEGAN = "vegan",
  VEGETARIAN = "vegetarian",
  GLUTEN_FREE = "gluten_free",
  FRUIT = "fruit",
  TAPAS = "tapas",
  SANDWICHES = "sandwiches",
  RICE = "rice",
  POKE = "poke",
  MAIN_COURSE = "main_course",
}

export type RestaurantItemsFilters = {
  name: string | null;
  itemsType: RestaurantItemsType[] | null;
};

// Tutti gli ordini

// declare global {}: Questa dichiarazione indica che stai modificando le dichiarazioni globali in TypeScript, il che significa che stai aggiungendo o modificando qualcosa che dovrebbe essere disponibile in tutto il progetto. In questo caso, stai aggiungendo una nuova proprietà alla classe Request di Express, che rappresenta ogni richiesta HTTP che arriva al server.

// namespace Express {}: namespace è una parola chiave TypeScript che permette di organizzare i tipi sotto un nome comune. Qui stai specificando il namespace di Express, che contiene tutti i tipi correlati a questa libreria. Estendendo Express, stai dicendo a TypeScript di aggiungere nuove informazioni al namespace già esistente.

// interface Request {}: Stai modificando l'interfaccia Request di Express, che rappresenta l'oggetto req che ricevi nei middleware o nei gestori delle rotte. Stai aggiungendo una nuova proprietà chiamata user, che potrebbe non essere presente (? indica che è opzionale).
