import { model, Schema } from "mongoose";
import { MenuItemSchema } from "./menuItemModel";

const restaurantModel = new Schema(
  {
    ownerId: {
      type: String,
      ref: "users",
      required: true,
      trim: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
      unique: true,
    },
    imageUrl: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        required: true,
      },
      coordinates: {
        _id: false,
        type: [Number, Number],
        required: true,
      },
    },
    deliveryInfo: {
      price: {
        type: Number,
        required: true,
        trim: true,
        min: 0,
      },
      time: {
        type: Number,
        required: true,
        trim: true,
        min: 0,
      },
    },
    cuisine: {
      type: [String],
      required: true,
    },
    items: {
      type: [MenuItemSchema],
      required: true,
    },
  },
  { timestamps: true }
);

restaurantModel.index({ location: "2dsphere" })

export default model("restaurants", restaurantModel);
