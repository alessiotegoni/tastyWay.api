import { CorsOptions } from "cors";

const allowedOrigins = ["http://localhost:5173"];

export const corsOptions: CorsOptions = {
  credentials: true,
  origin: (reqOrigin, callback) => {
    if (reqOrigin && allowedOrigins.includes(reqOrigin))
      return callback(null, true);

    callback(new Error('Not allowed by CORS'))
  },
};
