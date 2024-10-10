import { model, Schema } from "mongoose";

const OrderSchema = new Schema(
  {
    customerId: {
      type: String,
      ref: "users",
      required: true,
      trim: true,
    },
    restaurantId: {
      type: String,
      ref: "restaurants",
      required: true,
      trim: true,
    },
    status: {
      type: String, 
      enum: [
        "In attesa",
        "Accettato",
        "In preparazione",
        "In consegna",
        "Consegnato",
      ],
      trim: true,
      default: "In attesa",
    },
    address: {
      type: String,
      required: true,
    },
    totalPrice: {
      type: Number,
      required: true,
      trim: true,
      min: 0,
    },
    items: {
      type: [
        {
          type: String,
          ref: "menuItems",
          _id: false,
        },
      ],
      required: true,
    },
  },
  { timestamps: true }
);

export default model("orders", OrderSchema);
