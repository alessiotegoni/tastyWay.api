import { Types } from "mongoose";

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
