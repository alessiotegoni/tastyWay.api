import { CorsOptions } from "cors";

const allowedOrigins = [process.env.CLIENT_URL!];

export const corsOptions: CorsOptions = {
  credentials: true,
  origin: (reqOrigin, callback) => {
    if (!reqOrigin) return callback(null, true);

    if (allowedOrigins.includes(reqOrigin)) return callback(null, true);

    callback(new Error(`Not allowed by CORS => [${reqOrigin}]`));
  },
};
