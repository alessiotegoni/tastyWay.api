import mongoose, { model, Schema } from "mongoose";

const authSchema = new Schema(
  {
    userId: {
      type: mongoose.Types.ObjectId,
      ref: "users",
      unique: true,
      required: true,
    },
    password: {
      token: String,
      expiresAt: Date,
    },
    emailVerification: {
      token: String,
      expiresAt: Date,
    },
  },
  { timestamps: true }
);

export default model("auth", authSchema);
