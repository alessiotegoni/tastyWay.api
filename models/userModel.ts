import { model, Schema } from "mongoose";
import { UserDocument } from "../types/documentTypes";

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
    emailVerified: {
      type: Boolean,
      default: false,
    },
    isCompanyAccount: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// UserSchema.index(
//   { phoneNumber: 1 },
//   {
//     unique: true,
//     partialFilterExpression: { phoneNumber: { $exists: true, $ne: null } },
//   }
// );

export default model<UserDocument>("users", UserSchema);
