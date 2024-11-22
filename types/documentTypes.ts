import { Document, Types } from "mongoose";
import { DBOrderItem } from "./orderTypes";

export interface OrderDocument extends Document {
  _id: Types.ObjectId;
  customerId: Types.ObjectId;
  restaurantId: Types.ObjectId;
  status: string;
  address: string;
  totalPrice: number;
  items: string[];
  createdAt: NativeDate;
  updatedAt: NativeDate;
}

export interface UserDocument extends Document {
  _id: Types.ObjectId;
  name: string;
  surname: string;
  profileImg?: string;
  address?: string;
  phoneNumber?: number;
  email: string;
  password?: string;
  emailVerified: boolean;
  isCompanyAccount: boolean;
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
  _id: Types.ObjectId;
  imageUrl: string;
  deliveryInfo: {
    //price: number;
    time: number;
  };
  items: DBOrderItem[];
  //   createdAt?: Date;
  //   updatedAt?: Date;
}
