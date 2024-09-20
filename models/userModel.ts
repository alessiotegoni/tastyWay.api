import { model, Schema } from "mongoose";

const UserSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    surname: {
      type: String,
      required: true,
      trim: true,
    },
    profileImg: {
      type: String,
      required: false,
    },
    address: {
      type: String,
      required: true,
      trim: true
    },
    phoneNumber: {
      type: Number,
      required: true,
      trim: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    isCompanyAccount: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export default model("users", UserSchema);
