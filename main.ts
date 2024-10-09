import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import { connectDB } from "./config/mongoDB";
import { authRouter, restaurantsRouter, userRouter } from "./routes";
import "./config/cloudinary";
import { corsOptions } from "./config/corsOptions";

dotenv.config();

const PORT = process.env.SERVER_PORT || 5000;

const app = express();

app.use(cookieParser());
app.use(cors(corsOptions));
app.use(express.urlencoded({ extended: true }));

app.use("/api/users", userRouter);

app.use(express.json());

app.use("/api/auth", authRouter);
app.use("/api/restaurants", restaurantsRouter);

connectDB()
  .then(() => {
    console.log(`✅ Database connected succesfully`);
    app.listen(PORT, () => console.log(`✅ Server online on PORT: ${PORT}`));
  })
  .catch((err) => console.error(err));
