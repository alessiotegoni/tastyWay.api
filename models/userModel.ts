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
    },
    address: {
      type: String,
      trim: true,
    },
    phoneNumber: {
      type: Number,
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
      minlength: 6,
    },
    isCompanyAccount: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

UserSchema.index(
  { phoneNumber: 1 },
  {
    unique: true,
    partialFilterExpression: { phoneNumber: { $exists: true, $ne: null } },
  }
);

export default model("users", UserSchema);
